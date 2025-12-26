'use client';

import React, { useState, useEffect } from 'react';
import { saveSettings, getSettings } from '../lib/db';

export function ApiKeyManager() {
    const [apiKey, setApiKey] = useState('');
    const [storedKeyExists, setStoredKeyExists] = useState(false);
    const [mode, setMode] = useState<'offline' | 'online'>('offline');
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'deleted'>('idle');

    useEffect(() => {
        checkSettings();
        // Poll for mode changes (since settings might change in another component)
        const interval = setInterval(checkSettings, 2000);
        return () => clearInterval(interval);
    }, []);

    const checkSettings = async () => {
        try {
            const currentMode = await getSettings('app_mode');
            setMode(currentMode || 'offline');

            const key = await getSettings('openai_api_key');
            setStoredKeyExists(!!key);
            if (isLoading) setIsLoading(false);
        } catch (error) {
            console.error('Failed to check settings:', error);
        }
    };

    const handleSave = async () => {
        if (!apiKey.trim()) return;
        setStatus('saving');
        try {
            // Store plain text locally in IDB (sandbox)
            // For higher security, one might encrypt with a user password, 
            // but that UX is complex for this scope.
            await saveSettings('openai_api_key', apiKey.trim());
            setApiKey(''); // Clear memory
            setStoredKeyExists(true);
            setStatus('saved');
            setTimeout(() => setStatus('idle'), 2000);
        } catch (error) {
            console.error('Failed to save API key:', error);
            setStatus('idle');
        }
    };

    const handleDelete = async () => {
        try {
            await saveSettings('openai_api_key', ''); // Overwrite with empty
            setStoredKeyExists(false);
            setStatus('deleted');
            setTimeout(() => setStatus('idle'), 2000);
        } catch (error) {
            console.error('Failed to delete API key:', error);
        }
    };

    if (isLoading) return null;

    // Don't show anything if in offline mode
    if (mode === 'offline') {
        return (
            <div className="text-center text-sm text-zinc-400 dark:text-zinc-500 mt-4">
                API Key management is disabled in Offline Mode.
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-sky-100 dark:border-sky-900/30 mt-6 transition-colors duration-300">
            <h3 className="text-lg font-medium text-zinc-800 dark:text-zinc-100 mb-2">API Configuration</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                Since you are in <strong>Online Mode</strong>, you can provide an OpenAI API Key to enable cloud-based insights.
                The key is stored <strong>locally</strong> in your browser and is never sent to our servers.
            </p>

            {storedKeyExists ? (
                <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 p-3 rounded-lg">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-emerald-500 dark:text-emerald-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-emerald-700 dark:text-emerald-300 font-medium">API Key is saved locally</span>
                    </div>
                    <button
                        onClick={handleDelete}
                        className="text-sm text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 font-medium underline"
                    >
                        Remove Key
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    <div>
                        <label htmlFor="api-key" className="sr-only">API Key</label>
                        <input
                            type="password"
                            id="api-key"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="sk-..."
                            className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                        />
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={!apiKey || status === 'saving'}
                        className="w-full py-2 px-4 bg-zinc-800 dark:bg-zinc-700 text-white rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-600 disabled:opacity-50 transition-colors font-medium"
                    >
                        {status === 'saving' ? 'Securely Saving...' : 'Save API Key Locally'}
                    </button>
                </div>
            )}

            {status === 'saved' && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 text-center">Key saved successfully.</p>
            )}
            {status === 'deleted' && (
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-2 text-center">Key removed from local storage.</p>
            )}
        </div>
    );
}
