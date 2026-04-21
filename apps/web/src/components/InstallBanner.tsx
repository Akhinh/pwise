'use client';

import { useState, useEffect } from 'react';

// ── Hook ─────────────────────────────────────────────────────
export function usePWAInstall() {
  const [prompt, setPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS (Safari doesn't fire beforeinstallprompt)
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Capture the install prompt for Android/Chrome
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const triggerInstall = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setPrompt(null);
    }
  };

  // Show banner if: has prompt (Android/Chrome) OR is iOS Safari and not installed
  const canShow = !isInstalled && (!!prompt || isIOS);

  return { canShow, isIOS, triggerInstall, isInstalled };
}

// ── Component ─────────────────────────────────────────────────
export function InstallBanner() {
  const { canShow, isIOS, triggerInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if dismissed this session
  useEffect(() => {
    const wasDismissed = sessionStorage.getItem('pwa-banner-dismissed');
    if (wasDismissed) setDismissed(true);
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem('pwa-banner-dismissed', '1');
    setDismissed(true);
  };

  if (!canShow || dismissed) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-6 md:w-96"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      <div className="bg-[#0D2137] text-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1 bg-[#F59E0B] w-full" />

        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="bg-[#F59E0B] rounded-xl p-2.5 flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="#0D2137" strokeWidth="2.5" className="w-5 h-5">
                <rect x="5" y="2" width="14" height="20" rx="2" />
                <path d="M12 18h.01" />
              </svg>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-white leading-tight">
                Install PrepWise App
              </p>
              <p className="text-white/60 text-xs mt-1 leading-relaxed">
                {isIOS
                  ? 'Tap the share button below, then "Add to Home Screen" for offline access.'
                  : 'Get offline access, faster loading and a better experience.'}
              </p>
            </div>

            {/* Close */}
            <button
              onClick={handleDismiss}
              className="text-white/40 hover:text-white/80 transition-colors flex-shrink-0 -mt-0.5"
              aria-label="Dismiss"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* iOS instructions */}
          {isIOS && (
            <div className="mt-4 bg-white/5 rounded-xl p-3 flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-white/70">
                <span>1. Tap</span>
                {/* Share icon */}
                <svg viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" className="w-4 h-4 flex-shrink-0">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                <span>2. Select <strong className="text-white">"Add to Home Screen"</strong></span>
              </div>
            </div>
          )}

          {/* Android/Chrome install button */}
          {!isIOS && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={triggerInstall}
                className="flex-1 bg-[#F59E0B] text-[#0D2137] py-2.5 rounded-xl text-sm font-black hover:bg-[#FCD34D] transition-colors"
              >
                Install App
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
              >
                Not now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
