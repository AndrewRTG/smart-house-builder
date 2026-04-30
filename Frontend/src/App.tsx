import React from 'react';
import SetupWizard from './features/wizard/component-fullscreen/SetupWizard.jsx'; //[cite: 3]
import useFilterStore from './store/useFilterStore.js'; //[cite: 3]

const App: React.FC = () => {
    const { darkMode: isDarkMode } = useFilterStore(); //[cite: 3]

    return (
        /* This container ensures the Wizard is the only thing visible and stays centered */
        <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDarkMode ? 'bg-[#1A1A1E]' : 'bg-[#EDEFF0]'}`}>

            <SetupWizard onFinish={(data: any) => console.log("Wizard complete:", data)} />

        </div>
    );
};

export default App;