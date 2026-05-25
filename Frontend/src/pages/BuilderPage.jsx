import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../features/builder-tailwind.css';
import '../features/wizard/component-fullscreen/wizard.css';
import SetupWizard from '../features/wizard/component-fullscreen/SetupWizard';
import LayoutCanvas from '../features/canvas/LayoutCanvas';
import useFilterStore from '../store/useFilterStore';
import useWizardStore from '../store/wizardStore';

function BuilderPage({ darkMode = false, setDarkMode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const initialView = searchParams.get('mode') === 'wizard' ? 'wizard' : 'canvas';
  const setupIdParam = searchParams.get('setupId');
  const setupId = setupIdParam ? parseInt(setupIdParam, 10) : null;
  const [activeView, setActiveView] = useState(initialView);
  const setStoreDarkMode = useFilterStore((state) => state.setDarkMode);
  const setWizardDarkMode = useWizardStore((state) => state.setDarkMode);

  useEffect(() => {
    const mode = new URLSearchParams(location.search).get('mode');
    setActiveView(mode === 'wizard' ? 'wizard' : 'canvas');
  }, [location.search]);

  useEffect(() => {
    setStoreDarkMode(darkMode);
    setWizardDarkMode(darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, [darkMode, setStoreDarkMode, setWizardDarkMode]);

  const theme = {
    bg: darkMode ? 'bg-[#1A1A1E]' : 'bg-[#EDEFF0]',
    footerBg: darkMode ? 'bg-[#2F2F41]' : 'bg-[#BDD3E7]',
    textMain: darkMode ? 'text-white' : 'text-[#2C3E50]',
    btnSecondary: darkMode ? 'bg-[#3A3A4E] hover:bg-[#4A4A60]' : 'bg-[#A9C4DD] hover:bg-[#9AB5CE]',
  };

  return (
    <div className={`min-h-[calc(100vh-64px)] flex flex-col font-montserrat transition-colors duration-300 ${theme.bg} ${theme.textMain}`}>
      {activeView === 'wizard' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <SetupWizard
            onFinish={() => {
              setActiveView('canvas');
              navigate('/builder', { replace: true });
            }}
          />

          <button
            type="button"
            onClick={() => setActiveView('canvas')}
            className={`mt-8 px-6 py-2 rounded-full text-sm font-semibold transition-colors ${theme.btnSecondary} ${theme.textMain}`}
          >
            Skip to Layout Canvas &rarr;
          </button>
        </div>
      ) : (
        <LayoutCanvas
          isDarkMode={darkMode}
          onBack={() => setActiveView('wizard')}
          setupId={setupId}
        />
      )}

      <footer className={`py-8 text-center text-[11px] font-semibold transition-colors duration-300 ${theme.footerBg}`}>
        <div className={`flex justify-center gap-10 mb-3 ${theme.textMain}`}>
          <a href="#" className="hover:text-[#00B4D8] transition">About</a>
          <a href="#" className="hover:text-[#00B4D8] transition">Contact</a>
          <a href="#" className="hover:text-[#00B4D8] transition">Privacy Policy</a>
        </div>
        <div className={`opacity-60 ${theme.textMain}`}>
          Copyright 2026 SmartHouse-Builder.<br />All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default BuilderPage;
