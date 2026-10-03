'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Show the install button
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User response to the install prompt: ${outcome}`);

    // We've used the prompt, and can't use it again, so clear it
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-6 left-6 right-6 z-[100] md:left-auto md:right-12 md:bottom-12 md:w-96"
      >
        <div className="bg-gray-900 text-white p-6 rounded-[2.5rem] shadow-2xl border border-white/10 flex items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600 rounded-full -mr-16 -mt-16 opacity-20 blur-2xl" />
          
          <div className="bg-orange-600 p-4 rounded-2xl shrink-0 shadow-lg shadow-orange-900/50">
            <Download className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1">
            <h4 className="font-black text-lg tracking-tight leading-tight mb-1">Install SariSari POS</h4>
            <p className="text-xs text-gray-400 font-medium">Add to home screen for a faster, offline-ready experience.</p>
          </div>

          <div className="flex flex-col gap-2">
            <button 
              onClick={handleInstallClick}
              className="bg-white text-gray-900 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95"
            >
              Install
            </button>
            <button 
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-white transition-colors p-1 self-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
