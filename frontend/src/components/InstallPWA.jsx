import React, { useEffect, useState } from 'react';
import { Download, Check } from 'lucide-react';

const InstallPWA = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            console.log('PWA installation available');
        };

        window.addEventListener('beforeinstallprompt', handler);

        window.addEventListener('appinstalled', () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
            console.log('PWA installed');
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
    };

    if (isInstalled) return null;

    // Only show the button if the prompt is deferred (meaning install is possible)
    // For debugging, we might want to show a disabled button or console log if it's not showing.
    if (!deferredPrompt) {
        return null;
    }

    return (
        <button
            onClick={handleInstallClick}
            className="flex items-center gap-2 px-4 py-2 bg-[#2c2f32] hover:bg-[#3a3d42] text-white rounded-[10px] transition-all duration-300 font-epilogue font-semibold text-[14px] border border-[#3a3d42] animate-in fade-in zoom-in"
            title="Install App"
        >
            <Download className="w-4 h-4 text-[#8c6dfd]" />
            <span className="hidden sm:inline">Install App</span>
        </button>
    );
};

export default InstallPWA;
