"use client";

import { useEffect, useState } from "react";
import { Download, Check, X, Smartphone, Monitor, Share2, PlusSquare } from "lucide-react";
import { BRAND } from "@/lib/defaults";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface Window {
    deferredInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

interface InstallAppButtonProps {
  className?: string;
  compactOnMobile?: boolean;
}

export default function InstallAppButton({
  className = "",
  compactOnMobile = false,
}: InstallAppButtonProps) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [os, setOs] = useState<"ios" | "android" | "desktop">("desktop");

  useEffect(() => {
    // Detect if already in standalone/PWA window
    const standaloneMedia = window.matchMedia("(display-mode: standalone)");
    const isStandaloneMode =
      standaloneMedia.matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true;
    setIsStandalone(isStandaloneMode);

    // Detect user OS for tailored instructions
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setOs("ios");
    } else if (/android/.test(ua)) {
      setOs("android");
    } else {
      setOs("desktop");
    }

    // Check if the prompt was already captured on window
    if (window.deferredInstallPrompt) {
      setDeferredPrompt(window.deferredInstallPrompt);
    }

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.deferredInstallPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    }

    function handleAppInstalled() {
      setIsInstalled(true);
      setDeferredPrompt(null);
      window.deferredInstallPrompt = null;
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("pwa-installable", () => {
      if (window.deferredInstallPrompt) {
        setDeferredPrompt(window.deferredInstallPrompt);
      }
    });
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // If already running inside installed standalone app, don't show the button
  if (isStandalone) {
    return null;
  }

  async function handleInstallClick() {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setIsInstalled(true);
          setDeferredPrompt(null);
          window.deferredInstallPrompt = null;
        }
      } catch (err) {
        console.error("Install prompt error:", err);
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        title="Install app on your device for fast access"
        aria-label="Install App"
        className={`inline-flex items-center gap-1.5 rounded-lg bg-[#16a34a] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all duration-150 hover:bg-[#15803d] active:scale-95 sm:text-sm ${className}`}
      >
        {isInstalled ? (
          <>
            <Check className="h-4 w-4 text-white" />
            <span className={compactOnMobile ? "hidden sm:inline" : ""}>
              Installed
            </span>
          </>
        ) : (
          <>
            <Download className="h-4 w-4 animate-bounce" />
            <span className={compactOnMobile ? "hidden sm:inline" : ""}>
              Install App
            </span>
          </>
        )}
      </button>

      {/* Installation Guide Modal (for iOS or browsers without native prompt event) */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-cairo backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icon-192.png"
                alt={BRAND.name}
                className="h-12 w-12 rounded-xl object-cover shadow-sm border border-slate-100"
              />
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  Install {BRAND.nameAr} | {BRAND.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Fast 1-click access right from your desktop or home screen
                </p>
              </div>
            </div>

            {/* Instruction Tabs based on detected OS */}
            <div className="mt-4 rounded-xl bg-slate-50 p-4 border border-slate-100 text-xs sm:text-sm space-y-3">
              {os === "ios" ? (
                <>
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Smartphone className="h-4 w-4 text-[#204978]" />
                    <span>Install on iPhone / iPad (Safari)</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-2 text-slate-600 pl-1">
                    <li className="leading-relaxed">
                      Tap the <span className="font-semibold text-slate-800">Share button</span>{" "}
                      <Share2 className="inline h-3.5 w-3.5 mx-0.5 text-blue-600" /> at the bottom of Safari.
                    </li>
                    <li className="leading-relaxed">
                      Scroll down and tap <span className="font-semibold text-slate-800">Add to Home Screen</span>{" "}
                      <PlusSquare className="inline h-3.5 w-3.5 mx-0.5 text-slate-700" />.
                    </li>
                    <li className="leading-relaxed">
                      Tap <span className="font-semibold text-slate-800">Add</span> in the top right corner.
                    </li>
                  </ol>
                </>
              ) : os === "android" ? (
                <>
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Smartphone className="h-4 w-4 text-[#204978]" />
                    <span>Install on Android (Chrome)</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-2 text-slate-600 pl-1">
                    <li className="leading-relaxed">
                      Tap the <span className="font-semibold text-slate-800">three dots (⋮)</span> in the top-right corner.
                    </li>
                    <li className="leading-relaxed">
                      Select <span className="font-semibold text-slate-800">Install app</span> or <span className="font-semibold text-slate-800">Add to Home screen</span>.
                    </li>
                    <li className="leading-relaxed">
                      Tap <span className="font-semibold text-slate-800">Install</span> to confirm.
                    </li>
                  </ol>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Monitor className="h-4 w-4 text-[#204978]" />
                    <span>Install on Computer (Chrome / Edge)</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-2 text-slate-600 pl-1">
                    <li className="leading-relaxed">
                      Look at the right side of your browser&apos;s <span className="font-semibold text-slate-800">address bar</span> at the top.
                    </li>
                    <li className="leading-relaxed">
                      Click the <span className="font-semibold text-slate-800">Install icon</span>{" "}
                      (or click the <span className="font-semibold text-slate-800">three dots ⋮ &gt; &apos;Install Wasl...&apos;</span>).
                    </li>
                    <li className="leading-relaxed">
                      Click <span className="font-semibold text-slate-800">Install</span> in the browser popup.
                    </li>
                  </ol>
                </>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-full sm:w-auto rounded-lg bg-[#204978] px-5 py-2 text-xs sm:text-sm font-bold text-white hover:bg-[#18365a] transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
