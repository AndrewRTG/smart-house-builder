import React, { useState, useEffect } from 'react';
import GridCanvas from './GridCanvas';
import { LogoIcon, ControllerIcon, SenzorIcon, LockIcon, RouterIcon, TvIcon, InterfonIcon, PrelungitorIcon, SoundSystemIcon, BecIcon, PrizaIcon, AspiratorIcon, HubIcon } from './Icons';

// Importăm componentele
import WizardSidebar from './features/wizard/components/WizardSidebar.jsx';
import SetupWizard from './features/wizard/component-fullscreen/SetupWizard.jsx'; // Chestionarul nou
import useFilterStore from './store/useFilterStore.js';
import useWizardStore from './store/wizardStore.js'; // Store-ul chestionarului

const ICON_MAP: Record<string, React.FC<{ color: string }>> = {
  bec: BecIcon, senzor: SenzorIcon, lock: LockIcon, router: RouterIcon,
  controller: ControllerIcon, tv: TvIcon, interfon: InterfonIcon,
  prelungitor: PrelungitorIcon, soundsystem: SoundSystemIcon,
  priza: PrizaIcon, aspirator: AspiratorIcon, hub: HubIcon
};

const App: React.FC = () => {
  const { darkMode: isDarkMode, toggleDarkMode } = useFilterStore();

  // LOGICA DE TRANZITIE: Începem cu Wizard-ul activ
  const [showWizard, setShowWizard] = useState(true);

  const [selectedDevice, setSelectedDevice] = useState<{ id: string, name: string, brand: string, type: string, status: string } | null>(null);
  const [hoveredIconIndex, setHoveredIconIndex] = useState<number | null>(null);
  const [placedIcons, setPlacedIcons] = useState<{ col: number, row: number, type: string, id: string, name: string, brand: string, status: string }[]>([]);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [lines, setLines] = useState<{ id: string, type: string, start: {col: number, row: number}, end: {col: number, row: number} }[]>([]);
  const [layout, setLayout] = useState({ offsetX: 0, offsetY: 0, dotSpacing: 0 });

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const theme = {
    bg: isDarkMode ? 'bg-[#1A1A1E]' : 'bg-[#EDEFF0]',
    footerBg: isDarkMode ? 'bg-[#2F2F41]' : 'bg-[#BDD3E7]',
    headerBg: isDarkMode ? 'bg-[#2F2F41]' : 'bg-[#BDD3E7]',
    panel: isDarkMode ? 'bg-[#2F2F41]' : 'bg-[#BDD3E7]',
    card: isDarkMode ? 'bg-[#3A3A4E]' : 'bg-white',
    textMain: isDarkMode ? 'text-white' : 'text-[#2C3E50]',
    textMuted: isDarkMode ? 'text-[#9AA0BE]' : 'text-[#5A6080]',
    btnSecondary: isDarkMode ? 'bg-[#3A3A4E] hover:bg-[#4A4A60]' : 'bg-[#A9C4DD] hover:bg-[#9AB5CE]',
    canvasBorder: isDarkMode ? 'border-[#2D4E6C]' : 'border-[#C2C9CC]',
    divider: isDarkMode ? 'border-[#3A3A4E]' : 'border-[#A9C4DD]',
  };

  const catalogDevices = [
    { id: '1', name: 'Philips Hue E27', price: '49€', brand: 'Philips', type: 'bec', status: 'online' },
    { id: '2', name: 'Nest Thermostat', price: '279€', brand: 'Google', type: 'senzor', status: 'online' },
    { id: '3', name: 'Lock', price: '30€', brand: 'Amazon', type: 'lock', status: 'online' },
    { id: '4', name: 'Router', price: '200€', brand: 'Amazon', type: 'router', status: 'online' },
    { id: '5', name: 'Ps5 ', price: '400€', brand: 'Sony', type: 'controller', status: 'online' },
    { id: '6', name: 'Smart Tv ', price: '638€', brand: 'Samsung', type: 'tv', status: 'online' },
    { id: '7', name: 'Door Camera', price: '64€', brand: 'Amazon', type: 'interfon', status: 'online' },
    { id: '8', name: 'Extension Cord', price: '15€', brand: 'Amazon', type: 'prelungitor', status: 'online' },
    { id: '9', name: 'Sound system ', price: '148€', brand: 'Amazon', type: 'soundsystem', status: 'online' },
    { id: '10', name: 'Plug', price: '5€', brand: 'Amazon', type: 'priza', status: 'online' },
    { id: '11', name: 'Smart vacum', price: '250€', brand: 'Amazon', type: 'aspirator', status: 'online' },
    { id: '12', name: 'Hub', price: '300€', brand: 'Amazon', type: 'hub', status: 'online' }
  ];

  const handleCanvasClick = (col: number, row: number) => {
    if (!selectedDevice || activeTool) return;
    const exists = placedIcons.some(icon => icon.col === col && icon.row === row);
    if (!exists) {
      setPlacedIcons([...placedIcons, {
        col, row, id: Date.now().toString(), type: selectedDevice.type,
        name: selectedDevice.name, brand: selectedDevice.brand, status: selectedDevice.status
      }]);
    }
  };

  const handleLineComplete = (type: string, start: {col: number, row: number}, end: {col: number, row: number}) => {
    setLines(prevLines => [...prevLines, { id: Date.now().toString(), type, start, end }]);
  };

  const toggleTool = (toolName: string) => {
    const tool = toolName.toLowerCase();
    setActiveTool(prevTool => prevTool === tool ? null : tool);
    setSelectedDevice(null);
  };

  return (
      <div className={`min-h-screen flex flex-col font-montserrat transition-colors duration-300 ${theme.bg} ${theme.textMain}`}>
        {/* header — întotdeauna vizibil */}
        <header className={`h-[70px] flex items-center justify-between px-8 transition-colors duration-300 ${theme.headerBg}`}>
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-2 font-bold text-xl cursor-pointer">
            <span className={`flex items-center ${isDarkMode ? 'text-white' : 'text-[#2C3E50]'} transition-colors duration-200`}>
              <LogoIcon color="currentColor" />
            </span>
            </div>
            <nav className="hidden md:flex gap-8 text-sm font-semibold">
              <span className={`${theme.textMuted} hover:text-[#00B4D8] cursor-pointer transition-colors`}>Products</span>
              <span className={`${theme.textMuted} hover:text-[#00B4D8] cursor-pointer transition-colors`}>Community</span>
            </nav>
          </div>

          <div className="flex items-center gap-6 text-sm font-semibold">
            <span className="cursor-pointer hover:text-[#00B4D8] transition-colors">Log In</span>
            <span className="cursor-pointer hover:text-[#00B4D8] transition-colors">English</span>
            <div onClick={toggleDarkMode} className={`w-12 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors duration-300 ${isDarkMode ? 'bg-[#0077B6]' : 'bg-[#8FAECB]'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </div>
          </div>
        </header>

        {/* --- RENDER CONDIȚIONAT: wizard sau aplicație --- */}
        {showWizard ? (
            <div className="flex-1 flex items-center justify-center py-8">
              <SetupWizard onFinish={() => setShowWizard(false)} />
            </div>
        ) : (
            <>
              {/* main content */}
              <main className="flex-1 flex flex-col px-8 py-4 max-w-[1700px] mx-auto w-full gap-6 pb-40">
                <div className="flex flex-col xl:flex-row justify-between items-center gap-6">
                  <button className={`px-10 py-3 rounded-full font-semibold text-sm shadow-sm transition-colors ${theme.btnSecondary} ${theme.textMain}`}>
                    Home Setup
                  </button>
                  <div className={`grid grid-cols-3 items-center px-6 py-4 rounded-3xl shadow-sm transition-colors duration-300 w-full max-w-2xl ${theme.panel}`}>
                    <div className="text-center">
                      <div className={`text-[11px] font-bold mb-1 ${theme.textMuted}`}>DEVICES</div>
                      <div className="font-bold text-2xl">{placedIcons.length}</div>
                    </div>
                    <div className={`text-center border-l border-r px-4 ${theme.divider}`}>
                      <div className={`text-[11px] font-bold mb-1 ${theme.textMuted}`}>ESTIMATED COST</div>
                      <div className="font-bold text-2xl">0 EUR</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-[11px] font-bold mb-1 ${theme.textMuted}`}>PROTOCOLS</div>
                      <div className="font-bold text-lg leading-tight mt-1">-</div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button className={`flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-sm shadow-sm transition-colors ${theme.btnSecondary} ${theme.textMain}`}>Save</button>
                    <button className={`flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-sm shadow-sm transition-colors ${theme.btnSecondary} ${theme.textMain}`}>Post</button>
                  </div>
                </div>

                <div className="flex-1 flex flex-col lg:flex-row gap-6 mt-2 mb-10">

                  <div className={`flex-1 relative min-h-[600px] rounded-3xl ${theme.canvasBorder}`}>
                    <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-inner border border-transparent">
                      <GridCanvas isDarkMode={isDarkMode} placedIcons={placedIcons} lines={lines} activeTool={activeTool} onCanvasClick={handleCanvasClick} onLineComplete={handleLineComplete} onUpdate={setLayout} />
                      {layout.dotSpacing > 0 && placedIcons.map((icon, index) => {
                        const IconComponent = ICON_MAP[icon.type] || ControllerIcon;
                        return (
                            <div key={index} onMouseEnter={() => setHoveredIconIndex(index)} onMouseLeave={() => setHoveredIconIndex(null)}
                                 style={{ position: 'absolute', left: layout.offsetX + icon.col * layout.dotSpacing, top: layout.offsetY + icon.row * layout.dotSpacing, width: layout.dotSpacing, height: layout.dotSpacing, transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, cursor: 'pointer' }}>
                              <div className="relative group flex items-center justify-center w-full h-full">
                                <IconComponent color={isDarkMode ? "white" : "#2C3E50"} />
                                {hoveredIconIndex === index && (
                                    <div onClick={(e) => { e.stopPropagation(); setPlacedIcons(placedIcons.filter((_, i) => i !== index)); }}
                                         className={`absolute -top-3 -right-4 w-6 h-6 flex items-center justify-center rounded-full shadow-xl z-30 text-[10px] font-bold transition-all duration-200 border-2 ${isDarkMode ? 'bg-[#3A3A4E] text-[#FF4D4D] border-[#1A1A1E]' : 'bg-white text-[#EF4444] border-[#EDEFF0]'}`}>✕</div>
                                )}
                              </div>
                            </div>
                        );
                      })}
                    </div>
                    <div id="floating-menu" className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex gap-8 px-10 py-4 rounded-full shadow-2xl border transition-all duration-300 ${isDarkMode ? 'bg-[#2F2F41]/90 backdrop-blur-md border-[#3A3A4E]' : 'bg-white/90 backdrop-blur-md border-[#C2C9CC]'}`}>
                      {['Wall', 'Window', 'Door', 'Line', 'Furniture'].map((tool) => (
                          <button key={tool} onClick={() => toggleTool(tool)} className={`flex flex-col items-center gap-1 group transition-all ${activeTool === tool.toLowerCase() ? 'scale-110' : 'hover:scale-105'}`}>
                            <div className={`w-8 h-6 border-2 rounded-sm transition-colors ${activeTool === tool.toLowerCase() ? 'border-[#00B4D8] bg-[#00B4D8]/20' : (isDarkMode ? 'border-white group-hover:border-[#00B4D8]' : 'border-[#2C3E50] group-hover:border-[#00B4D8]')}`}></div>
                            <span className={`text-[9px] uppercase font-bold tracking-wider transition-colors ${activeTool === tool.toLowerCase() ? 'text-[#00B4D8]' : (isDarkMode ? 'text-white group-hover:text-[#00B4D8]' : 'text-[#2C3E50] group-hover:text-[#00B4D8]')}`}>{tool}</span>
                          </button>
                      ))}
                    </div>
                  </div>

                  <aside className="w-full lg:w-[320px] flex flex-col gap-6">
                    <div className={`rounded-3xl p-6 shadow-sm flex flex-col transition-colors duration-300 ${theme.panel}`}>
                      <h3 className="font-bold text-[13px] mb-4">Device Catalog</h3>
                      <div className="relative mb-4">
                        <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
                        <input type="text" placeholder="Search devices..." className={`w-full py-2.5 pl-8 pr-4 rounded-xl text-xs font-medium outline-none shadow-sm focus:border-[#00B4D8] border border-transparent ${isDarkMode ? 'bg-[#3A3A4E] text-white' : 'bg-white text-[#2C3E50]'}`} />
                      </div>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {['All', 'Lighting', 'Climate', 'Security'].map((t, i) => (
                            <span key={t} className={`text-[9px] font-medium px-4 py-1.5 rounded-full shadow-sm cursor-pointer ${i === 0 ? 'bg-[#00B4D8] text-white' : (isDarkMode ? 'bg-[#3A3A4E] text-[#9AA0BE]' : 'bg-white text-[#5A6080]')}`}>{t}</span>
                        ))}
                      </div>
                      <div className="flex flex-col gap-3 max-h-[230px] overflow-y-auto no-scrollbar px-1 py-1">
                        {catalogDevices.map((d) => {
                          const IconComponent = ICON_MAP[d.type] || ControllerIcon;
                          return (
                              <div key={d.id} onClick={() => { setActiveTool(null); setSelectedDevice(selectedDevice?.id === d.id ? null : d); }}
                                   className={`flex items-center justify-between p-3 rounded-2xl shadow-sm cursor-pointer border-2 transition-all ${selectedDevice?.id === d.id ? `scale-[1.02] ${isDarkMode ? 'border-[#00B4D8]' : 'border-[#2C3E50]'}` : `border-transparent ${theme.card}`}`}>
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm`}><IconComponent color={isDarkMode ? "white" : "#2C3E50"} /></div>
                                  <div>
                                    <div className={`text-[11px] font-bold ${theme.textMain}`}>{d.name}</div>
                                    <div className={`text-[9px] font-medium mt-0.5 ${theme.textMuted}`}>{d.price} · {d.brand}</div>
                                  </div>
                                </div>
                                <div className={`font-bold text-[9px] transition-colors ${selectedDevice?.id === d.id ? 'opacity-100' : 'opacity-0'}`}>SELECTED</div>
                              </div>
                          );
                        })}
                      </div>
                    </div>
                  </aside>
                </div>
              </main>

              <footer className={`py-8 text-center text-[11px] font-semibold transition-colors duration-300 ${theme.footerBg}`}>
                <div className={`flex justify-center gap-10 mb-3 ${theme.textMain}`}>
                  <a href="#" className="hover:text-[#00B4D8] transition">About</a>
                  <a href="#" className="hover:text-[#00B4D8] transition">Contact</a>
                  <a href="#" className="hover:text-[#00B4D8] transition">Privacy Policy</a>
                </div>
                <div className={`opacity-60 ${theme.textMain}`}>©2026 SmartHouse-Builder.<br />All rights reserved.</div>
              </footer>
            </>
        )}
      </div>
  );
};

export default App;