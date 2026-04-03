import React, { useState, useEffect } from 'react';
import GridCanvas from './GridCanvas';
import { LogoIcon, ControllerIcon, SenzorIcon, LockIcon, RouterIcon, TvIcon, InterfonIcon, PrelungitorIcon, SoundSystemIcon, BecIcon, PrizaIcon, AspiratorIcon, HubIcon } from './Icons';




//mapare icon cu denumire element
const ICON_MAP: Record<string, React.FC<{ color: string }>> = {
  bec: BecIcon,
  senzor: SenzorIcon,
  lock: LockIcon,
  router: RouterIcon,
  controller: ControllerIcon,
  tv: TvIcon,
  interfon: InterfonIcon,
  prelungitor: PrelungitorIcon,
  soundsystem: SoundSystemIcon,
  priza: PrizaIcon,
  aspirator: AspiratorIcon,
  hub: HubIcon

};




const App: React.FC = () => {
  // stocare stare pentru tema curenta (dark sau light mode)
  const [isDarkMode, setIsDarkMode] = useState(true);
  // Starea pentru dispozitivul selectat din catalog
  const [selectedDevice, setSelectedDevice] = useState<{ id: string, name: string, brand: string, type: string, status: string } | null>(null);
  const [hoveredIconIndex, setHoveredIconIndex] = useState<number | null>(null);
  //iconss
  const [placedIcons, setPlacedIcons] = useState<{ col: number, row: number, type: string, id: string, name: string, brand: string, status: string }[]>([])

  const [layout, setLayout] = useState({ offsetX: 0, offsetY: 0, dotSpacing: 0 });

  // efect care aplica clasa 'dark' pe elementul html de baza cand se schimba tema

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);



  //floating menu pentru wall , liine , window etc
  useEffect(() => {
    const handleScroll = () => {
      const menu = document.getElementById('floating-menu');
      const footer = document.querySelector('footer');
      if (!menu || !footer) return;

      const footerRect = footer.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      
      if (footerRect.top < windowHeight - 40) {
        const offset = windowHeight - footerRect.top + 60;
        menu.style.bottom = `${offset}px`;
      } else {
        menu.style.bottom = '40px'; 
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);





 
  // aici puteti modifica codurile hex daca se schimba design-ul in viitor
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

  /*bec: BecIcon,
  senzor: SenzorIcon,
  lock: LockIcon,
  router: RouterIcon,
  controller : ControllerIcon,
  tv : TvIcon,
  interfon : InterfonIcon,
  prelungitor : PrelungitorIcon,
  soundsystem : SoundSystemIcon,
  priza : PrizaIcon,
  aspirator : AspiratorIcon,
  hub : HubIcon*/

  // test elemente catalog
  const catalogDevices = [
    { id: '1', name: 'Philips Hue E27', price: '49€', brand: 'Philips', type: 'bulb', status: 'online' },
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
 
  


  // functia de click pe element catalog
  const handleCanvasClick = (col: number, row: number) => {
    if (!selectedDevice) return;

  
    const exists = placedIcons.some(icon => icon.col === col && icon.row === row);
    if (!exists) {
      setPlacedIcons([...placedIcons, {
        col,
        row,
        id: Date.now().toString(), // id pentru placedIcon
        type: selectedDevice.type,
        name: selectedDevice.name,
        brand: selectedDevice.brand,
        status: selectedDevice.status
      }]);
    }
  };


  return (
    // containerul radacina care tine toata pagina, foloseste tranzitie pentru schimbare fina de culori
    <div className={`min-h-screen flex flex-col font-montserrat transition-colors duration-300 ${theme.bg} ${theme.textMain}`}>

      {/* zona de header - bara de sus */}
      <header className={`h-[70px] flex items-center justify-between px-8 transition-colors duration-300 ${theme.headerBg}`}>
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2 font-bold text-xl cursor-pointer">
            {/* shrink-0 asigură că iconița nu se strivește */}
            <span className="flex items-center {isDark ? 'white' : '#2C3E50'} transition-colors duration-200">
              <LogoIcon color="currentColor" />
            </span>
          </div>
          {/* meniul principal de navigare din stanga */}
          <nav className="hidden md:flex gap-8 text-sm font-semibold">
            <span className={`${theme.textMuted} hover:text-[#00B4D8] cursor-pointer transition-colors`}>Products</span>
            <span className={`${theme.textMuted} hover:text-[#00B4D8] cursor-pointer transition-colors`}>Community</span>
          </nav>
        </div>

        {/* butoanele de actiune dreapta si switch-ul de tema */}
        <div className="flex items-center gap-6 text-sm font-semibold">
          <span className="cursor-pointer hover:text-[#00B4D8] transition-colors">Log In</span>
          <span className="cursor-pointer hover:text-[#00B4D8] transition-colors">English</span>

          {/* butonul efectiv care face toggle intre dark mode si light mode */}
          <div
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-12 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors duration-300 ${isDarkMode ? 'bg-[#0077B6]' : 'bg-[#8FAECB]'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
          </div>
        </div>
      </header>

      {/* zona principal de continut (tot ce e sub header) */}
      <main className="flex-1 flex flex-col px-8 py-4 max-w-[1700px] mx-auto w-full gap-6 pb-40">

        {/* bara de statistici de deasupra grid-ului (dispozitive, cost, protocoale) */}
        <div className="flex flex-col xl:flex-row justify-between items-center gap-6">
          <button className={`px-10 py-3 rounded-full font-semibold text-sm shadow-sm transition-colors ${theme.btnSecondary} ${theme.textMain}`}>
            Home Setup
          </button>

          <div className={`grid grid-cols-3 items-center px-6 py-4 rounded-3xl shadow-sm transition-colors duration-300 w-full max-w-2xl ${theme.panel}`}>
            <div className="text-center">
              <div className={`text-[11px] font-bold mb-1 ${theme.textMuted}`}>DEVICES</div>
              <div className="font-bold text-2xl">12</div>
            </div>
            <div className={`text-center border-l border-r px-4 ${theme.divider}`}>
              <div className={`text-[11px] font-bold mb-1 ${theme.textMuted}`}>ESTIMATED COST</div>
              <div className="font-bold text-2xl">1,458 EUR</div>
            </div>
            <div className="text-center">
              <div className={`text-[11px] font-bold mb-1 ${theme.textMuted}`}>PROTOCOLS</div>
              <div className="font-bold text-lg leading-tight mt-1">Zigbee, Wi-Fi</div>
            </div>
          </div>

          {/* butoanele de save si post */}
          <div className="flex gap-4">
            <button className={`flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-sm shadow-sm transition-colors ${theme.btnSecondary} ${theme.textMain}`}>
              <span className="opacity-60">💾</span> Save
            </button>
            <button className={`flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-sm shadow-sm transition-colors ${theme.btnSecondary} ${theme.textMain}`}>
              <span className="opacity-60">🚀</span> Post
            </button>
          </div>
        </div>

        {/* impartirea principala a ecranului: sidebar stanga, centru, sidebar dreapta */}
        <div className="flex-1 flex flex-col lg:flex-row gap-6 mt-2 mb-10">

          {/* sidebar stanga - contine doar meniul de filtre */}
          <aside className={`w-full lg:w-[280px] rounded-3xl p-6 shadow-sm flex flex-col gap-6 transition-colors duration-300 ${theme.panel}`}>
            <div>
              <h3 className="font-bold text-[15px] mb-4">Filters</h3>

              <div className="mb-5">
                <div className={`text-[11px] font-bold mb-2 ${theme.textMain}`}>Ecosystem</div>
                <div className="flex flex-wrap gap-2">
                  {['Apple Home', 'Alexa', 'Google Home', 'More'].map(t => (
                    <span key={t} className={`text-[10px] px-3 py-[6px] rounded-full font-medium transition-colors ${theme.card} ${theme.textMuted}`}>{t}</span>
                  ))}
                </div>
              </div>

              {/* filtru pentru pret */}
              <div className="mb-5">
                <div className={`flex justify-between text-[11px] font-bold mb-2 ${theme.textMain}`}>
                  <span>Price Range</span>
                </div>
                <div className={`flex justify-between text-xs font-medium mb-1 ${theme.textMuted}`}>
                  <span>$0</span>
                  <span>$500</span>
                </div>
                <div className={`w-full h-1.5 rounded-full my-3 relative transition-colors ${isDarkMode ? 'bg-[#4A4A60]' : 'bg-[#A9C4DD]'}`}>
                  <div className={`absolute left-[10%] right-[30%] h-1.5 rounded-full transition-colors ${isDarkMode ? 'bg-white' : 'bg-[#2C3E50]'}`}></div>
                  <div className={`absolute left-[10%] w-3.5 h-3.5 rounded-full -top-1 transition-colors ${isDarkMode ? 'bg-white' : 'bg-[#2C3E50]'}`}></div>
                  <div className={`absolute right-[30%] w-3.5 h-3.5 rounded-full -top-1 transition-colors ${isDarkMode ? 'bg-white' : 'bg-[#2C3E50]'}`}></div>
                </div>
              </div>

              <div className="mb-5 flex flex-col gap-2">
                <div className={`text-[11px] font-bold mb-2 ${theme.textMain}`}>Categories</div>
                {['Smart locks', 'Interfon video', 'Prelungitor', 'Router'].map(c => (
                  <label key={c} className={`flex items-center gap-2 text-[11px] font-medium cursor-pointer ${theme.textMuted}`}>
                    <input type="checkbox" className="w-3 h-3 rounded-sm accent-[#00B4D8]" /> {c}
                  </label>
                ))}
              </div>
            </div>

            {/* butoanele actiuni filtre din josul sidebar-ului */}
            <div className="mt-auto flex flex-col gap-3">
              <button className={`w-full py-3 font-bold text-[11px] rounded-2xl flex justify-center items-center gap-2 shadow-sm transition-colors ${isDarkMode ? 'bg-[#3A3A4E] text-[#F4A300]' : 'bg-[#E4EEF7] text-[#5A6080]'}`}>
                ⚠️ No Filters Selected
              </button>
              <button className="w-full py-3 bg-[#00B4D8] text-white font-bold text-[11px] rounded-2xl shadow-sm hover:bg-[#0096B4] transition-colors">
                ↻ Reset Filters
              </button>
            </div>
          </aside>

          {/* containerul canvas-ului unde se randeaza componenta custom */}
          <div className={`flex-1 relative min-h-[600px] rounded-3xl ${theme.canvasBorder}`}>
            <div className="absolute inset-0 rounded-3xl overflow-hidden">

              {/* 1. GRID-UL (Fundalul care desenează punctele) */}
              <GridCanvas
                isDarkMode={isDarkMode}
                placedIcons={placedIcons}           // lista de iconuri puse
                onCanvasClick={handleCanvasClick}    // save urile clickului
                onUpdate={setLayout}                 // functia care da coordonatele
              />

              {/*iconurile peste grid */}
              {layout.dotSpacing > 0 && placedIcons.map((icon, index) => {

                // mapare cu typeul
                const IconComponent = ICON_MAP[icon.type] || ControllerIcon; 

                return (
                  <div
                    key={index}
                    onMouseEnter={() => setHoveredIconIndex(index)}
                    onMouseLeave={() => setHoveredIconIndex(null)}
                    style={{
                      position: 'absolute',
                      left: layout.offsetX + icon.col * layout.dotSpacing,
                      top: layout.offsetY + icon.row * layout.dotSpacing,
                      width: layout.dotSpacing,
                      height: layout.dotSpacing,
                      transform: 'translate(-50%, -50%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 20,
                      cursor: 'pointer'
                    }}
                  >
                    <div className="relative group flex items-center justify-center w-full h-full">

                      
                      <IconComponent color={isDarkMode ? "white" : "#2C3E50"} />

                      
                      {hoveredIconIndex === index && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setPlacedIcons(placedIcons.filter((_, i) => i !== index));
                          }}
                          className={`
                                    absolute -top-3 -right-4 w-6 h-6 
                                    flex items-center justify-center 
                                    rounded-full shadow-xl z-30
                                    text-[10px] font-bold transition-all duration-200
                                    border-2 
                                        ${isDarkMode
                              ? 'bg-[#3A3A4E] text-[#FF4D4D] border-[#1A1A1E] hover:bg-[#4A4A60]'
                              : 'bg-white text-[#EF4444] border-[#EDEFF0] hover:bg-gray-50'
                            }
                               `}
                        >
                          ✕
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* BARA floating */}
            <div id="floating-menu" className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex gap-8 px-10 py-4 rounded-full shadow-2xl border transition-all duration-300 ${isDarkMode ? 'bg-[#2F2F41]/90 backdrop-blur-md border-[#3A3A4E]' : 'bg-white/90 backdrop-blur-md border-[#C2C9CC]'}`}>
              {['Wall', 'Window', 'Door', 'Line', 'Furniture'].map((tool) => (
                <button key={tool} className="flex flex-col items-center gap-1 group">
                  <div className={`w-8 h-6 border-2 rounded-sm transition-colors group-hover:border-[#00B4D8] ${isDarkMode ? 'border-white' : 'border-[#2C3E50]'}`}></div>
                  <span className={`text-[9px] uppercase font-bold tracking-wider transition-colors group-hover:text-[#00B4D8] ${isDarkMode ? 'text-white' : 'text-[#2C3E50]'}`}>{tool}</span>
                </button>
              ))}
            </div>
          </div>



          {/* sidebar dreapta - catalog cautare si lista de device-uri instalate */}
          <aside className="w-full lg:w-[320px] flex flex-col gap-6">

            {/* sectiunea superioara de catalog - search si listare */}
            <div className={`rounded-3xl p-6 shadow-sm flex flex-col transition-colors duration-300 ${theme.panel}`}>
              <h3 className="font-bold text-[13px] mb-4">Device Catalog</h3>
              <div className="relative mb-4">
                <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
                <input
                  type="text"
                  placeholder="Search devices..."
                  className={`w-full py-2.5 pl-8 pr-4 rounded-xl text-xs font-medium outline-none shadow-sm focus:border-[#00B4D8] border border-transparent transition-colors ${isDarkMode ? 'bg-[#3A3A4E] text-white placeholder-gray-400' : 'bg-white text-[#2C3E50]'}`}
                />
              </div>

              {/* tag-uri de sortare catalog */}
              <div className="flex flex-wrap gap-2 mb-6">
                {['All', 'Lighting', 'Climate', 'Security'].map((t, i) => (
                  <span key={t} className={`text-[9px] font-medium px-4 py-1.5 rounded-full shadow-sm cursor-pointer transition-colors ${i === 0 ? 'bg-[#00B4D8] text-white' : (isDarkMode ? 'bg-[#3A3A4E] text-[#9AA0BE] hover:bg-[#4A4A60]' : 'bg-white text-[#5A6080] hover:bg-gray-50')}`}>{t}</span>
                ))}
              </div>


              <div className="flex flex-col gap-3 max-h-[230px] overflow-y-auto no-scrollbar px-1 py-1">
                {catalogDevices.map((d) => {

                  const IconComponent = ICON_MAP[d.type] || ControllerIcon;

                  return (
                    <div
                      key={d.id}
                      onClick={() => {
                        // Logica de toggle
                        if (selectedDevice?.id === d.id) {
                          setSelectedDevice(null);
                        } else {
                          setSelectedDevice(d);
                        }
                      }}
                      className={`flex items-center justify-between p-3 rounded-2xl shadow-sm cursor-pointer border-2 transition-all ${selectedDevice?.id === d.id
                          ? `scale-[1.02] z-10 ${isDarkMode ? 'border-[#00B4D8]' : 'border-[#2C3E50]'}`
                          : `border-transparent ${theme.card}`
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Containerul pentru Iconița SVG */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm`}>
                          <IconComponent color={isDarkMode ? "white" : "#2C3E50"} />
                        </div>

                        <div>
                          <div className={`text-[11px] font-bold ${theme.textMain}`}>{d.name}</div>
                          <div className={`text-[9px] font-medium mt-0.5 ${theme.textMuted}`}>{d.price} · {d.brand}</div>
                        </div>
                      </div>

                      {/* Indicatorul "SELECTED" */}
                      <div className={`font-bold text-[9px] transition-colors ${selectedDevice?.id === d.id
                          ? `${isDarkMode ? 'text-[#00B4D8]' : 'text-[#2C3E50]'} opacity-100`
                          : 'opacity-0'
                        }`}>
                        SELECTED
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PANOU INSTALLED DEVICES */}
            <div className={`rounded-3xl p-6 shadow-sm flex flex-col transition-all duration-300 ${theme.panel} h-[280px]`}>


              <h3 className={`font-bold text-[13px] mb-4 ${theme.textMain}`}>Installed Devices</h3>

              {/* containerul listei*/}
              <div className="flex flex-col gap-3 overflow-y-auto no-scrollbar flex-1">
                {placedIcons.length === 0 ? (
                  <div className={`flex flex-col items-center justify-center h-full opacity-50`}>
                    <div className="text-[20px] mb-2">🏠</div>
                    <div className={`text-[10px] font-medium ${theme.textMuted}`}>No devices active</div>
                  </div>
                ) : (
                  placedIcons.map((device, index) => {
                    const IconComponent = ICON_MAP[device.type] || ControllerIcon;

                    return (
                      <div
                        key={device.id || index}
                        className={`
                          flex items-center justify-between p-3 rounded-2xl shadow-sm transition-all border border-transparent 
                          ${isDarkMode ? 'bg-[#3A3A4E]' : 'bg-white'} 
                          min-h-[70px] 
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-[#3A3A4E]' : 'bg-[#F8FAFC]'}`}>
                            <IconComponent color={isDarkMode ? "white" : "#2C3E50"} />
                          </div>

                          <div>
                            <div className={`text-[11px] font-bold ${theme.textMain} truncate w-[100px]`}>{device.name}</div>
                            <div className={`text-[9px] font-medium mt-0.5 ${theme.textMuted}`}>{device.brand}</div>
                          </div>
                        </div>

                        <div className="text-[14px] pr-2 text-green-500 font-bold">
                          ✓
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* subsolul paginii */}
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