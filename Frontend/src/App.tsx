import React, { useState, useEffect } from 'react';

// --- Imports ---
import SetupWizard from './features/wizard/component-fullscreen/SetupWizard';
import Navbar from './features/wizard/components/navbar';
import useFilterStore from './store/useFilterStore';

// --- Our New Clean Canvas Component ---
import LayoutCanvas from './features/canvas/LayoutCanvas';

const App: React.FC = () => {
    // Global State for App Routing
    const [activeView, setActiveView] = useState<'wizard' | 'canvas'>('wizard');

    // Zustand Store
    const { darkMode: isDarkMode, toggleDarkMode } = useFilterStore();

    // Apply dark mode to global HTML root
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    // Shared Theme object for Layout Elements
    const theme = {
        bg: isDarkMode ? 'bg-[#1A1A1E]' : 'bg-[#EDEFF0]',
        footerBg: isDarkMode ? 'bg-[#2F2F41]' : 'bg-[#BDD3E7]',
        textMain: isDarkMode ? 'text-white' : 'text-[#2C3E50]',
        btnSecondary: isDarkMode ? 'bg-[#3A3A4E] hover:bg-[#4A4A60]' : 'bg-[#A9C4DD] hover:bg-[#9AB5CE]',
    };

    return (
        <div className={`min-h-screen flex flex-col font-montserrat transition-colors duration-300 ${theme.bg} ${theme.textMain}`}>

            {/* Global Application Header */}
            <Navbar
                darkMode={isDarkMode}
                onToggleDarkMode={toggleDarkMode}
                onOpenWizard={() => setActiveView('wizard')}
                isLoggedIn={false}
                userAvatar={null}
            />

            {/* Main View Router */}
            {activeView === 'wizard' ? (

                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    {/* THE WIZARD */}
                    <SetupWizard onFinish={(data: any) => {
                        console.log("Wizard complete:", data);
                        setActiveView('canvas'); // Transition to Canvas on finish!
                    }} />

                    {/* Skip Button */}
                    <button
                        onClick={() => setActiveView('canvas')}
                        className={`mt-8 px-6 py-2 rounded-full text-sm font-semibold transition-colors ${theme.btnSecondary} ${theme.textMain}`}
                    >
                        Skip to Layout Canvas &rarr;
                    </button>
                </div>

            ) : (

                // THE CANVAS
                <LayoutCanvas
                    isDarkMode={isDarkMode}
                    onBack={() => setActiveView('wizard')}
                />

            )}

            {/* Global Application Footer */}
            <footer className={`py-8 text-center text-[11px] font-semibold transition-colors duration-300 ${theme.footerBg}`}>
                <div className={`flex justify-center gap-10 mb-3 ${theme.textMain}`}>
                    <a href="#" className="hover:text-[#00B4D8] transition">About</a>
                    <a href="#" className="hover:text-[#00B4D8] transition">Contact</a>
                    <a href="#" className="hover:text-[#00B4D8] transition">Privacy Policy</a>
                </div>
                <div className={`opacity-60 ${theme.textMain}`}>
                    ©2026 SmartHouse-Builder.<br />All rights reserved.
                </div>
            </footer>

        </div>
    );
};

export default App;