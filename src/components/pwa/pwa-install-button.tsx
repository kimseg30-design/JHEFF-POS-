'use client';

import React, { useState } from 'react';
import { usePWAInstall } from '@/lib/hooks/use-pwa-install';
import { 
  Download, 
  Smartphone, 
  Share, 
  PlusSquare, 
  X, 
  CheckCircle2, 
  Monitor, 
  Laptop, 
  WifiOff, 
  HelpCircle,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'button' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ 
  className = '',
  variant = 'button' 
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [deviceTab, setDeviceTab] = useState<'android' | 'ios' | 'desktop'>('android');

  // If already installed as standalone PWA, suppress the install prompt
  if (isInstalled) {
    return null;
  }

  const handlePrimaryClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (!outcome) {
        // If dismissed or failed, show the device instructions
        setShowGuideModal(true);
      }
    } else {
      // Default to iOS tab if on Apple device, otherwise detect desktop or android
      if (isIOS) {
        setDeviceTab('ios');
      } else if (typeof window !== 'undefined' && !/android|iphone|ipad|ipod/i.test(navigator.userAgent)) {
        setDeviceTab('desktop');
      } else {
        setDeviceTab('android');
      }
      setShowGuideModal(true);
    }
  };

  const openGuide = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isIOS) {
      setDeviceTab('ios');
    } else if (typeof window !== 'undefined' && !/android|iphone|ipad|ipod/i.test(navigator.userAgent)) {
      setDeviceTab('desktop');
    } else {
      setDeviceTab('android');
    }
    setShowGuideModal(true);
  };

  return (
    <>
      {variant === 'header' ? (
        <button
          onClick={handlePrimaryClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer ${className}`}
          title="Install POS App on this device"
        >
          <Download className="w-3.5 h-3.5 animate-bounce" />
          <span className="hidden sm:inline">Install App</span>
        </button>
      ) : variant === 'banner' ? (
        <div className={`p-4 sm:p-5 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 text-white rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-orange-400/30 ${className}`}>
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md shrink-0 shadow-inner">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-base tracking-tight">Install Sari-Sari POS App</h4>
                <span className="px-2 py-0.5 bg-white/25 rounded-full text-[10px] font-black uppercase tracking-wider">PWA Offline</span>
              </div>
              <p className="text-xs text-orange-100 font-medium mt-0.5">
                Install on Android, iPhone, iPad, or PC/Mac desktop for fast offline transactions & full-screen experience.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={openGuide}
              className="px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl backdrop-blur-xs transition-all cursor-pointer flex items-center gap-1.5"
              title="View installation guide for all devices"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>How to Install</span>
            </button>
            <button
              onClick={handlePrimaryClick}
              className="px-5 py-2.5 bg-white text-orange-700 font-black text-xs uppercase tracking-wider rounded-xl hover:bg-orange-50 transition-all shrink-0 active:scale-95 shadow-md cursor-pointer flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-orange-600" />
              <span>{isInstallable ? 'Install Now' : 'Install on Device'}</span>
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handlePrimaryClick}
          className={`flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs shadow-md shadow-orange-200 transition-all active:scale-95 cursor-pointer ${className}`}
        >
          <Download className="w-4 h-4" />
          <span>{isInstallable ? 'Install POS App' : 'Install on Device'}</span>
        </button>
      )}

      {/* Multi-Device Installation Guide Modal */}
      <AnimatePresence>
        {showGuideModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg rounded-[2.5rem] bg-white p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6 my-8 text-gray-900"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-orange-100 text-orange-600 rounded-2xl">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Install Sari-Sari POS</h3>
                    <p className="text-xs text-gray-500 font-medium">Installable on all mobile devices, tablets & computers</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGuideModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Offline highlight */}
              <div className="p-3.5 bg-orange-50/80 border border-orange-100 rounded-2xl flex items-center gap-3">
                <WifiOff className="w-5 h-5 text-orange-600 shrink-0" />
                <p className="text-xs text-orange-950 font-medium">
                  <strong>100% Offline Ready:</strong> Once installed, you can ring up sales, print receipts, and manage utang even without internet.
                </p>
              </div>

              {/* Device Selector Tabs */}
              <div className="grid grid-cols-3 gap-2 bg-gray-100 p-1.5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setDeviceTab('android')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    deviceTab === 'android'
                      ? 'bg-white text-orange-600 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Android</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeviceTab('ios')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    deviceTab === 'ios'
                      ? 'bg-white text-orange-600 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>iPhone / iPad</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeviceTab('desktop')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    deviceTab === 'desktop'
                      ? 'bg-white text-orange-600 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>PC / Mac</span>
                </button>
              </div>

              {/* Tab Contents */}
              {deviceTab === 'android' && (
                <div className="space-y-3 text-xs text-gray-700">
                  <div className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="w-7 h-7 bg-orange-100 text-orange-700 rounded-xl flex items-center justify-center font-black shrink-0 text-xs">
                      1
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Open Browser Options</p>
                      <p className="text-gray-600 mt-0.5">
                        In Google Chrome, Edge, or Samsung Internet, tap the <strong>three dots (⋮)</strong> menu at the top-right or bottom-right corner.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="w-7 h-7 bg-orange-100 text-orange-700 rounded-xl flex items-center justify-center font-black shrink-0 text-xs">
                      2
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Select &ldquo;Install app&rdquo; or &ldquo;Add to Home screen&rdquo;</p>
                      <p className="text-gray-600 mt-0.5">
                        Tap <span className="font-semibold text-gray-900">Install app</span> (or <span className="font-semibold text-gray-900">Add to Home screen</span>) from the menu list.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="w-7 h-7 bg-green-100 text-green-700 rounded-xl flex items-center justify-center font-black shrink-0 text-xs">
                      3
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Confirm & Launch</p>
                      <p className="text-gray-600 mt-0.5">
                        Tap <strong>Install</strong>. The app icon will appear on your home screen and drawer, opening as a dedicated full-screen POS!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {deviceTab === 'ios' && (
                <div className="space-y-3 text-xs text-gray-700">
                  <div className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="p-1.5 bg-blue-100 text-blue-600 rounded-xl shrink-0 mt-0.5">
                      <Share className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Step 1: Tap Share</p>
                      <p className="text-gray-600 mt-0.5">
                        Open in <strong>Safari</strong> on your iPhone or iPad. Tap the <span className="font-bold text-blue-600">Share</span> icon (square with arrow pointing up) in the bottom toolbar.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="p-1.5 bg-orange-100 text-orange-600 rounded-xl shrink-0 mt-0.5">
                      <PlusSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Step 2: Add to Home Screen</p>
                      <p className="text-gray-600 mt-0.5">
                        Scroll down the share sheet and tap <span className="font-bold text-gray-900">&ldquo;Add to Home Screen&rdquo;</span>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="p-1.5 bg-green-100 text-green-600 rounded-xl shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Step 3: Tap Add</p>
                      <p className="text-gray-600 mt-0.5">
                        Tap <span className="font-bold text-green-700">Add</span> at the top-right. Sari-Sari POS will launch with an app icon without any browser URL bar.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {deviceTab === 'desktop' && (
                <div className="space-y-3 text-xs text-gray-700">
                  <div className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="p-1.5 bg-blue-100 text-blue-600 rounded-xl shrink-0 mt-0.5">
                      <Monitor className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Chrome or Edge on Windows / Mac / Linux</p>
                      <p className="text-gray-600 mt-0.5">
                        Look at the right side of your browser&apos;s address bar for the <span className="font-bold text-blue-600">Install</span> icon (a computer monitor or arrow button), or click the browser menu (⋮) &gt; <span className="font-bold">Save and share</span> &gt; <span className="font-bold">Install Sari-Sari POS</span>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="p-1.5 bg-purple-100 text-purple-600 rounded-xl shrink-0 mt-0.5">
                      <Laptop className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Safari on macOS (Sonoma 14+)</p>
                      <p className="text-gray-600 mt-0.5">
                        In Safari on Mac, click <span className="font-bold">File</span> in the top menu bar &gt; select <span className="font-bold text-purple-600">&ldquo;Add to Dock...&rdquo;</span>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                {isInstallable && (
                  <button
                    onClick={async () => {
                      setShowGuideModal(false);
                      await install();
                    }}
                    className="flex-1 py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Trigger Direct Install</span>
                  </button>
                )}
                <button
                  onClick={() => setShowGuideModal(false)}
                  className={`py-3.5 font-bold rounded-2xl text-xs transition-all cursor-pointer ${
                    isInstallable 
                      ? 'px-6 bg-gray-100 hover:bg-gray-200 text-gray-800' 
                      : 'w-full bg-gray-900 hover:bg-black text-white'
                  }`}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

