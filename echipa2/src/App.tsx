import React, { useState, useEffect } from 'react';
import GridCanvas from './GridCanvas';
import { LogoIcon, ControllerIcon, SenzorIcon, LockIcon, RouterIcon, TvIcon, InterfonIcon, PrelungitorIcon, SoundSystemIcon, BecIcon, PrizaIcon, AspiratorIcon, HubIcon } from './Icons';

// Definirea interfetelor pentru JSON export
interface Wall {
  
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface Window {
  x: number;
  y: number;
}

interface Door {
  x: number;
  y: number;
}

interface Device {
  coordinates: { x: number; y: number };
  rotationAngle: number;
  device:{
    id: string;
    name: string;
    price: number;
    ecosystem: string;
    protocol: string;
    lumens: number;
    requiresPlug: boolean;
    rangeRadius: number;
    deviceType: string;
    mountType: string;
    fieldofView: number;
    powerConsumption: number;
    comunicationFrequency: string;
    width: number;
  }
}

interface Furniture {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface Plug{
  x: number;
  y: number;
}

interface Room{
  id: string;
  squareMeters: number;
  wallType: string;
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  plugs: Plug[];
}

type HouseElement = Wall | Window | Door | Device | Furniture | Room | Plug;

// mapare icon cu denumire element
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
  
  const generateLayoutId = () => {
    const randomSegment = () => Math.floor(1000 + Math.random() * 9000).toString();
    return `layout-uuid-${randomSegment()}-${randomSegment()}`;
  };
  const [layoutId] = useState(generateLayoutId);

  // starea pentru dispozitivul selectat din catalog
  const [selectedDevice, setSelectedDevice] = useState<{ id: string, name: string, brand: string, type: string, status: string } | null>(null);
  const [hoveredIconIndex, setHoveredIconIndex] = useState<number | null>(null);
  
  // iconurile plasate pe ecran
  const [placedIcons, setPlacedIcons] = useState<{ col: number, row: number, type: string, id: string, name: string, brand: string, status: string }[]>([]);

  // noul state: retine ce unealta este activa din bara de jos (wall, window etc)
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // noul state: stocheaza toate liniile/zidurile desenate
  const [lines, setLines] = useState<{ id: string, type: string, start: {col: number, row: number}, end: {col: number, row: number} }[]>([]);

  // dimensiunile calculate ale gridului, transmise de canvas
  const [layout, setLayout] = useState({ offsetX: 0, offsetY: 0, dotSpacing: 0 });

  // state pentru JSON-urile generate pentru export
  const [exportData, setExportData] = useState<{
    windows: Window[];
    doors: Door[];
    devices: Device[];
    furniture: Furniture[];
    rooms: Room[];
  }>({
    windows: [],
    doors: [],
    devices: [],
    furniture: [],
    rooms: []
  });

  // efect care aplica clasa 'dark' pe elementul html de baza
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // floating menu pentru uneltele de desenat
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

  // culorile temei
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

  // test elemente catalog
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

  // functia de click pe grid pentru a pune device-uri
  const handleCanvasClick = (col: number, row: number) => {
    // nu punem iconite daca suntem in modul de desenat ziduri
    if (!selectedDevice || activeTool) return;

    const exists = placedIcons.some(icon => icon.col === col && icon.row === row);
    if (!exists) {
      setPlacedIcons([...placedIcons, {
        col,
        row,
        id: Date.now().toString(),
        type: selectedDevice.type,
        name: selectedDevice.name,
        brand: selectedDevice.brand,
        status: selectedDevice.status
      }]);
    }
  };

  // functia apelata de canvas cand o linie/zid este terminata
  const handleLineComplete = (type: string, start: {col: number, row: number}, end: {col: number, row: number}) => {
    setLines(prevLines => [
      ...prevLines, 
      { id: Date.now().toString(), type, start, end }
    ]);
  };

  // functia pentru a selecta o unealta din bara de jos (toggle)
  const toggleTool = (toolName: string) => {
    const tool = toolName.toLowerCase();
    setActiveTool(prevTool => prevTool === tool ? null : tool);
    setSelectedDevice(null); // debifeaza device-ul cand vrem sa desenam pereti
  };

  // functie pentru generarea JSON pentru pereti
  const generateWallJSON = (line: { id: string, type: string, start: {col: number, row: number}, end: {col: number, row: number} }): Wall => {
    const scale = layout.dotSpacing || 1;
    return {
      x1: Math.trunc(line.start.col * scale),
      y1: Math.trunc(line.start.row * scale),
      x2: Math.trunc(line.end.col * scale),
      y2: Math.trunc(line.end.row * scale)
    };
  };

  // functie pentru generarea JSON pentru ferestre
  const generateWindowJSON = (line: { id: string, type: string, start: {col: number, row: number}, end: {col: number, row: number} }): Window => {
    const scale = layout.dotSpacing || 1;
    return {
      x: Math.trunc(Math.min(line.start.col, line.end.col) * scale),
      y: Math.trunc(Math.min(line.start.row, line.end.row) * scale)
    };
  };

  // functie pentru generarea JSON pentru usi
  const generateDoorJSON = (line: { id: string, type: string, start: {col: number, row: number}, end: {col: number, row: number} }): Door => {
    const scale = layout.dotSpacing || 1;
    return {
      x: Math.trunc(Math.min(line.start.col, line.end.col) * scale),
      y: Math.trunc(Math.min(line.start.row, line.end.row) * scale)
    };
  };

  // functie pentru generarea JSON pentru mobilier
  const generateFurnitureJSON = (line: { id: string, type: string, start: {col: number, row: number}, end: {col: number, row: number} }): Furniture => {
    const scale = layout.dotSpacing || 1;
    return {
      x1: Math.trunc(line.start.col * scale),
      y1: Math.trunc(line.start.row * scale),
      x2: Math.trunc(line.end.col * scale),
      y2: Math.trunc(line.end.row * scale)
    };
  };

  // functie pentru generarea JSON pentru device-uri
  const generateDeviceJSON = (icon: { col: number, row: number, type: string, id: string, name: string, brand: string, status: string }): Device => {
    const scale = layout.dotSpacing || 1;
    return {
      coordinates: {
        x: Math.trunc(icon.col * scale),
        y: Math.trunc(icon.row * scale)
      },
      rotationAngle: 0,
      device: {
        id: icon.id,
        name: icon.name,
        price: 59,
        ecosystem: 'Apple HomeKit',
        protocol: icon.type === 'router' ? 'WiFi' : 'Zigbee',
        lumens: icon.type === 'bec' ? 800 : 0,
        requiresPlug: icon.type !== 'bec',
        rangeRadius: icon.type === 'senzor' ? 10 : 0,
        deviceType: icon.type,
        mountType: icon.type === 'tv' ? 'wall' : 'table',
        fieldofView: icon.type === 'interfon' ? 120 : 0,
        powerConsumption: icon.type === 'bec' ? 10 : 5,
        comunicationFrequency: icon.type === 'router' ? '2.4GHz' : '868MHz',
        width: 10
      }
    };
  };
  const exampleDevices: Device[] = [
    {
      coordinates: { x: 120, y: 80 },
      rotationAngle: 0,
      device: {
        id: 'sample-1',
        name: 'Philips Hue E27',
        price: 49,
        ecosystem: 'Apple HomeKit',
        protocol: 'Zigbee',
        lumens: 800,
        requiresPlug: false,
        rangeRadius: 10,
        deviceType: 'bec',
        mountType: 'ceiling',
        fieldofView: 0,
        powerConsumption: 10,
        comunicationFrequency: '2.4GHz',
        width: 6
      }
    },
    {
      coordinates: { x: 200, y: 120 },
      rotationAngle: 0,
      device: {
        id: 'sample-2',
        name: 'Nest Thermostat',
        price: 279,
        ecosystem: 'Apple HomeKit',
        protocol: 'WiFi',
        lumens: 0,
        requiresPlug: true,
        rangeRadius: 15,
        deviceType: 'senzor',
        mountType: 'wall',
        fieldofView: 0,
        powerConsumption: 3,
        comunicationFrequency: '2.4GHz',
        width: 8
      }
    },
    {
      coordinates: { x: 320, y: 60 },
      rotationAngle: 0,
      device: {
        id: 'sample-3',
        name: 'Samsung Smart TV',
        price: 638,
        ecosystem: 'Apple HomeKit',
        protocol: 'WiFi',
        lumens: 0,
        requiresPlug: true,
        rangeRadius: 0,
        deviceType: 'tv',
        mountType: 'wall',
        fieldofView: 0,
        powerConsumption: 120,
        comunicationFrequency: '2.4GHz',
        width: 120
      }
    }
  ];
  // functie pentru actualizarea datelor de export cand se adauga elemente
  const updateExportData = () => {
    const scale = layout.dotSpacing || 1;
    const walls: Wall[] = lines.filter(line => line.type === 'wall').map(generateWallJSON);
    const windows: Window[] = lines.filter(line => line.type === 'window').map(generateWindowJSON);
    const doors: Door[] = lines.filter(line => line.type === 'door').map(generateDoorJSON);
    const furniture: Furniture[] = lines.filter(line => line.type === 'furniture').map(generateFurnitureJSON);
    const plugs: Plug[] = placedIcons
      .filter(icon => icon.type === 'priza')
      .map(icon => ({
        x: Math.trunc(icon.col * scale),
        y: Math.trunc(icon.row * scale)
      }));

    const roomSquareMeters = (() => {
      if (!walls.length) return 10;
      const xs = walls.flatMap(w => [w.x1, w.x2]);
      const ys = walls.flatMap(w => [w.y1, w.y2]);
      const widthCm = Math.max(...xs) - Math.min(...xs);
      const heightCm = Math.max(...ys) - Math.min(...ys);
      return Math.max(1, Math.trunc((widthCm / 100) * (heightCm / 100)));
    })();

    const rooms: Room[] = [{
      id: 'room-001',
      squareMeters: roomSquareMeters,
      wallType: 'concrete',
      walls,
      doors,
      windows,
      plugs
    }];

    const devices: Device[] = [
      ...exampleDevices,
      ...placedIcons.map(generateDeviceJSON)
    ];

    setExportData({ devices, furniture, rooms });
  };

  // efect pentru actualizarea datelor de export cand se schimba elementele
  useEffect(() => {
    updateExportData();
  }, [placedIcons, lines]);

  // functie pentru exportul datelor in format JSON
  const exportToJSON = () => {
    const dataToExport = {
      house: {
        id: layoutId,
        name: "Smart House Setup",
        scale: "cm",
        maxBudget: 15000,
        targetEcosystem: "Apple HomeKit",
        rooms: exportData.rooms,
        devices: exportData.devices,
        furniture: exportData.furniture
      }
    };

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `smart-house-setup-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className={`min-h-screen flex flex-col font-montserrat transition-colors duration-300 ${theme.bg} ${theme.textMain}`}>

      {/* header */}
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

          <div
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-12 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors duration-300 ${isDarkMode ? 'bg-[#0077B6]' : 'bg-[#8FAECB]'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
          </div>
        </div>
      </header>

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
            <button 
              onClick={exportToJSON}
              className={`flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-sm shadow-sm transition-colors ${theme.btnSecondary} ${theme.textMain}`}
            >
              <span className="opacity-60">💾</span> Export JSON
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row gap-6 mt-2 mb-10">

          {/* sidebar stanga */}
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

            <div className="mt-auto flex flex-col gap-3">
              <button className={`w-full py-3 font-bold text-[11px] rounded-2xl flex justify-center items-center gap-2 shadow-sm transition-colors ${isDarkMode ? 'bg-[#3A3A4E] text-[#F4A300]' : 'bg-[#E4EEF7] text-[#5A6080]'}`}>
                ⚠️ No Filters Selected
              </button>
              <button className="w-full py-3 bg-[#00B4D8] text-white font-bold text-[11px] rounded-2xl shadow-sm hover:bg-[#0096B4] transition-colors">
                ↻ Reset Filters
              </button>
            </div>
          </aside>

          {/* container central canvas */}
          <div className={`flex-1 relative min-h-[600px] rounded-3xl ${theme.canvasBorder}`}>
            <div className="absolute inset-0 rounded-3xl overflow-hidden">

              <GridCanvas
                isDarkMode={isDarkMode}
                placedIcons={placedIcons}           
                lines={lines}                        // pasam lista cu ziduri desenate catre canvas
                activeTool={activeTool}              // ii spunem canvas-ului daca desenam
                onCanvasClick={handleCanvasClick}    
                onLineComplete={handleLineComplete}  // canvas-ul anunta cand s-a unit o linie
                onUpdate={setLayout}                 
              />

              {/* randare iconite peste grid */}
              {layout.dotSpacing > 0 && placedIcons.map((icon, index) => {
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
                          className={`absolute -top-3 -right-4 w-6 h-6 flex items-center justify-center rounded-full shadow-xl z-30 text-[10px] font-bold transition-all duration-200 border-2 ${isDarkMode ? 'bg-[#3A3A4E] text-[#FF4D4D] border-[#1A1A1E] hover:bg-[#4A4A60]' : 'bg-white text-[#EF4444] border-[#EDEFF0] hover:bg-gray-50'}`}
                        >
                          ✕
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* bara instrumente (drawing tools) de jos */}
            <div id="floating-menu" className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex gap-8 px-10 py-4 rounded-full shadow-2xl border transition-all duration-300 ${isDarkMode ? 'bg-[#2F2F41]/90 backdrop-blur-md border-[#3A3A4E]' : 'bg-white/90 backdrop-blur-md border-[#C2C9CC]'}`}>
              {['Wall', 'Window', 'Door', 'Line', 'Furniture'].map((tool) => {
                const isSelected = activeTool === tool.toLowerCase();
                return (
                  <button 
                    key={tool} 
                    onClick={() => toggleTool(tool)}
                    className={`flex flex-col items-center gap-1 group transition-all ${isSelected ? 'scale-110' : 'hover:scale-105'}`}
                  >
                    <div className={`w-8 h-6 border-2 rounded-sm transition-colors ${isSelected ? 'border-[#00B4D8] bg-[#00B4D8]/20' : (isDarkMode ? 'border-white group-hover:border-[#00B4D8]' : 'border-[#2C3E50] group-hover:border-[#00B4D8]')}`}></div>
                    <span className={`text-[9px] uppercase font-bold tracking-wider transition-colors ${isSelected ? 'text-[#00B4D8]' : (isDarkMode ? 'text-white group-hover:text-[#00B4D8]' : 'text-[#2C3E50] group-hover:text-[#00B4D8]')}`}>{tool}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* sidebar dreapta */}
          <aside className="w-full lg:w-[320px] flex flex-col gap-6">

            {/* sectiune catalog */}
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
                        setActiveTool(null); // debifeaza unealta de desen, vrem sa punem device-uri
                        setSelectedDevice(selectedDevice?.id === d.id ? null : d);
                      }}
                      className={`flex items-center justify-between p-3 rounded-2xl shadow-sm cursor-pointer border-2 transition-all ${selectedDevice?.id === d.id
                          ? `scale-[1.02] z-10 ${isDarkMode ? 'border-[#00B4D8]' : 'border-[#2C3E50]'}`
                          : `border-transparent ${theme.card}`
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm`}>
                          <IconComponent color={isDarkMode ? "white" : "#2C3E50"} />
                        </div>
                        <div>
                          <div className={`text-[11px] font-bold ${theme.textMain}`}>{d.name}</div>
                          <div className={`text-[9px] font-medium mt-0.5 ${theme.textMuted}`}>{d.price} · {d.brand}</div>
                        </div>
                      </div>
                      <div className={`font-bold text-[9px] transition-colors ${selectedDevice?.id === d.id ? `${isDarkMode ? 'text-[#00B4D8]' : 'text-[#2C3E50]'} opacity-100` : 'opacity-0'}`}>
                        SELECTED
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* lista device-uri adaugate */}
            <div className={`rounded-3xl p-6 shadow-sm flex flex-col transition-all duration-300 ${theme.panel} h-[280px]`}>
              <h3 className={`font-bold text-[13px] mb-4 ${theme.textMain}`}>Installed Devices</h3>
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
                        className={`flex items-center justify-between p-3 rounded-2xl shadow-sm transition-all border border-transparent ${isDarkMode ? 'bg-[#3A3A4E]' : 'bg-white'} min-h-[70px]`}
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
                        <div className="text-[14px] pr-2 text-green-500 font-bold">✓</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* footer */}
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