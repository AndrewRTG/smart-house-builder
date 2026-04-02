import React, { useState, useEffect } from 'react';
import GridCanvas from './GridCanvas';

const App: React.FC = () => {
  // stocare stare pentru tema curenta (dark sau light mode)
  const [isDarkMode, setIsDarkMode] = useState(true);

  // efect care aplica clasa 'dark' pe elementul html de baza cand se schimba tema
  // util pentru a lasa tailwind sa stie ce culori sa foloseasca global
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // paleta de culori extrasa din figma
  // aici puteti modifica codurile hex daca se schimba design-ul in viitor
  const theme = {
    bg: isDarkMode ? 'bg-[#1A1A1E]' : 'bg-[#EDEFF0]',
    headerBg: isDarkMode ? 'bg-[#1A1A1E]' : 'bg-[#EDEFF0]',
    panel: isDarkMode ? 'bg-[#2F2F41]' : 'bg-[#BDD3E7]',
    card: isDarkMode ? 'bg-[#3A3A4E]' : 'bg-white',
    textMain: isDarkMode ? 'text-white' : 'text-[#2C3E50]',
    textMuted: isDarkMode ? 'text-[#9AA0BE]' : 'text-[#5A6080]',
    btnSecondary: isDarkMode ? 'bg-[#3A3A4E] hover:bg-[#4A4A60]' : 'bg-[#A9C4DD] hover:bg-[#9AB5CE]',
    canvasBorder: isDarkMode ? 'border-[#2D4E6C]' : 'border-[#C2C9CC]',
    divider: isDarkMode ? 'border-[#3A3A4E]' : 'border-[#A9C4DD]',
  };

  // date statice pentru catalog - definite in afara JSX pentru claritate
  const catalogDevices = [
    { name: 'Philips Hue E27', price: '49€', brand: 'Philips', icon: '💡' },
    { name: 'Nest Thermostat', price: '279€', brand: 'Google', icon: '🌡️' },
    { name: 'Ring Camera', price: '148€', brand: 'Amazon', icon: '📷' },
  ];

  // FIX BUG #3: datele de device-uri definite ca obiecte cu id unic stabil
  // Foloseam key={i} (index) inainte - daca lista se sorteaza/filtreaza,
  // React reutiliza gresit elementele DOM cauzand glitch-uri vizuale
  const installedDevices = [
    { id: 'philips-hue-e27', name: 'Philips Hue E27', brand: 'Philips', status: '✓', warn: false, icon: '💡' },
    { id: 'amazon-echo-dot', name: 'Amazon Echo Dot', brand: 'Amazon', status: '✓', warn: false, icon: '🔊' },
    { id: 'august-lock-pro', name: 'August Lock Pro', brand: 'August', status: '⚠', warn: true, icon: '🔒' },
  ];

  return (
    // containerul radacina care tine toata pagina, foloseste tranzitie pentru schimbare fina de culori
    <div className={`min-h-screen flex flex-col font-montserrat transition-colors duration-300 ${theme.bg} ${theme.textMain}`}>

      {/* zona de header - bara de sus */}
      <header className={`h-[70px] flex items-center justify-between px-8 transition-colors duration-300 ${theme.headerBg}`}>
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2 font-bold text-xl">
            <span className="text-[#00B4D8]">●</span> logo
          </div>
          {/* meniul principal de navigare din stanga */}
          <nav className="hidden md:flex gap-8 text-sm font-semibold">
            <span className={`${isDarkMode ? 'text-white' : 'text-[#0077B6]'} cursor-pointer`}>Builder</span>
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
      <main className="flex-1 flex flex-col px-8 py-4 max-w-[1700px] mx-auto w-full gap-6">

        {/* bara de statistici de deasupra grid-ului (dispozitive, cost, protocoale) */}
        <div className="flex flex-col xl:flex-row justify-between items-center gap-6">
          <button className={`px-10 py-3 rounded-full font-semibold text-sm shadow-sm transition-colors ${theme.btnSecondary} ${theme.textMain}`}>
            Home Setup
          </button>

          <div className={`flex gap-12 px-12 py-4 rounded-3xl shadow-sm transition-colors duration-300 ${theme.panel}`}>
            <div className="text-center">
              <div className={`text-[11px] font-bold mb-1 ${theme.textMuted}`}>DEVICES</div>
              <div className="font-bold text-2xl">12</div>
            </div>
            <div className={`text-center border-l border-r px-12 mx-2 ${theme.divider}`}>
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
        <div className="flex-1 flex flex-col lg:flex-row gap-6 mt-2">

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

              {/* filtru pentru pret cu grafica customizata */}
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

          {/* coloana centrala - avertizari si suprafata de desen */}
          <div className="flex-1 flex flex-col gap-4">
            {/* caseta erori compatibilitate (aflata deasupra canvas-ului) */}
            <div className={`py-4 rounded-3xl shadow-sm flex items-center justify-center transition-colors duration-300 ${theme.panel}`}>
              <span className={`text-[10px] tracking-widest uppercase font-bold text-center ${theme.textMain}`}>Erorile de compatibilitate</span>
            </div>

            {/* containerul canvas-ului unde se randeaza componenta custom */}
            <div className={`flex-1 relative min-h-[600px] rounded-3xl overflow-hidden shadow-inner border transition-colors duration-300 ${theme.canvasBorder}`}>
              <GridCanvas isDarkMode={isDarkMode} />

              {/* bara plutitoare cu unelte (wall, window, door) din partea de jos a canvas-ului */}
              <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-8 px-10 py-3 rounded-full shadow-lg border transition-colors duration-300 ${isDarkMode ? 'bg-[#2F2F41] border-[#3A3A4E]' : 'bg-white border-[#C2C9CC]'}`}>
                {['Wall', 'Window', 'Door', 'Line', 'Furniture'].map((tool) => (
                  <button key={tool} className="flex flex-col items-center gap-1 group">
                    <div className={`w-8 h-6 border-2 rounded-sm transition-colors group-hover:border-[#00B4D8] ${isDarkMode ? 'border-white' : 'border-[#2C3E50]'}`}></div>
                    <span className={`text-[9px] uppercase font-bold tracking-wider transition-colors group-hover:text-[#00B4D8] ${isDarkMode ? 'text-white' : 'text-[#2C3E50]'}`}>{tool}</span>
                  </button>
                ))}
              </div>
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

              {/* FIX BUG #3: key foloseste d.name in loc de index numeric
                  Daca lista s-ar sorta sau filtra, React ar sti exact ce element e ce */}
              <div className="flex flex-col gap-3">
                {catalogDevices.map((d) => (
                  <div key={d.name} className={`flex items-center justify-between p-3 rounded-2xl shadow-sm cursor-pointer border border-transparent hover:border-[#00B4D8] transition-all ${theme.card}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${isDarkMode ? 'bg-[#2F2F41]' : 'bg-[#EEF1FA]'}`}>{d.icon}</div>
                      <div>
                        <div className={`text-[11px] font-bold ${theme.textMain}`}>{d.name}</div>
                        <div className={`text-[9px] font-medium mt-0.5 ${theme.textMuted}`}>{d.price} · {d.brand}</div>
                      </div>
                    </div>
                    <button className={`font-bold text-lg px-2 transition-colors hover:text-[#00B4D8] ${theme.textMuted}`}>+</button>
                  </div>
                ))}
              </div>
            </div>

            {/* sectiunea inferioara a sidebarului cu status-ul device-urilor deja alese */}
            <div className={`flex-1 rounded-3xl p-6 shadow-sm flex flex-col transition-colors duration-300 ${theme.panel}`}>
              <h3 className="font-bold text-[13px] mb-4">Installed Devices</h3>

              {/* FIX BUG #3: key foloseste d.id (string unic stabil) in loc de index numeric */}
              <div className="flex flex-col gap-3">
                {installedDevices.map((d) => (
                  <div key={d.id} className={`flex items-center justify-between p-3 rounded-2xl shadow-sm border border-transparent hover:border-[#00B4D8] transition-all cursor-pointer ${theme.card}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${isDarkMode ? 'bg-[#2F2F41]' : 'bg-[#EEF1FA]'}`}>{d.icon}</div>
                      <div>
                        <div className={`text-[11px] font-bold ${theme.textMain}`}>{d.name}</div>
                        <div className={`text-[9px] font-medium mt-0.5 ${theme.textMuted}`}>{d.brand}</div>
                      </div>
                    </div>
                    <div className={`text-xs font-bold ${d.warn ? 'text-[#F4A300]' : 'text-[#2DC653]'}`}>{d.status}</div>
                  </div>
                ))}
              </div>
            </div>

          </aside>
        </div>
      </main>

      {/* subsolul paginii */}
      <footer className="py-8 text-center text-[11px] font-semibold transition-colors duration-300">
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