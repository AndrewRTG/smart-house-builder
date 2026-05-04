import React from 'react';
import SetupWizard from './features/wizard/component-fullscreen/SetupWizard.jsx';
import Navbar from './features/wizard/components/navbar.jsx';
import useFilterStore from './store/useFilterStore.js';

const App: React.FC = () => {
    const { darkMode: isDarkMode, toggleDarkMode } = useFilterStore();

    return (
        <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDarkMode ? 'bg-[#1A1A1E] dark-mode' : 'bg-[#EDEFF0]'}`}>

            <Navbar
                darkMode={isDarkMode}
                onToggleDarkMode={toggleDarkMode}
                onOpenWizard={() => {}}
                isLoggedIn={false}
                userAvatar={null}
            />

            <div className="flex-1 flex items-center justify-center">
                <SetupWizard onFinish={(data: any) => console.log("Wizard complete:", data)} />
            </div>

        </div>
    );
};

export default App;