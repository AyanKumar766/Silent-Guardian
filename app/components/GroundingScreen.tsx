import React from 'react';

interface GroundingScreenProps {
    onDismiss?: () => void;
    reason?: string;
}

export function GroundingScreen({ onDismiss, reason }: GroundingScreenProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm p-6 animate-in fade-in duration-300">
            <div className="max-w-lg w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-rose-100 dark:border-rose-900/30 p-8 text-center space-y-8">

                <div className="mx-auto w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                </div>

                <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                    Let's pause for a moment.
                </h2>

                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    It sounds like you're going through a very difficult time right now.
                    <br className="hidden sm:block" />
                    Please know that you are not alone, and there is support available.
                </p>

                <div className="bg-rose-50 dark:bg-rose-900/10 rounded-xl p-6 border border-rose-100 dark:border-rose-900/20">
                    <h3 className="text-rose-800 dark:text-rose-200 font-medium mb-4 flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Immediate Support
                    </h3>
                    <div className="space-y-3">
                        <a href="tel:+919820466726" className="block w-full bg-rose-600 hover:bg-rose-700 text-white font-medium py-3 px-4 rounded-lg transition-colors shadow-lg shadow-rose-600/20">
                            Call or Text +919820466726 (India Helpline)
                        </a>
                        <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-2">
                            Available 24/7. Free and confidential.
                        </p>
                    </div>
                </div>

                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="mb-6">
                        <BreathingExercise />
                    </div>

                    <button
                        onClick={onDismiss}
                        className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400 text-sm font-medium transition-colors"
                    >
                        I am safe now, return to app
                    </button>
                </div>
            </div>
        </div>
    );
}

function BreathingExercise() {
    // Simple 4s Inhale / 4s Exhale loop
    const [phase, setPhase] = React.useState<'Inhale' | 'Exhale' | 'Hold'>('Inhale');

    React.useEffect(() => {
        const interval = setInterval(() => {
            setPhase(p => p === 'Inhale' ? 'Exhale' : 'Inhale');
        }, 4000); // 4 second cycle

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center space-y-3">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-widest transition-all duration-1000">
                {phase === 'Inhale' ? 'Inhale...' : 'Exhale...'}
            </p>

            {/* Breathing Bar Container */}
            <div className="w-64 h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden relative border border-zinc-200 dark:border-zinc-700">
                <div
                    className={`absolute left-0 top-0 bottom-0 bg-emerald-400 transition-all duration-[4000ms] ease-in-out rounded-full ${phase === 'Inhale' ? 'w-full opacity-100' : 'w-0 opacity-60'
                        }`}
                />
            </div>
        </div>
    );
}

