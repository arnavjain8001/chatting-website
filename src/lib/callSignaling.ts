import {
  doc,
  setDoc,
  onSnapshot,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Contact } from '../types';

export interface CallSignalData {
  callId: string;
  caller: Contact;
  receiver: Contact;
  type: 'video' | 'voice';
  status: 'ringing' | 'accepted' | 'declined' | 'ended';
  createdAt: number;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
}

const BROADCAST_CHANNEL_NAME = 'whatsapp_call_signals_v1';
let broadcastChannel: BroadcastChannel | null = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel not supported or error initializing:', e);
  }
}

// 1. Initiate a Call
export async function initiateCall(
  caller: Contact,
  receiver: Contact,
  type: 'video' | 'voice'
): Promise<string> {
  const callId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const callData: CallSignalData = {
    callId,
    caller,
    receiver,
    type,
    status: 'ringing',
    createdAt: Date.now(),
  };

  // Broadcast locally for instant multi-tab response
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'INCOMING_CALL', data: callData });
  }

  // Persist call session to Firestore if available
  if (db) {
    try {
      const callRef = doc(db, 'calls', callId);
      await setDoc(callRef, {
        ...callData,
        timestamp: serverTimestamp(),
      });
    } catch (e: any) {
      if (e?.code === 'permission-denied' || e?.message?.includes('permissions')) {
        console.info('[Firestore Call Signaling] Call signal init restricted. Using local broadcast.');
      } else {
        console.warn('Firestore call signal init error:', e);
      }
    }
  }

  return callId;
}

// 2. Listen for Incoming Calls
export function subscribeToIncomingCalls(
  currentUserId: string,
  onIncomingCall: (call: CallSignalData) => void
): () => void {
  const handledCallIds = new Set<string>();

  // BroadcastChannel listener
  const handleBroadcast = (event: MessageEvent) => {
    if (event.data?.type === 'INCOMING_CALL') {
      const callData = event.data.data as CallSignalData;
      if (
        callData &&
        callData.status === 'ringing' &&
        callData.caller.id !== currentUserId &&
        !handledCallIds.has(callData.callId)
      ) {
        handledCallIds.add(callData.callId);
        onIncomingCall(callData);
      }
    } else if (event.data?.type === 'CALL_STATUS_CHANGED') {
      // Handle remote status updates
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcast);
  }

  // Firestore listener
  let unsubscribeFirestore = () => {};
  if (db) {
    try {
      const callsColRef = collection(db, 'calls');
      unsubscribeFirestore = onSnapshot(
        callsColRef,
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added' || change.type === 'modified') {
              const data = change.doc.data() as CallSignalData;
              if (
                data &&
                data.status === 'ringing' &&
                data.caller.id !== currentUserId &&
                !handledCallIds.has(data.callId) &&
                Date.now() - (data.createdAt || 0) < 60000 // only recent calls within 1 min
              ) {
                handledCallIds.add(data.callId);
                onIncomingCall(data);
              }
            }
          });
        },
        (error: any) => {
          if (error?.code === 'permission-denied' || error?.message?.includes('permissions')) {
            console.info('[Firestore Call Signaling] Restricted backend permissions. Falling back to local/broadcast signaling.');
          } else {
            console.warn('Firestore incoming call listener error:', error);
          }
        }
      );
    } catch (e: any) {
      if (e?.code === 'permission-denied' || e?.message?.includes('permissions')) {
        console.info('[Firestore Call Signaling] Restricted backend permissions.');
      } else {
        console.warn('Firestore incoming call listener error:', e);
      }
    }
  }

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcast);
    }
    unsubscribeFirestore();
  };
}

// 3. Update Call Status (Accept, Decline, End)
export async function updateCallStatus(
  callId: string,
  status: 'accepted' | 'declined' | 'ended'
) {
  if (broadcastChannel) {
    broadcastChannel.postMessage({
      type: 'CALL_STATUS_CHANGED',
      callId,
      status,
    });
  }

  if (db) {
    try {
      const callRef = doc(db, 'calls', callId);
      await updateDoc(callRef, { status });
    } catch (e: any) {
      if (e?.code === 'permission-denied' || e?.message?.includes('permissions')) {
        console.info('[Firestore Call Signaling] Call status update restricted by backend rules.');
      } else {
        console.warn('Firestore update call status error:', e);
      }
    }
  }
}

// 4. Listen to single call state changes
export function subscribeToCallState(
  callId: string,
  onStateUpdate: (status: 'ringing' | 'accepted' | 'declined' | 'ended', data?: CallSignalData) => void
): () => void {
  const handleBroadcast = (event: MessageEvent) => {
    if (event.data?.type === 'CALL_STATUS_CHANGED' && event.data?.callId === callId) {
      onStateUpdate(event.data.status);
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcast);
  }

  let unsubscribeFirestore = () => {};
  if (db) {
    try {
      const callRef = doc(db, 'calls', callId);
      unsubscribeFirestore = onSnapshot(
        callRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as CallSignalData;
            if (data && data.status) {
              onStateUpdate(data.status, data);
            }
          }
        },
        (error: any) => {
          if (error?.code === 'permission-denied' || error?.message?.includes('permissions')) {
            console.info('[Firestore Call Signaling] Call state listener restricted by backend rules.');
          } else {
            console.warn('Firestore call state listener error:', error);
          }
        }
      );
    } catch (e: any) {
      if (e?.code === 'permission-denied' || e?.message?.includes('permissions')) {
        console.info('[Firestore Call Signaling] Subscribe to call state restricted.');
      } else {
        console.warn('Firestore subscribe to call state error:', e);
      }
    }
  }

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcast);
    }
    unsubscribeFirestore();
  };
}

// 5. WebRTC Signaling Helpers for SDP Offer/Answer and ICE Candidates
export async function setCallOffer(callId: string, offer: RTCSessionDescriptionInit) {
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'WEBRTC_OFFER', callId, offer });
  }
  if (db) {
    try {
      const callRef = doc(db, 'calls', callId);
      await updateDoc(callRef, { offer: JSON.parse(JSON.stringify(offer)) });
    } catch (e: any) {
      if (e?.code === 'permission-denied' || e?.message?.includes('permissions')) {
        console.info('[Firestore Call Signaling] Set call offer restricted.');
      } else {
        console.warn('Set call offer error:', e);
      }
    }
  }
}

export async function setCallAnswer(callId: string, answer: RTCSessionDescriptionInit) {
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'WEBRTC_ANSWER', callId, answer });
  }
  if (db) {
    try {
      const callRef = doc(db, 'calls', callId);
      await updateDoc(callRef, { answer: JSON.parse(JSON.stringify(answer)) });
    } catch (e) {
      console.warn('Set call answer error:', e);
    }
  }
}

export async function sendIceCandidate(
  callId: string,
  candidate: RTCIceCandidate,
  role: 'caller' | 'receiver'
) {
  const candidateJson = candidate.toJSON();
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'ICE_CANDIDATE', callId, role, candidate: candidateJson });
  }
  if (db) {
    try {
      const subCol = role === 'caller' ? 'callerCandidates' : 'receiverCandidates';
      const candColRef = collection(db, 'calls', callId, subCol);
      await addDoc(candColRef, candidateJson);
    } catch (e: any) {
      if (e?.code === 'permission-denied' || e?.message?.includes('permissions')) {
        console.info('[Firestore Call Signaling] Send ICE candidate restricted.');
      } else {
        console.warn('Send ICE candidate error:', e);
      }
    }
  }
}

export function subscribeToWebRTCSignals(
  callId: string,
  role: 'caller' | 'receiver',
  callbacks: {
    onOffer?: (offer: RTCSessionDescriptionInit) => void;
    onAnswer?: (answer: RTCSessionDescriptionInit) => void;
    onIceCandidate?: (candidate: RTCIceCandidateInit) => void;
  }
): () => void {
  let processedOfferSdp = '';
  let processedAnswerSdp = '';

  const handleBroadcast = (event: MessageEvent) => {
    if (event.data?.callId !== callId) return;

    if (event.data.type === 'WEBRTC_OFFER' && role === 'receiver' && callbacks.onOffer) {
      const sdp = event.data.offer?.sdp || JSON.stringify(event.data.offer);
      if (sdp && sdp !== processedOfferSdp) {
        processedOfferSdp = sdp;
        callbacks.onOffer(event.data.offer);
      }
    } else if (event.data.type === 'WEBRTC_ANSWER' && role === 'caller' && callbacks.onAnswer) {
      const sdp = event.data.answer?.sdp || JSON.stringify(event.data.answer);
      if (sdp && sdp !== processedAnswerSdp) {
        processedAnswerSdp = sdp;
        callbacks.onAnswer(event.data.answer);
      }
    } else if (event.data.type === 'ICE_CANDIDATE' && callbacks.onIceCandidate) {
      // Listen for opposing role candidates
      if (event.data.role !== role) {
        callbacks.onIceCandidate(event.data.candidate);
      }
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcast);
  }

  let unsubFirestoreCall = () => {};
  let unsubFirestoreCandidates = () => {};

  if (db) {
    try {
      const callRef = doc(db, 'calls', callId);
      unsubFirestoreCall = onSnapshot(
        callRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (role === 'receiver' && data.offer && callbacks.onOffer) {
              const sdp = data.offer?.sdp || JSON.stringify(data.offer);
              if (sdp && sdp !== processedOfferSdp) {
                processedOfferSdp = sdp;
                callbacks.onOffer(data.offer);
              }
            }
            if (role === 'caller' && data.answer && callbacks.onAnswer) {
              const sdp = data.answer?.sdp || JSON.stringify(data.answer);
              if (sdp && sdp !== processedAnswerSdp) {
                processedAnswerSdp = sdp;
                callbacks.onAnswer(data.answer);
              }
            }
          }
        },
        (error: any) => {
          if (error?.code === 'permission-denied' || error?.message?.includes('permissions')) {
            console.info('[Firestore Call Signaling] Call signal listener restricted.');
          } else {
            console.warn('Firestore call signal error:', error);
          }
        }
      );

      const otherSubCol = role === 'caller' ? 'receiverCandidates' : 'callerCandidates';
      const candColRef = collection(db, 'calls', callId, otherSubCol);
      unsubFirestoreCandidates = onSnapshot(
        candColRef,
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              callbacks.onIceCandidate?.(change.doc.data() as RTCIceCandidateInit);
            }
          });
        },
        (error: any) => {
          if (error?.code === 'permission-denied' || error?.message?.includes('permissions')) {
            console.info('[Firestore Call Signaling] ICE candidate listener restricted.');
          } else {
            console.warn('Firestore ICE candidate listener error:', error);
          }
        }
      );
    } catch (e: any) {
      if (e?.code === 'permission-denied' || e?.message?.includes('permissions')) {
        console.info('[Firestore Call Signaling] WebRTC signals subscription restricted.');
      } else {
        console.warn('Firestore WebRTC signals subscription error:', e);
      }
    }
  }

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcast);
    }
    unsubFirestoreCall();
    unsubFirestoreCandidates();
  };
}
