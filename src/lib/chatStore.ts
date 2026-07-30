import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { ChatThread, Message, Contact } from '../types';

const LOCAL_STORAGE_KEY = 'chat_threads_v2';

// Save all threads to Firestore helper
export async function saveAllThreadsToFirestore(threads: ChatThread[], userId?: string) {
  // Real-time direct chat documents update automatically when messages are sent
  return;
}

// Clean helper for Firestore (removes undefined values)
function cleanForFirestore<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Save threads to LocalStorage fallback
export function saveThreadsToLocalStorage(threads: ChatThread[], userId?: string) {
  try {
    const key = userId ? `${LOCAL_STORAGE_KEY}_${userId}` : LOCAL_STORAGE_KEY;
    localStorage.setItem(key, JSON.stringify(threads));
  } catch (err) {
    console.warn('LocalStorage save error:', err);
  }
}

// Load threads from LocalStorage fallback
export function loadThreadsFromLocalStorage(userId?: string): ChatThread[] | null {
  try {
    const key = userId ? `${LOCAL_STORAGE_KEY}_${userId}` : LOCAL_STORAGE_KEY;
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('LocalStorage read error:', err);
  }
  return null;
}

// Deterministic Chat ID helper for 1-on-1 direct messages
export function getDirectChatId(userAId: string, userBId: string): string {
  if (userAId === userBId) return `self_${userAId}`;
  return [userAId, userBId].sort().join('_');
}

// Get or Create Chat document in Firestore for 2 users
export async function createOrGetChatInFirestore(
  currentUser: { id: string; name: string; username?: string; avatar: string },
  contact: Contact
): Promise<string> {
  const chatId = getDirectChatId(currentUser.id, contact.id);
  if (!db) return chatId;

  try {
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);

    const currentUserProfile = {
      id: currentUser.id,
      name: currentUser.name,
      username: currentUser.username || `@${currentUser.name.toLowerCase().replace(/\s+/g, '')}`,
      avatar: currentUser.avatar,
      status: 'online',
    };

    const contactProfile = {
      id: contact.id,
      name: contact.name,
      username: contact.username || `@${contact.name.toLowerCase().replace(/\s+/g, '')}`,
      avatar: contact.avatar,
      status: contact.status || 'online',
      bio: contact.bio || '',
    };

    if (!chatSnap.exists()) {
      const newChatData = {
        id: chatId,
        participants: [currentUser.id, contact.id],
        participantProfiles: {
          [currentUser.id]: currentUserProfile,
          [contact.id]: contactProfile,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastMessage: '',
        lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unreadCounts: { [currentUser.id]: 0, [contact.id]: 0 },
      };
      await setDoc(chatRef, cleanForFirestore(newChatData));
    } else {
      // Merge latest user profiles
      await setDoc(
        chatRef,
        cleanForFirestore({
          participantProfiles: {
            [currentUser.id]: currentUserProfile,
            [contact.id]: contactProfile,
          },
          updatedAt: Date.now(),
        }),
        { merge: true }
      );
    }
  } catch (err: any) {
    if (err?.code === 'permission-denied' || err?.message?.includes('permissions')) {
      console.info('[Firestore ChatStore] createOrGetChatInFirestore: Firestore permission restricted. Using local thread state.');
    } else {
      console.warn('Error in createOrGetChatInFirestore:', err);
    }
  }

  return chatId;
}

// Send Message to Firestore in global 'chats/{chatId}/messages'
export async function sendMessageToFirestore(
  chatId: string,
  message: Message,
  currentUserId: string,
  contactId: string,
  currentProfiles?: Record<string, any>
) {
  if (!db) return;

  try {
    const chatRef = doc(db, 'chats', chatId);
    const msgRef = doc(db, 'chats', chatId, 'messages', message.id);

    const msgData = {
      ...message,
      createdAt: Date.now(),
      senderId: currentUserId,
    };

    // Save message doc
    await setDoc(msgRef, cleanForFirestore(msgData));

    // Update parent chat preview
    const chatUpdate: Record<string, any> = {
      updatedAt: Date.now(),
      lastMessage: message.text || (message.imageUrl ? '📷 Photo' : message.audioUrl ? '🎵 Voice Note' : 'Message'),
      lastMessageTime: message.timestamp,
    };

    if (currentProfiles) {
      chatUpdate.participantProfiles = currentProfiles;
    }

    await setDoc(chatRef, cleanForFirestore(chatUpdate), { merge: true });
  } catch (err: any) {
    if (err?.code === 'permission-denied' || err?.message?.includes('permissions')) {
      console.info('[Firestore ChatStore] sendMessageToFirestore operating in offline/local broadcast mode (permissions restricted).');
    } else {
      console.warn('Error in sendMessageToFirestore:', err);
    }
  }
}

// Update Message in Firestore (reactions, edit, pin, etc)
export async function updateMessageInFirestore(
  chatId: string,
  messageId: string,
  updates: Partial<Message>
) {
  if (!db) return;
  try {
    const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
    await updateDoc(msgRef, cleanForFirestore(updates));
  } catch (err) {
    console.warn('Error updating message in Firestore:', err);
  }
}

// Delete Message in Firestore
export async function deleteMessageInFirestore(chatId: string, messageId: string) {
  if (!db) return;
  try {
    const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
    await deleteDoc(msgRef);
  } catch (err) {
    console.warn('Error deleting message from Firestore:', err);
  }
}

// Real-Time Subscription to all Chats for current user
export function subscribeToUserThreads(
  userId: string,
  onUpdate: (threads: ChatThread[]) => void
) {
  if (!db || !userId) return () => {};

  try {
    const chatsCol = collection(db, 'chats');
    const q = query(chatsCol, where('participants', 'array-contains', userId));

    const activeMessageUnsubscribers: Record<string, () => void> = {};
    const chatDataMap: Record<string, { chatMeta: any; messages: Message[] }> = {};

    const syncThreadsToCallback = () => {
      const threadsList: ChatThread[] = Object.values(chatDataMap).map(({ chatMeta, messages }) => {
        const participantProfiles = chatMeta.participantProfiles || {};

        // Find contact profile (the participant that is NOT userId)
        let otherUserId = (chatMeta.participants || []).find((pId: string) => pId !== userId);
        if (!otherUserId) otherUserId = userId; // fallback self chat

        const contactRaw = participantProfiles[otherUserId] || {};
        const contact: Contact = {
          id: otherUserId,
          name: contactRaw.name || 'Chat User',
          username: contactRaw.username || `@${(contactRaw.name || 'user').toLowerCase().replace(/\s+/g, '')}`,
          avatar: contactRaw.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          status: contactRaw.status || 'online',
          lastSeen: 'Active now',
          bio: contactRaw.bio || '',
        };

        // Format messages for current user
        const formattedMessages: Message[] = messages.map((m) => ({
          ...m,
          isMe: m.senderId === userId,
        }));

        return {
          id: chatMeta.id,
          contact,
          messages: formattedMessages,
          unreadCount: chatMeta.unreadCounts?.[userId] || 0,
          isPinned: chatMeta.pinnedMessageIds?.includes(userId) || false,
          disappearingTimer: chatMeta.disappearingTimer || 'off',
        };
      });

      // Sort threads by latest activity timestamp descending
      threadsList.sort((a, b) => {
        const lastA = a.messages[a.messages.length - 1]?.id || a.id;
        const lastB = b.messages[b.messages.length - 1]?.id || b.id;
        return lastB.localeCompare(lastA);
      });

      onUpdate(threadsList);
    };

    const unsubChats = onSnapshot(
      q,
      (snapshot) => {
        const currentChatIds = new Set<string>();

        snapshot.forEach((chatDoc) => {
          const chatMeta = chatDoc.data();
          const chatId = chatDoc.id;
          currentChatIds.add(chatId);

          if (!chatDataMap[chatId]) {
            chatDataMap[chatId] = { chatMeta, messages: [] };
          } else {
            chatDataMap[chatId].chatMeta = chatMeta;
          }

          // Subscribe to subcollection 'messages' if not already listening
          if (!activeMessageUnsubscribers[chatId]) {
            const msgsColRef = collection(db, 'chats', chatId, 'messages');
            const msgsQuery = query(msgsColRef, orderBy('createdAt', 'asc'));

            const unsubMsgs = onSnapshot(
              msgsQuery,
              (msgSnap) => {
                const msgsList: Message[] = [];
                msgSnap.forEach((msgDoc) => {
                  msgsList.push(msgDoc.data() as Message);
                });
                if (chatDataMap[chatId]) {
                  chatDataMap[chatId].messages = msgsList;
                  syncThreadsToCallback();
                }
              },
              (err: any) => {
                if (err?.code === 'permission-denied' || err?.message?.includes('permissions')) {
                  console.info(`[Firestore ChatStore] Messages snapshot permission restricted for ${chatId}.`);
                } else {
                  console.warn(`Messages subcollection snapshot error for ${chatId}:`, err);
                }
              }
            );

            activeMessageUnsubscribers[chatId] = unsubMsgs;
          }
        });

        // Cleanup unsubscribers for deleted/removed chats
        Object.keys(activeMessageUnsubscribers).forEach((chatId) => {
          if (!currentChatIds.has(chatId)) {
            activeMessageUnsubscribers[chatId]();
            delete activeMessageUnsubscribers[chatId];
            delete chatDataMap[chatId];
          }
        });

        syncThreadsToCallback();
      },
      (error: any) => {
        if (error?.code === 'permission-denied' || error?.message?.includes('permissions')) {
          console.info('[Firestore ChatStore] Firestore chats snapshot permission restricted. Falling back to local storage.');
        } else {
          console.warn('Firestore chats query snapshot error:', error);
        }
      }
    );

    return () => {
      unsubChats();
      Object.values(activeMessageUnsubscribers).forEach((unsub) => unsub());
    };
  } catch (err) {
    console.warn('Failed to subscribe to Firestore chats:', err);
    return () => {};
  }
}

// Local Cross-Tab Broadcast Channel for instant real-time message delivery
const messageBroadcastChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('chatapp_direct_messages')
    : null;

export function broadcastMessage(payload: {
  chatId: string;
  message: Message;
  senderProfile: { id: string; name: string; username?: string; avatar: string; email?: string };
  receiverId: string;
  receiverUsername?: string;
  receiverEmail?: string;
  receiverName?: string;
}) {
  if (messageBroadcastChannel) {
    try {
      messageBroadcastChannel.postMessage({ type: 'NEW_MESSAGE', ...payload });
    } catch (e) {
      console.warn('Broadcast channel post message error:', e);
    }
  }
}

export function broadcastReadAck(payload: {
  chatId: string;
  readerId: string;
  senderId: string;
}) {
  if (messageBroadcastChannel) {
    try {
      messageBroadcastChannel.postMessage({ type: 'MESSAGE_READ_ACK', ...payload });
    } catch (e) {
      console.warn('Broadcast channel read ack error:', e);
    }
  }
}

export function broadcastPollVote(payload: {
  chatId: string;
  messageId: string;
  voterId: string;
  poll: PollPayload;
}) {
  if (messageBroadcastChannel) {
    try {
      messageBroadcastChannel.postMessage({ type: 'POLL_VOTE_UPDATE', ...payload });
    } catch (e) {
      console.warn('Broadcast channel poll vote error:', e);
    }
  }
}

export function subscribeToBroadcastMessages(
  currentUser: { id?: string; name?: string; username?: string; email?: string } | null,
  onMessageReceived: (payload: {
    chatId: string;
    message: Message;
    senderProfile: { id: string; name: string; username?: string; avatar: string; email?: string };
    receiverId: string;
    receiverUsername?: string;
    receiverEmail?: string;
    receiverName?: string;
  }) => void,
  onReadAck?: (payload: { chatId: string; readerId: string }) => void,
  onPollVote?: (payload: { chatId: string; messageId: string; poll: PollPayload }) => void
) {
  if (!messageBroadcastChannel || !currentUser) return () => {};

  const handleMessage = (event: MessageEvent) => {
    const data = event.data;
    if (!data) return;

    if (data.type === 'MESSAGE_READ_ACK') {
      if (data.senderId === currentUser.id && onReadAck) {
        onReadAck({ chatId: data.chatId, readerId: data.readerId });
      }
      return;
    }

    if (data.type === 'POLL_VOTE_UPDATE') {
      if (data.voterId !== currentUser.id && onPollVote) {
        onPollVote({ chatId: data.chatId, messageId: data.messageId, poll: data.poll });
      }
      return;
    }

    if (!data.message) return;

    const myId = (currentUser.id || '').toLowerCase();
    const myUsername = (currentUser.username || '').toLowerCase().replace(/^@/, '');
    const myEmail = (currentUser.email || '').toLowerCase();
    const myName = (currentUser.name || '').toLowerCase();

    const targetId = (data.receiverId || '').toLowerCase();
    const targetUsername = (data.receiverUsername || '').toLowerCase().replace(/^@/, '');
    const targetEmail = (data.receiverEmail || '').toLowerCase();
    const targetName = (data.receiverName || '').toLowerCase();

    const isMatch =
      (myId && targetId && myId === targetId) ||
      (myUsername && targetUsername && myUsername === targetUsername) ||
      (myEmail && targetEmail && myEmail === targetEmail) ||
      (myName && targetName && myName === targetName);

    if (isMatch && data.senderProfile?.id !== currentUser.id) {
      onMessageReceived(data);
    }
  };

  messageBroadcastChannel.addEventListener('message', handleMessage);
  return () => {
    messageBroadcastChannel.removeEventListener('message', handleMessage);
  };
}

