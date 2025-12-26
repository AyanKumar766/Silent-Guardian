'use client';

import React, { useState, useEffect } from 'react';
import { saveSettings, getSettings } from '../lib/db';

type AppMode = 'offline' | 'online';

export function Settings() {
    const [mode, setMode] = useState<AppMode>('offline');
    const [isLoading, setIsLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | null>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const storedMode = await getSettings('app_mode');
            if (storedMode) {
                setMode(storedMode);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleModeChange = async (newMode: AppMode) => {
        setMode(newMode);
        setSaveStatus('saving');
        try {
            await saveSettings('app_mode', newMode);
            // Simulate a small delay for visual feedback
            setTimeout(() => setSaveStatus('saved'), 500);
            setTimeout(() => setSaveStatus(null), 2000);
        } catch (error) {
            console.error('Failed to save settings:', error);
            setSaveStatus(null);
        }
    };

    if (isLoading) {
        return <div className="p-4 text-zinc-500 dark:text-zinc-400">Loading settings...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 transition-colors duration-300">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-medium text-zinc-800 dark:text-zinc-100">Intelligence Settings</h2>
                {saveStatus === 'saved' && (
                    <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium animate-fade-in-out">
                        Changes stored locally
                    </span>
                )}
            </div>

            <div className="space-y-6">
                {/* Offline Mode Option */}
                <label
                    className={`relative block p-4 border rounded-xl cursor-pointer transition-all ${mode === 'offline'
                        ? 'border-emerald-500 dark:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                        }`}
                >
                    <input
                        type="radio"
                        name="app_mode"
                        value="offline"
                        checked={mode === 'offline'}
                        onChange={() => handleModeChange('offline')}
                        className="absolute opacity-0 w-0 h-0"
                    />
                    <div className="flex items-center">
                        <div className={`p-2 rounded-full mr-4 transition-colors ${mode === 'offline' ? 'bg-emerald-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500'}`}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className={`text-lg font-medium ${mode === 'offline' ? 'text-emerald-900 dark:text-emerald-400' : 'text-zinc-900 dark:text-zinc-300'}`}>Secure Offline Mode (Recommended)</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                                All data stays on your device. Analysis algorithms run locally in your browser.
                                Maximum privacy, zero data leakage.
                            </p>
                        </div>
                    </div>
                </label>

                {/* Online Mode Option */}
                <label
                    className={`relative block p-4 border rounded-xl cursor-pointer transition-all ${mode === 'online'
                        ? 'border-sky-500 dark:border-sky-500 bg-sky-50/50 dark:bg-sky-900/10'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-sky-200 dark:hover:border-sky-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                        }`}
                >
                    <input
                        type="radio"
                        name="app_mode"
                        value="online"
                        checked={mode === 'online'}
                        onChange={() => handleModeChange('online')}
                        className="absolute opacity-0 w-0 h-0"
                    />
                    <div className="flex items-center">
                        <div className={`p-2 rounded-full mr-4 transition-colors ${mode === 'online' ? 'bg-sky-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500'}`}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className={`text-lg font-medium ${mode === 'online' ? 'text-sky-900 dark:text-sky-400' : 'text-zinc-900 dark:text-zinc-300'}`}>Online Cloud Mode</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                                May use external APIs for enhanced processing.
                                Data will be transmitted over the internet to secure servers.
                            </p>
                        </div>
                    </div>
                </label>

                {/* Privacy Warning */}
                {mode === 'online' && (
                    <div className="mt-4 p-4 bg-sky-50 dark:bg-sky-900/20 border-l-4 border-sky-400 dark:border-sky-500 rounded-r">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-sky-400 dark:text-sky-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-sky-800 dark:text-sky-300">Privacy Notice</h3>
                                <div className="mt-2 text-sm text-sky-700 dark:text-sky-400">
                                    <p>
                                        By enabling Online Mode, you consent to transmitting journal entries and audio metrics to external servers for processing.
                                        Ensure you are comfortable with this tradeoff before proceeding.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
