'use client';

import React, { useState } from 'react';

interface AIViewerProps {
    lastPrompt: string | null;
    lastResponse: any | null;
    modelUsed?: string;
    error?: string; // New prop
}

export function AIViewer({ lastPrompt, lastResponse, modelUsed, error }: AIViewerProps) {
    const [isOpen, setIsOpen] = useState(false);

    // if (!lastPrompt && !lastResponse) return null; // Always show button

    return (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end space-y-4">

            {/* Expanded Panel */}
            {isOpen && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 w-96 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom-5 duration-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center">
                            <span className={`w-2 h-2 rounded-full mr-2 ${error ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                            AI Logic Inspector
                        </h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Error Message */}
                        {error && (
                            <div className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-100 dark:border-red-900">
                                ⚠️ {error}
                            </div>
                        )}

                        {/* Model Info */}
                        {modelUsed && (
                            <div className="text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                🤖 Model: <span className="font-mono text-emerald-600 dark:text-emerald-400">{modelUsed}</span>
                            </div>
                        )}

                        {/* System Prompt */}
                        {lastPrompt && (
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">System Sent</label>
                                <div className="bg-zinc-100 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
                                    <pre className="text-[10px] leading-relaxed text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap font-mono">
                                        {lastPrompt}
                                    </pre>
                                </div>
                            </div>
                        )}

                        {/* AI Response */}
                        {lastResponse && (
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">AI Response</label>
                                <div className="bg-zinc-100 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-x-auto max-h-60 overflow-y-auto">
                                    {Array.isArray(lastResponse) ? (
                                        <div className="space-y-3">
                                            {lastResponse.map((item: any, idx: number) => (
                                                <div key={idx} className="border-b last:border-0 border-zinc-200 dark:border-zinc-700 pb-2 last:pb-0">
                                                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{item.title}</p>
                                                    <p className="text-[10px] text-zinc-600 dark:text-zinc-400 mt-1">{item.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <pre className="text-[10px] leading-relaxed text-emerald-700 dark:text-emerald-400 whitespace-pre-wrap font-mono">
                                            {JSON.stringify(lastResponse, null, 2)}
                                        </pre>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-4 rounded-full shadow-lg transition-all duration-300 ${isOpen
                    ? 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105'
                    }`}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    )}
                </svg>
            </button>
        </div>
    );
}
