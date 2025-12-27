
import React from 'react';
import { Suggestion } from '../lib/suggestionEngine';
import { AnalysisResult } from '../lib/textAnalysis';
import { StressResult } from '../lib/stressEvaluation';

interface SuggestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    suggestions: Suggestion[];
    safetyStatus: StressResult | null;
    textResult: AnalysisResult | null;
}

export function SuggestionModal({ isOpen, onClose, suggestions, safetyStatus, textResult }: SuggestionModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all scale-100 border border-zinc-200 dark:border-zinc-800">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 flex items-center">
                        <span className="mr-2">💡</span>
                        Guardian Suggestions
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* STATUS HEADER - New Feature */}
                <div className="flex space-x-3 mb-6">
                    {/* Stress Level Badge */}
                    <div className={`flex-1 p-3 rounded-xl border flex flex-col items-center justify-center ${safetyStatus?.stressLevel === 'HIGH' ? 'bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800' :
                            safetyStatus?.stressLevel === 'MODERATE' ? 'bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800' :
                                'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800'
                        }`}>
                        <span className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-70">Stress Level</span>
                        <span className={`text-lg font-bold ${safetyStatus?.stressLevel === 'HIGH' ? 'text-rose-600 dark:text-rose-400' :
                                safetyStatus?.stressLevel === 'MODERATE' ? 'text-amber-600 dark:text-amber-400' :
                                    'text-emerald-600 dark:text-emerald-400'
                            }`}>
                            {safetyStatus?.stressLevel || 'UNKNOWN'}
                        </span>
                    </div>

                    {/* Mood Badge */}
                    <div className="flex-1 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex flex-col items-center justify-center">
                        <span className="text-xs font-semibold uppercase tracking-wider mb-1 text-zinc-500 dark:text-zinc-400">Detected Mood</span>
                        <span className="text-lg font-bold text-zinc-700 dark:text-zinc-200 capitalize">
                            {textResult?.tags[0] || 'Neutral'}
                        </span>
                    </div>
                </div>

                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                    {suggestions.map((suggestion, idx) => (
                        <div key={idx} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-emerald-500/30 transition-colors group">
                            <div className="flex items-start">
                                <span className="text-2xl mr-3 group-hover:scale-110 transition-transform duration-300">
                                    {suggestion.actionType === 'BREATHING' && '🧘'}
                                    {suggestion.actionType === 'JOURNAL' && '✍️'}
                                    {suggestion.actionType === 'MEDITATION' && '🧠'}
                                    {suggestion.actionType === 'EXERCISE' && '🏃'}
                                    {suggestion.actionType === 'NONE' && '✨'}
                                </span>
                                <div>
                                    <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 mb-1">
                                        {suggestion.title}
                                    </h3>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        {suggestion.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
