import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  ShieldCheck,
  Maximize2,
  Minimize2,
  RefreshCw,
  AlertCircle,
  GripHorizontal,
} from 'lucide-react';
import { Contact } from '../types';
import {
  setCallOffer,
  setCallAnswer,
  sendIceCandidate,
  subscribeToWebRTCSignals,
  updateCallStatus
} from '../lib/callSignaling';

interface CallScreenModalProps {
  isOpen: boolean;
  type: 'voice' | 'video';
  contact: Contact;
  currentUser?: Contact;
  callId?: string | null;
  role?: 'caller' | 'receiver';
  onEndCall: () => void;
  isDarkMode: boolean;
}

export const CallScreenModal: React.FC<CallScreenModalProps> = ({
  isOpen,
  type,
  contact,
  callId,
  role = 'caller',
  onEndCall,
}) => {
  const [callState, setCallState] = useState<'ringing' | 'connected' | 'ended'>('connected');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(type === 'voice');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [hasCameraError, setHasCameraError] = useState(false);
  const [isMirrored, setIsMirrored] = useState(true);
  const [isSwappedLayout, setIsSwappedLayout] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [isWebRTCConnected, setIsWebRTCConnected] = useState(false);

  // Minimized / Picture-In-Picture & Drag State
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 20, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const modalContainerRef = useRef<HTMLDivElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Continuously attach media streams to video elements when refs exist
  useEffect(() => {
    if (localVideoRef.current && mediaStreamRef.current) {
      if (localVideoRef.current.srcObject !== mediaStreamRef.current) {
        localVideoRef.current.srcObject = mediaStreamRef.current;
      }
    }
    if (remoteVideoRef.current && remoteStreamRef.current) {
      if (remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
    }
  });

  // Set default initial position on right side when minimized
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPosition({
        x: Math.max(10, window.innerWidth - 260),
        y: 80,
      });
    }
  }, []);

  // Handle Drag Events for Minimized Widget
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragOffsetRef.current = {
      x: clientX - position.x,
      y: clientY - position.y,
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleDragMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const newX = clientX - dragOffsetRef.current.x;
      const newY = clientY - dragOffsetRef.current.y;

      const maxX = window.innerWidth - 240;
      const maxY = window.innerHeight - 300;

      setPosition({
        x: Math.min(Math.max(10, newX), maxX),
        y: Math.min(Math.max(10, newY), maxY),
      });
    };

    const handleDragEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleDragMove);
    window.addEventListener('touchend', handleDragEnd);

    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging]);

  // Initialize WebRTC Peer Connection & Media Streams
  useEffect(() => {
    if (!isOpen) return;

    let isSubscribed = true;
    pendingIceCandidatesRef.current = [];

    async function initCallEngine() {
      try {
        // 1. Create WebRTC PeerConnection
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
          ],
        });
        peerConnectionRef.current = pc;

        // Remote Stream Setup
        const remoteStream = new MediaStream();
        remoteStreamRef.current = remoteStream;

        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            event.streams[0].getTracks().forEach((track) => {
              remoteStream.addTrack(track);
            });
          } else if (event.track) {
            remoteStream.addTrack(event.track);
          }

          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
          }
          setIsWebRTCConnected(true);
        };

        pc.oniceconnectionstatechange = () => {
          if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
            setIsWebRTCConnected(true);
          }
        };

        // ICE Candidates Handler
        if (callId) {
          pc.onicecandidate = (event) => {
            if (event.candidate) {
              sendIceCandidate(callId, event.candidate, role);
            }
          };
        }

        // 2. Request Local Media Stream
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            const constraints = {
              video: type === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
              audio: true,
            };

            const localStream = await navigator.mediaDevices.getUserMedia(constraints);
            if (!isSubscribed) {
              localStream.getTracks().forEach((t) => t.stop());
              return;
            }

            mediaStreamRef.current = localStream;

            // Attach local tracks to WebRTC
            localStream.getTracks().forEach((track) => {
              pc.addTrack(track, localStream);
            });

            // Display in local video preview
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = localStream;
            }

            // Audio level analysis
            try {
              const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
              if (AudioContextClass) {
                const ctx = new AudioContextClass();
                const source = ctx.createMediaStreamSource(localStream);
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 64;
                source.connect(analyser);

                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                const updateVolume = () => {
                  if (!isSubscribed) return;
                  analyser.getByteFrequencyData(dataArray);
                  let sum = 0;
                  for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                  const avg = sum / dataArray.length;
                  setMicVolume(Math.min(100, Math.round((avg / 128) * 100)));
                  animFrameRef.current = requestAnimationFrame(updateVolume);
                };
                updateVolume();
              }
            } catch (err) {
              console.warn('Audio analyser error:', err);
            }
          } catch (streamErr) {
            console.warn('Camera/mic error:', streamErr);
            setHasCameraError(true);
          }
        }

        const flushPendingCandidates = async () => {
          while (pendingIceCandidatesRef.current.length > 0) {
            const candidate = pendingIceCandidatesRef.current.shift();
            if (candidate && pc.remoteDescription) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (e) {
                console.warn('Flush ICE candidate error:', e);
              }
            }
          }
        };

        // 3. WebRTC Offer / Answer Signaling Flow
        if (callId) {
          if (role === 'caller') {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            await setCallOffer(callId, offer);
          }

          const unsubscribeSignals = subscribeToWebRTCSignals(callId, role, {
            onOffer: async (offer) => {
              if (
                role === 'receiver' &&
                pc.signalingState !== 'closed' &&
                pc.signalingState !== 'stable'
              ) {
                try {
                  await pc.setRemoteDescription(new RTCSessionDescription(offer));
                  await flushPendingCandidates();
                  const answer = await pc.createAnswer();
                  await pc.setLocalDescription(answer);
                  await setCallAnswer(callId, answer);
                } catch (e: any) {
                  if (e?.name !== 'InvalidStateError') {
                    console.warn('Set remote offer / create answer error:', e);
                  }
                }
              }
            },
            onAnswer: async (answer) => {
              if (
                role === 'caller' &&
                pc.signalingState === 'have-local-offer'
              ) {
                try {
                  await pc.setRemoteDescription(new RTCSessionDescription(answer));
                  await flushPendingCandidates();
                } catch (e: any) {
                  if (e?.name !== 'InvalidStateError') {
                    console.warn('Set remote answer error:', e);
                  }
                }
              }
            },
            onIceCandidate: async (candidate) => {
              if (pc.signalingState === 'closed') return;
              try {
                if (pc.remoteDescription && pc.remoteDescription.type) {
                  await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } else {
                  pendingIceCandidatesRef.current.push(candidate);
                }
              } catch (e: any) {
                if (e?.name !== 'InvalidStateError') {
                  console.warn('Add ICE candidate error:', e);
                }
              }
            },
          });

          return () => {
            unsubscribeSignals();
          };
        }
      } catch (err) {
        console.warn('WebRTC Init error:', err);
      }
    }

    const cleanupSignal = initCallEngine();

    return () => {
      isSubscribed = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [isOpen, callId, role, type]);

  // Manage Mute state
  useEffect(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  // Manage Video On/Off state
  useEffect(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = !isVideoOff;
      });
    }
  }, [isVideoOff]);

  // Screen Sharing
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      setIsScreenSharing(false);
      return;
    }

    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        alert('Screen sharing is not supported in this browser.');
        return;
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = stream;
      setIsScreenSharing(true);

      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream;
      }

      stream.getVideoTracks()[0].onended = () => {
        setIsScreenSharing(false);
      };
    } catch (e) {
      console.warn('Screen share error:', e);
    }
  };

  // Call Duration Timer
  useEffect(() => {
    if (callState === 'connected') {
      setCallDuration(0);
      timerRef.current = setInterval(() => {
        setCallDuration((p) => p + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  // Fullscreen
  const toggleFullscreen = () => {
    if (!modalContainerRef.current) return;
    if (!document.fullscreenElement) {
      modalContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleEnd = () => {
    setCallState('ended');
    if (callId) {
      updateCallStatus(callId, 'ended');
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    setTimeout(() => {
      onEndCall();
      setIsScreenSharing(false);
    }, 400);
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <>
        {/* Remote Audio Element for WebRTC audio playback */}
        <audio ref={remoteAudioRef} autoPlay />

        {/* Floating Draggable Picture-In-Picture Call Widget */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.7, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          style={{ left: `${position.x}px`, top: `${position.y}px` }}
          className="fixed z-50 w-56 sm:w-64 bg-slate-900 border-2 border-pink-500/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white cursor-grab active:cursor-grabbing select-none transition-shadow hover:shadow-pink-500/20"
        >
          {/* Draggable Header */}
          <div
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            className="p-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <GripHorizontal className="w-4 h-4 text-slate-400 shrink-0 cursor-grab" />
              <img src={contact.avatar} alt={contact.name} className="w-5 h-5 rounded-full object-cover shrink-0" />
              <span className="text-xs font-bold truncate text-slate-200">{contact.nickname || contact.name}</span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] font-mono text-pink-400 font-bold px-1.5 py-0.5 rounded bg-pink-500/10 border border-pink-500/30">
                {formatDuration(callDuration)}
              </span>
              <button
                onClick={() => setIsMinimized(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Expand to Fullscreen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Minimized Live Media Preview Area */}
          <div className="relative w-full h-36 bg-black flex items-center justify-center overflow-hidden">
            {type === 'video' && !isVideoOff ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 p-2 text-center">
                <img
                  src={contact.avatar}
                  alt={contact.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-pink-500 shadow-md"
                />
                <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Audio Active
                </span>
              </div>
            )}

            {/* PIP Local Video overlay on minimized widget if video is active */}
            {type === 'video' && !isVideoOff && (
              <div className="absolute bottom-1.5 right-1.5 w-12 h-16 rounded-lg overflow-hidden border border-pink-500 shadow-md bg-slate-900">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
                />
              </div>
            )}
          </div>

          {/* Minimized Quick Controls */}
          <div className="p-2 bg-slate-950 border-t border-slate-800 flex items-center justify-around">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-xl transition-all ${
                isMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={`p-2 rounded-xl transition-all ${
                isVideoOff ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title={isVideoOff ? 'Camera On' : 'Camera Off'}
            >
              {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            </button>

            <button
              onClick={handleEnd}
              className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md active:scale-95 transition-all"
              title="End Call"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md"
    >
      {/* Remote Audio Element for WebRTC audio playback */}
      <audio ref={remoteAudioRef} autoPlay />

      <div
        ref={modalContainerRef}
        className="w-full max-w-3xl h-[580px] sm:h-[620px] rounded-3xl overflow-hidden shadow-2xl relative flex flex-col bg-slate-950 text-white border border-slate-800"
      >
        {/* Top Header */}
        <div className="absolute top-0 inset-x-0 p-4 z-30 bg-gradient-to-b from-slate-950/90 via-slate-950/50 to-transparent flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800 shadow-md">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-200">
              End-to-End Encrypted {type === 'video' ? 'Video' : 'Voice'} Call
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-pink-400 border border-pink-500/30 shadow-md flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {formatDuration(callDuration)}
            </span>
            <button
              onClick={() => setIsMinimized(true)}
              className="p-2 rounded-full bg-slate-900/80 backdrop-blur-md hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
              title="Minimize to Floating Window"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-full bg-slate-900/80 backdrop-blur-md hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Main Video Area */}
        <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-slate-950">
          {/* Screen Share View */}
          {isScreenSharing && (
            <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center z-10">
              <video ref={screenVideoRef} autoPlay playsInline className="w-full h-full object-contain" />
              <div className="absolute top-16 left-4 bg-indigo-600/90 text-white text-xs font-bold px-3 py-1 rounded-full border border-indigo-400/40 backdrop-blur-md flex items-center gap-1.5 shadow-lg">
                <Monitor className="w-3.5 h-3.5 animate-pulse" />
                <span>Sharing Screen Live</span>
              </div>
            </div>
          )}

          {/* Video Call View */}
          {!isScreenSharing && type === 'video' && !isVideoOff && (
            <div className="absolute inset-0 w-full h-full">
              <div className="relative w-full h-full">
                {/* Remote Stream Video */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover relative z-10"
                />

                {/* Stream Connecting Overlay if P2P handshaking */}
                {!isWebRTCConnected && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 text-center">
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      className="w-20 h-20 rounded-full object-cover border-2 border-pink-500 shadow-xl mb-3 animate-pulse"
                    />
                    <p className="text-sm font-bold text-white">{contact.nickname || contact.name}</p>
                    <p className="text-xs text-pink-400 font-medium mt-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping" />
                      Connecting WebRTC Video Stream...
                    </p>
                  </div>
                )}

                {/* Contact Tag */}
                <div className="absolute bottom-20 left-6 z-20 flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-800 shadow-xl">
                  <img src={contact.avatar} alt={contact.name} className="w-9 h-9 rounded-full object-cover border border-pink-500" />
                  <div>
                    <p className="text-xs font-bold text-white">{contact.nickname || contact.name}</p>
                    <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      {isWebRTCConnected ? 'Live WebRTC Connected' : '720p HD Feed'}
                    </p>
                  </div>
                </div>

                {/* Picture-In-Picture (Local Stream) */}
                <div
                  onClick={() => setIsSwappedLayout(!isSwappedLayout)}
                  className="absolute bottom-20 right-4 w-32 h-44 sm:w-40 sm:h-56 rounded-2xl overflow-hidden border-2 border-pink-500/80 shadow-2xl bg-slate-900 cursor-pointer group transition-all hover:scale-105 z-20"
                  title="Click to Swap Main View & PIP"
                >
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
                  />
                  <div className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <RefreshCw className="w-3 h-3" />
                  </div>
                  <span className="absolute bottom-1.5 left-2 text-[9px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                    You (Live)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Voice Call View */}
          {(type === 'voice' || isVideoOff) && !isScreenSharing && (
            <div className="flex flex-col items-center justify-center text-center p-6 gap-6 z-10 max-w-sm">
              <div className="relative">
                {!isMuted && micVolume > 10 && (
                  <div
                    className="absolute inset-0 rounded-full bg-pink-500/30 transition-all duration-75"
                    style={{ transform: `scale(${1 + micVolume / 100})` }}
                  />
                )}
                <img
                  src={contact.avatar}
                  alt={contact.name}
                  className="w-32 h-32 sm:w-36 sm:h-36 rounded-full object-cover border-4 border-pink-500/70 shadow-2xl relative z-10"
                />
              </div>

              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">{contact.nickname || contact.name}</h3>
                <p className="text-xs text-slate-400 mt-1 font-medium flex items-center justify-center gap-1.5">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Audio Call Connected
                  </span>
                </p>
              </div>

              {/* Mic Volume Audio Visualizer */}
              <div className="flex items-center gap-1 h-8 mt-1">
                {[40, 70, 100, 60, 30, 80, 50, 90, 60, 40].map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-gradient-to-t from-pink-500 to-purple-500 rounded-full transition-all duration-100"
                    style={{
                      height: isMuted ? '4px' : `${Math.max(4, (h * micVolume) / 100)}px`,
                      opacity: isMuted ? 0.3 : 1,
                    }}
                  />
                ))}
              </div>

              {hasCameraError && type === 'video' && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Microphone active. Camera fallback mode enabled.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-900 flex items-center justify-center gap-3 sm:gap-6 z-30">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-3.5 sm:p-4 rounded-2xl transition-all ${
              isMuted
                ? 'bg-rose-600 text-white shadow-lg ring-2 ring-rose-500/50'
                : 'bg-slate-900 text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
            title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
          >
            {isMuted ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          <button
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`p-3.5 sm:p-4 rounded-2xl transition-all ${
              isVideoOff
                ? 'bg-rose-600 text-white shadow-lg ring-2 ring-rose-500/50'
                : 'bg-slate-900 text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
            title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Video className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          <button
            onClick={handleToggleScreenShare}
            className={`p-3.5 sm:p-4 rounded-2xl transition-all ${
              isScreenSharing
                ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-400'
                : 'bg-slate-900 text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
            title="Share Screen"
          >
            {isScreenSharing ? <MonitorOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Monitor className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          {type === 'video' && !isVideoOff && (
            <button
              onClick={() => setIsMirrored(!isMirrored)}
              className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-all hidden sm:block"
              title="Mirror Camera View"
            >
              <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}

          <button
            onClick={handleEnd}
            className="p-3.5 sm:p-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white shadow-xl transform active:scale-95 transition-all ml-2 flex items-center gap-2 font-bold text-sm"
            title="End Call"
          >
            <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="hidden sm:inline">End Call</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
