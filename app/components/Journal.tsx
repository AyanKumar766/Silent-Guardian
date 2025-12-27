'use client';

import React, { useState, useEffect } from 'react';
import { saveJournal, getJournals, type JournalEntry } from '../lib/db';

interface JournalProps {
    onEntrySaved?: (text: string) => void;
    onContentChange?: (text: string) => void;
}

export function Journal({ onEntrySaved, onContentChange }: JournalProps) {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [newEntry, setNewEntry] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadEntries();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        setNewEntry(text);
        if (onContentChange) {
            onContentChange(text);
        }
    };

    const loadEntries = async () => {
        try {
            const journals = await getJournals();
            // Sort by timestamp descending (newest first)
            setEntries(journals.sort((a, b) => b.timestamp - a.timestamp));
        } catch (error) {
            console.error('Failed to load journals:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!newEntry.trim()) return;

        try {
            const textToSave = newEntry; // Capture current value
            await saveJournal(textToSave);
            setNewEntry('');
            await loadEntries();

            // Notify parent for analysis
            if (onEntrySaved) {
                onEntrySaved(textToSave);
            }
        } catch (error) {
            console.error('Failed to save journal:', error);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4 space-y-6">
            {/* Offline Banner */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 dark:border-amber-600 text-amber-800 dark:text-amber-200 p-4 rounded-r-lg transition-colors" role="alert">
                <p className="font-medium">Offline-First Mode Active</p>
                <p className="text-sm opacity-90">Your entries are stored locally on this device.</p>
            </div>

            {/* Write Section */}
            <div className="bg-white dark:bg-zinc-900 shadow-sm rounded-xl p-6 space-y-4 border border-zinc-200 dark:border-zinc-800 transition-colors duration-300">
                <h2 className="text-lg font-medium text-zinc-800 dark:text-zinc-100">New Entry</h2>
                <textarea
                    value={newEntry}
                    onChange={handleChange}
                    placeholder="Write your thoughts..."
                    className="w-full h-32 p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 bg-zinc-50 dark:bg-zinc-800 transition-colors"
                />
                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={!newEntry.trim()}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
                    >
                        Save Entry
                    </button>
                </div>
            </div>

            {/* List Section */}
            <div className="space-y-4">
                <h2 className="text-lg font-medium text-zinc-800 dark:text-zinc-100">Past Entries</h2>

                {isLoading ? (
                    <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">Loading entries...</div>
                ) : entries.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                        No entries yet. Start writing above!
                    </div>
                ) : (
                    <div className="space-y-4">
                        {entries.map((entry) => (
                            <div key={entry.id} className="bg-white dark:bg-zinc-900 shadow-sm rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-all duration-300">
                                <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">{entry.text}</p>
                                <div className="mt-4 text-xs text-zinc-500 dark:text-zinc-500 border-t border-zinc-100 dark:border-zinc-800 pt-2 flex justify-between items-center">
                                    <span>{new Date(entry.timestamp).toLocaleString(undefined, {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit'
                                    })}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
