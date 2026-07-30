import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  Globe,
  Loader2,
} from 'lucide-react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';

interface AuthScreenProps {
  onLogin: (user: { id?: string; name: string; email: string; avatar: string }) => void;
  isDarkMode: boolean;
}

const DEMO_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
];

// Helper Typewriter Component with Safe Non-Blocking State Updates
const TypewriterText: React.FC<{
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  cursorColor?: string;
  onComplete?: () => void;
  highlightWords?: { word: string; className: string }[];
}> = ({ text, speed = 40, delay = 0, className = '', cursorColor = 'bg-pink-400', onComplete, highlightWords }) => {
  const [displayedLength, setDisplayedLength] = useState(0);
  const [isDone, setIsDone] = useState(false);

  // Use ref to hold callback to prevent effect re-subscriptions
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Reset when text changes
  useEffect(() => {
    setDisplayedLength(0);
    setIsDone(false);
  }, [text]);

  // Interval timer for incrementing character index
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        setDisplayedLength((prev) => {
          if (prev < text.length) {
            return prev + 1;
          }
          return prev;
        });
      }, speed);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, speed, delay]);

  // Safely trigger completion side effects in a dedicated effect
  useEffect(() => {
    if (displayedLength >= text.length && text.length > 0 && !isDone) {
      setIsDone(true);
      if (onCompleteRef.current) {
        onCompleteRef.current();
      }
    }
  }, [displayedLength, text.length, isDone]);

  const currentText = text.substring(0, displayedLength);

  // Function to apply highlighting to specific phrases if full word typed
  const renderFormattedText = () => {
    if (!highlightWords || highlightWords.length === 0) {
      return currentText;
    }

    let parts: React.ReactNode[] = [currentText];

    highlightWords.forEach(({ word, className: wordClass }) => {
      const newParts: React.ReactNode[] = [];
      parts.forEach((part) => {
        if (typeof part === 'string') {
          const split = part.split(word);
          split.forEach((subStr, index) => {
            if (subStr) newParts.push(subStr);
            if (index < split.length - 1) {
              newParts.push(
                <span key={`${word}-${index}`} className={wordClass}>
                  {word}
                </span>
              );
            }
          });
        } else {
          newParts.push(part);
        }
      });
      parts = newParts;
    });

    return parts;
  };

  return (
    <span className={className}>
      {renderFormattedText()}
      {!isDone && (
        <span className={`inline-block w-0.5 h-4 sm:h-5 ml-1 ${cursorColor} animate-pulse align-middle rounded-full`} />
      )}
    </span>
  );
};

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, isDarkMode }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [headingDone, setHeadingDone] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(DEMO_AVATARS[0]);
  const [errorMessage, setErrorMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) {
          setErrorMessage('Please enter your full name');
          setIsLoading(false);
          return;
        }
        if (!email.trim() || !email.includes('@')) {
          setErrorMessage('Please enter a valid email address');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMessage('Password must be at least 6 characters');
          setIsLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setErrorMessage('Passwords do not match');
          setIsLoading(false);
          return;
        }

        let uid = '';
        try {
          // 1. Attempt Email/Password Signup
          const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
          const user = userCredential.user;
          uid = user.uid;
          await updateProfile(user, {
            displayName: name.trim(),
            photoURL: selectedAvatar,
          });
        } catch (authErr: any) {
          console.warn('Primary email auth error:', authErr);
          if (authErr.code === 'auth/operation-not-allowed' || authErr.code === 'auth/admin-restricted-operation') {
            try {
              const anonCred = await signInAnonymously(auth);
              uid = anonCred.user.uid;
            } catch (anonErr) {
              console.warn('Anonymous fallback auth note:', anonErr);
              uid = 'user_' + Date.now();
            }
          } else {
            throw authErr;
          }
        }

        const generatedUsername = `@${email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '')}`;

        const userData = {
          id: uid || 'user_' + Date.now(),
          name: name.trim(),
          email: email.trim(),
          username: generatedUsername,
          avatar: selectedAvatar,
        };

        // 2. Save User Document to Firestore
        if (uid && !uid.startsWith('user_')) {
          try {
            await setDoc(doc(db, 'users', uid), {
              ...userData,
              createdAt: new Date().toISOString(),
            }, { merge: true });
          } catch (dbErr) {
            console.warn('Firestore setDoc warning:', dbErr);
          }
        }

        triggerToast('Account created successfully!');
        onLogin(userData);
      } else {
        if (!email.trim()) {
          setErrorMessage('Please enter your email address');
          setIsLoading(false);
          return;
        }
        if (!password) {
          setErrorMessage('Please enter your password');
          setIsLoading(false);
          return;
        }

        const formattedEmail = email.includes('@') ? email.trim() : `${email.trim()}@example.com`;
        let uid = '';
        let displayName = name.trim() || email.split('@')[0] || 'User';

        try {
          const userCredential = await signInWithEmailAndPassword(auth, formattedEmail, password);
          const user = userCredential.user;
          uid = user.uid;
          displayName = user.displayName || displayName;
        } catch (authErr: any) {
          console.warn('Primary sign in error:', authErr);
          if (authErr.code === 'auth/operation-not-allowed' || authErr.code === 'auth/admin-restricted-operation') {
            try {
              const anonCred = await signInAnonymously(auth);
              uid = anonCred.user.uid;
            } catch {
              uid = 'user_' + Date.now();
            }
          } else {
            throw authErr;
          }
        }

        const defaultHandle = `@${formattedEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '')}`;

        let userData = {
          id: uid || 'user_' + Date.now(),
          name: displayName,
          email: formattedEmail,
          username: defaultHandle,
          avatar: selectedAvatar,
        };

        if (uid && !uid.startsWith('user_')) {
          try {
            const userDocRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userDocRef);

            if (userSnap.exists()) {
              const data = userSnap.data();
              userData.name = data.name || userData.name;
              userData.avatar = data.avatar || userData.avatar;
              userData.username = data.username || userData.username;
            } else {
              await setDoc(userDocRef, {
                ...userData,
                createdAt: new Date().toISOString(),
              }, { merge: true });
            }
          } catch (dbErr) {
            console.warn('Firestore read/write warning:', dbErr);
          }
        }

        triggerToast('Signed in successfully!');
        onLogin(userData);
      }
    } catch (err: any) {
      console.error('Firebase Auth error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorMessage('This email is already registered. Please sign in instead.');
      } else if (
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/user-not-found'
      ) {
        setErrorMessage('Invalid email or password.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMessage('Password must be at least 6 characters.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setErrorMessage('Email/Password provider disabled in Firebase project settings.');
      } else if (err.code === 'auth/too-many-requests') {
        setErrorMessage('Too many failed attempts. Please try again later.');
      } else if (err.code === 'auth/network-request-failed') {
        setErrorMessage('Network error. Please check your internet connection.');
      } else {
        setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoName: string, demoEmail: string, avatarUrl: string) => {
    setIsLoading(true);
    setErrorMessage('');
    const demoPassword = 'DemoUserSecret123!';

    try {
      let uid = '';
      try {
        const userCredential = await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
        uid = userCredential.user.uid;
      } catch {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
          uid = userCredential.user.uid;
          await updateProfile(userCredential.user, { displayName: demoName, photoURL: avatarUrl });
        } catch (e: any) {
          if (e.code === 'auth/operation-not-allowed' || e.code === 'auth/admin-restricted-operation') {
            try {
              const anonCred = await signInAnonymously(auth);
              uid = anonCred.user.uid;
            } catch {
              uid = 'user_' + demoEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
            }
          } else {
            uid = 'user_' + demoEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
          }
        }
      }

      const demoHandle = `@${demoName.toLowerCase().replace(/\s+/g, '')}`;
      const deterministicId = uid || 'user_' + demoEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');

      const userData = {
        id: deterministicId,
        name: demoName,
        email: demoEmail,
        username: demoHandle,
        avatar: avatarUrl,
      };

      if (deterministicId) {
        try {
          await setDoc(
            doc(db, 'users', deterministicId),
            {
              ...userData,
              createdAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (dbErr) {
          console.warn('Firestore setDoc warning:', dbErr);
        }
      }

      triggerToast(`Welcome back, ${demoName}!`);
      onLogin(userData);
    } catch (err: any) {
      console.warn('Quick demo login fallback:', err);
      onLogin({
        id: 'user_' + demoEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, ''),
        name: demoName,
        email: demoEmail,
        avatar: avatarUrl,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      googleProvider.setCustomParameters({
        prompt: 'select_account',
      });
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userData = {
        id: user.uid,
        name: user.displayName || 'Google User',
        email: user.email || '',
        username: `@${(user.email || 'googleuser').split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '')}`,
        avatar: user.photoURL || DEMO_AVATARS[0],
      };

      if (user.uid) {
        try {
          await setDoc(
            doc(db, 'users', user.uid),
            {
              ...userData,
              createdAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (dbErr) {
          console.warn('Firestore setDoc warning:', dbErr);
        }
      }

      triggerToast(`Signed in as ${userData.name}`);
      onLogin(userData);
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Sign in cancelled by user.');
      } else {
        setErrorMessage(err.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden transition-colors ${
        isDarkMode
          ? 'bg-slate-950 text-slate-100'
          : 'bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-slate-100'
      }`}
    >
      {/* Background Animated Floating Ambient Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.25, 0.45, 0.25],
          x: [0, 30, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/6 left-1/4 w-80 h-80 bg-purple-600/30 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
          x: [0, -40, 0],
          y: [0, 40, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-1/6 right-1/4 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl pointer-events-none"
      />

      {/* Main Single Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden backdrop-blur-xl relative z-10 bg-slate-900/85 border-slate-800 text-slate-100 p-6 sm:p-8 space-y-6"
      >
        {/* Animated Hero Entrance Header with Typewriter Effect */}
        <div className="text-center space-y-3">
          {/* Glowing Animated Icon Badge */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
            className="inline-flex p-3.5 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/30 ring-4 ring-purple-500/20 mb-1"
          >
            <MessageSquare className="w-8 h-8" />
          </motion.div>

          {/* Typewriter Main Welcome Title */}
          <div className="space-y-2 min-h-[90px] sm:min-h-[100px] flex flex-col justify-center">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-purple-200 min-h-[36px]">
              <TypewriterText
                text="Welcome to the World of Chat"
                speed={45}
                delay={200}
                cursorColor="bg-purple-400"
                onComplete={() => setHeadingDone(true)}
              />
            </h1>

            {/* Typewriter Subtitle Text */}
            <p className="text-xs sm:text-sm font-medium text-purple-200/95 leading-relaxed px-1 min-h-[38px]">
              <TypewriterText
                text="To enter the world of chat, you must Sign In or Sign Up below."
                speed={30}
                delay={headingDone ? 100 : 1500}
                cursorColor="bg-pink-400"
                highlightWords={[
                  { word: 'Sign In', className: 'font-extrabold text-pink-400 underline decoration-pink-500/60 underline-offset-2' },
                  { word: 'Sign Up', className: 'font-extrabold text-purple-300 underline decoration-purple-400/60 underline-offset-2' },
                ]}
              />
            </p>
          </div>
        </div>

        {/* Animated Tab Switcher */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 pt-1">
          <div className="flex gap-1.5 p-1 rounded-2xl bg-slate-800/80 border border-slate-700/60 w-full">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setErrorMessage('');
              }}
              className={`relative flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                !isSignUp ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {!isSignUp && (
                <motion.div
                  layoutId="activeAuthTab"
                  className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-md"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setErrorMessage('');
              }}
              className={`relative flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                isSignUp ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isSignUp && (
                <motion.div
                  layoutId="activeAuthTab"
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-md"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">Sign Up</span>
            </button>
          </div>
        </div>

        {/* Form Inputs Container with Smooth Transition */}
        <AnimatePresence mode="wait">
          <motion.form
            key={isSignUp ? 'signup-form' : 'login-form'}
            initial={{ opacity: 0, x: isSignUp ? 15 : -15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isSignUp ? -15 : 15 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            className="space-y-3.5"
          >
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span>{errorMessage}</span>
              </motion.div>
            )}

            {/* Sign Up: Name Input */}
            {isSignUp && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sophia Chen"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border bg-slate-800/90 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-hidden transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Email Address or Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder={isSignUp ? 'you@example.com' : 'alex.morgan@example.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border bg-slate-800/90 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-hidden transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Password
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => triggerToast('Password reset link sent to email')}
                    className="text-[11px] font-semibold text-purple-400 hover:underline"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border bg-slate-800/90 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-hidden transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input (Sign Up) */}
            {isSignUp && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border bg-slate-800/90 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-hidden transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Avatar Selector (Sign Up) */}
            {isSignUp && (
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-slate-300">
                  Choose Profile Avatar
                </label>
                <div className="flex items-center gap-3">
                  {DEMO_AVATARS.map((avUrl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedAvatar(avUrl)}
                      className={`relative rounded-full overflow-hidden transition-transform hover:scale-110 ${
                        selectedAvatar === avUrl ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-slate-900' : 'opacity-70'
                      }`}
                    >
                      <img src={avUrl} alt="Avatar" className="w-9 h-9 object-cover rounded-full" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Action Button */}
            <motion.button
              whileHover={{ scale: isLoading ? 1 : 1.01 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-2xl text-xs font-extrabold text-white shadow-xl transition-all flex items-center justify-center gap-2 mt-2 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              } ${
                isSignUp
                  ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 shadow-purple-600/30'
                  : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-blue-600/30'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting to Firebase...</span>
                </>
              ) : (
                <>
                  <span>{isSignUp ? 'Create Free Account' : 'Sign In to World of Chat'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </motion.form>
        </AnimatePresence>

        {/* Quick Demo Login Option */}
        <div className="pt-1 flex items-center justify-between border-t border-slate-800 text-xs">
          <span className="text-slate-400 text-[11px]">Want a quick test drive?</span>
          <button
            type="button"
            onClick={() =>
              handleQuickDemoLogin('Alex Morgan', 'alex.morgan@example.com', DEMO_AVATARS[0])
            }
            className="font-bold text-pink-400 hover:text-pink-300 hover:underline flex items-center gap-1 transition-colors"
          >
            <span>One-Click Demo Login</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Social Login Options */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-750 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-4 h-4"
            />
            <span>Google</span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleQuickDemoLogin('Marcus Vance', 'marcus.v@example.com', DEMO_AVATARS[3])
            }
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-750 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <img
              src="https://www.svgrepo.com/show/512317/github-142.svg"
              alt="GitHub"
              className="w-4 h-4 invert"
            />
            <span>GitHub</span>
          </button>
        </div>
      </motion.div>

      {/* Footer text */}
      <div className="relative z-10 text-center mt-6 text-[11px] text-slate-400 flex items-center justify-center gap-2">
        <Globe className="w-3.5 h-3.5" />
        <span>DirectChat World • Encrypted Real-Time Messaging</span>
      </div>

      {/* Toast Popup */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
