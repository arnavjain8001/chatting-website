import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, PhoneOff, Video, Mic, ShieldCheck } from 'lucide-react';
import { CallSignalData } from '../lib/callSignaling';

interface IncomingCallModalProps {
  callSignal: CallSignalData | null;
  onAccept: (call: CallSignalData) => void;
  onDecline: (callId: string) => void;
  isDarkMode: boolean;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  callSignal,
  onAccept,
  onDecline,
}) => {
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play incoming ringtone sound effect
  useEffect(() => {
    if (!callSignal) return;

    // Trigger device vibration if available
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([400, 300, 400, 300, 400]);
      } catch (e) {
        // Ignored
      }
    }

    // Play WhatsApp-style incoming phone ring chime using Web Audio API
    let ringInterval: NodeJS.Timeout | null = null;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;

        const playIncomingRingtone = () => {
          if (!ctx || ctx.state === 'closed') return;

          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = 'sine';
          osc2.type = 'sine';
          osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
          osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5

          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start();
          osc2.start();
          osc1.stop(ctx.currentTime + 1.4);
        };

        playIncomingRingtone();
        ringInterval = setInterval(playIncomingRingtone, 2200);
      }
    } catch (e) {
      console.warn('Ringtone Web Audio error:', e);
    }

    return () => {
      if (ringInterval) clearInterval(ringInterval);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [callSignal]);

  return (
    <AnimatePresence>
      {callSignal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.85, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, y: 30, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-white text-center flex flex-col items-center gap-6 relative overflow-hidden"
          >
            {/* Top Encrypted Badge */}
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-[11px] font-semibold"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp End-to-End Encrypted Call</span>
            </motion.div>

            {/* Pulsing Avatar Container */}
            <div className="relative my-2">
              <motion.div
                animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.1, 0.6] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                className="absolute -inset-4 rounded-full bg-pink-500/30"
              />
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.05, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut', delay: 0.3 }}
                className="absolute -inset-8 rounded-full bg-purple-500/20"
              />
              <img
                src={callSignal.caller.avatar}
                alt={callSignal.caller.name}
                className="w-28 h-28 rounded-full object-cover border-4 border-pink-500 shadow-xl relative z-10"
              />
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-pink-500 text-white shadow-lg border-2 border-slate-900 z-20"
              >
                {callSignal.type === 'video' ? <Video className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </motion.div>
            </div>

            {/* Caller Info */}
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">
                {callSignal.caller.nickname || callSignal.caller.name}
              </h3>
              <p className="text-xs text-pink-400 font-bold mt-1 flex items-center justify-center gap-1 animate-pulse">
                Incoming WhatsApp {callSignal.type === 'video' ? 'Video' : 'Voice'} Call...
              </p>
            </div>

            {/* Call Action Buttons */}
            <div className="flex items-center justify-center gap-8 w-full pt-2">
              {/* Decline Button */}
              <div className="flex flex-col items-center gap-1.5">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onDecline(callSignal.callId)}
                  className="p-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/40 transition-all"
                  title="Decline Call"
                >
                  <PhoneOff className="w-6 h-6" />
                </motion.button>
                <span className="text-[11px] text-slate-400 font-medium">Decline</span>
              </div>

              {/* Accept Button */}
              <div className="flex flex-col items-center gap-1.5">
                <motion.button
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                  onClick={() => onAccept(callSignal)}
                  className="p-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/40 transition-all"
                  title="Answer Call"
                >
                  <Phone className="w-6 h-6" />
                </motion.button>
                <span className="text-[11px] text-emerald-400 font-bold">Accept</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

