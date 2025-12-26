'use client';

import React, { useState, useEffect } from 'react';

export function OfflineStatus() {
    const [isOnline, setIsOnline] = useState(true);
    const [showBadge, setShowBadge] = useState(false);

    useEffect(() => {
        // 1. Register Service Worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').then(
                    (registration) => {
                        console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    },
                    (err) => {
                        console.log('ServiceWorker registration failed: ', err);
                    }
                );
            });
        }

        // 2. Connection Status Listeners
        // Set initial state (hydration safe)
        setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);

        const handleOnline = () => {
            setIsOnline(true);
            setShowBadge(true);
            setTimeout(() => setShowBadge(false), 3000); // Hide "Back Online" after 3s
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowBadge(true); // Always show when offline
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!showBadge && isOnline) return null;

    return (
        <div
            className={`fixed bottom-4 left-4 z-50 px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 text-sm font-medium transition-transform duration-300 ${isOnline
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 translate-y-0'
                : 'bg-zinc-800 dark:bg-zinc-900 text-white border border-zinc-700 dark:border-zinc-700 translate-y-0'
                }`}
        >
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
            <span>{isOnline ? 'Back Online' : 'You are Offline'}</span>
        </div>
    );
}
