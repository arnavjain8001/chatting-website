import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, MessageSquare, Database, Loader2, AtSign } from 'lucide-react';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Contact } from '../types';

interface NewChatModalProps {
  onClose: () => void;
  onStartChat: (contact: Contact) => void;
  isDarkMode: boolean;
}

const SUGGESTED_CONTACTS: Contact[] = [
  {
    id: 'user-new-1',
    name: 'Emily Watson',
    username: '@emily_design',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    status: 'online',
    lastSeen: 'Active now',
    bio: 'Product Designer @ Acme | UI/UX enthusiast',
  },
  {
    id: 'user-new-2',
    name: 'David Miller',
    username: '@davidm_tech',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    status: 'online',
    lastSeen: 'Active now',
    bio: 'Software Architect & Cloud Specialist',
  },
  {
    id: 'user-new-3',
    name: 'Nina Patel',
    username: '@nina_creates',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    status: 'offline',
    lastSeen: 'Active 1h ago',
    bio: 'Brand Strategist & Writer',
  },
];

export const NewChatModal: React.FC<NewChatModalProps> = ({
  onClose,
  onStartChat,
  isDarkMode,
}) => {
  const [query, setQuery] = useState('');
  const [customName, setCustomName] = useState('');
  const [dbUsers, setDbUsers] = useState<Contact[]>([]);
  const [isSearchingDb, setIsSearchingDb] = useState(false);

  // Search Firestore Database 'users' collection in real-time
  useEffect(() => {
    let isMounted = true;
    const fetchFirestoreUsers = async () => {
      if (!db) return;
      setIsSearchingDb(true);
      try {
        const usersCol = collection(db, 'users');
        const snapshot = await getDocs(usersCol);
        if (!isMounted) return;

        const loaded: Contact[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const cleanUsername = data.username
            ? data.username.startsWith('@')
              ? data.username
              : `@${data.username}`
            : data.email
            ? `@${data.email.split('@')[0]}`
            : `@user`;

          loaded.push({
            id: docSnap.id,
            name: data.name || cleanUsername.replace('@', ''),
            username: cleanUsername,
            avatar: data.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            status: 'online',
            lastSeen: 'Active now',
            bio: data.email ? `Registered user (${data.email})` : 'Registered ChatApp user',
          });
        });

        setDbUsers(loaded);
      } catch (err) {
        console.warn('Firestore user search fetch warning:', err);
      } finally {
        if (isMounted) setIsSearchingDb(false);
      }
    };

    fetchFirestoreUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  const cleanQuery = query.trim().toLowerCase().replace(/^@/, '');

  // Filter Firestore users by query
  const matchingDbUsers = dbUsers.filter((u) => {
    if (!cleanQuery) return true;
    const uName = (u.name || '').toLowerCase();
    const uHandle = (u.username || '').toLowerCase().replace(/^@/, '');
    const uBio = (u.bio || '').toLowerCase();
    return uName.includes(cleanQuery) || uHandle.includes(cleanQuery) || uBio.includes(cleanQuery);
  });

  // Filter Suggested local contacts
  const matchingSuggested = SUGGESTED_CONTACTS.filter((c) => {
    if (!cleanQuery) return true;
    const cName = c.name.toLowerCase();
    const cHandle = c.username.toLowerCase().replace(/^@/, '');
    return cName.includes(cleanQuery) || cHandle.includes(cleanQuery);
  });

  // Combine results without duplicates
  const dbUserIds = new Set(matchingDbUsers.map((u) => u.id));
  const uniqueSuggested = matchingSuggested.filter((s) => !dbUserIds.has(s.id));

  const handleStartAndStore = async (contact: Contact) => {
    // Store contact username in Firestore database if not existing
    if (db) {
      try {
        const userDocRef = doc(db, 'users', contact.id);
        await setDoc(
          userDocRef,
          {
            id: contact.id,
            name: contact.name,
            username: contact.username,
            avatar: contact.avatar,
            createdAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (e: any) {
        if (e?.code === 'permission-denied' || e?.message?.includes('permissions')) {
          console.info('[NewChatModal] Store contact to db restricted by Firestore rules. Continuing with local contact.');
        } else {
          console.warn('Store contact to db note:', e);
        }
      }
    }
    onStartChat(contact);
  };

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const rawInput = customName.trim().replace(/^@/, '');
    const formattedUsername = `@${rawInput.toLowerCase().replace(/\s+/g, '')}`;

    const newContact: Contact = {
      id: `user-custom-${Date.now()}`,
      name: rawInput,
      username: formattedUsername,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      status: 'online',
      lastSeen: 'Active now',
      bio: `Username stored in database (${formattedUsername})`,
    };

    await handleStartAndStore(newContact);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div
        className={`w-full max-w-md rounded-2xl shadow-2xl border flex flex-col overflow-hidden ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-lg">Search User by Username</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Custom Username Search / Start Form */}
        <form onSubmit={handleCreateCustom} className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
            <AtSign className="w-3.5 h-3.5 text-blue-500" />
            <span>Enter any username to search & start chat:</span>
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400 select-none">@</span>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="username or handle..."
                className={`w-full pl-7 pr-3 py-2 text-xs rounded-xl border outline-hidden font-mono ${
                  isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'
                }`}
              />
            </div>
            <button
              type="submit"
              disabled={!customName.trim()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50 transition-colors shadow-sm"
            >
              Start Chat
            </button>
          </div>
        </form>

        {/* Live Username Search Bar */}
        <div className="p-4">
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter registered database users by @username or name..."
              className={`w-full pl-9 pr-8 py-2 text-xs rounded-xl border outline-hidden ${
                isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-200'
              }`}
            />
            {isSearchingDb && (
              <Loader2 className="w-3.5 h-3.5 absolute right-3 top-3 text-blue-500 animate-spin" />
            )}
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {/* Database Registered Users */}
            {matchingDbUsers.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  <span>Registered Database Users ({matchingDbUsers.length})</span>
                </p>
                <div className="space-y-1.5">
                  {matchingDbUsers.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => handleStartAndStore(contact)}
                      className={`p-3 rounded-xl flex items-center justify-between cursor-pointer border transition-all ${
                        isDarkMode
                          ? 'bg-slate-800/80 border-blue-500/30 hover:bg-slate-800 hover:border-blue-500'
                          : 'bg-blue-50/50 border-blue-200 hover:bg-blue-50 hover:border-blue-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={contact.avatar}
                          alt={contact.name}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/30"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white">{contact.name}</h4>
                            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/30">
                              Database User
                            </span>
                          </div>
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-mono font-semibold">
                            {contact.username}
                          </p>
                        </div>
                      </div>

                      <UserPlus className="w-4 h-4 text-blue-600" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested / Local Contacts */}
            {uniqueSuggested.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Suggested Contacts
                </p>
                <div className="space-y-1.5">
                  {uniqueSuggested.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => handleStartAndStore(contact)}
                      className={`p-3 rounded-xl flex items-center justify-between cursor-pointer border transition-all ${
                        isDarkMode
                          ? 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800'
                          : 'bg-slate-50 border-slate-200/60 hover:bg-blue-50/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={contact.avatar}
                          alt={contact.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">{contact.name}</h4>
                          <p className="text-xs text-slate-500 font-mono">{contact.username}</p>
                        </div>
                      </div>

                      <UserPlus className="w-4 h-4 text-blue-600" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {matchingDbUsers.length === 0 && uniqueSuggested.length === 0 && (
              <div className="p-6 text-center text-slate-400 text-xs">
                <p className="font-semibold text-slate-300 mb-1">No user matching "{query}" found</p>
                <p className="text-[11px]">Type a username above and click "Start Chat" to create & store in database!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

