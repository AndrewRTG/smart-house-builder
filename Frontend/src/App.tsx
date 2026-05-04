import React, { useState, useEffect, useRef } from 'react';

// --- Imports from original Frontend ---
import SetupWizard from './features/wizard/component-fullscreen/SetupWizard.jsx';
import Navbar from './features/wizard/components/navbar.jsx';
import useFilterStore from './store/useFilterStore.js';
import GridCanvas from './features/canvas/GridCanvas';
import {
    WallIcon, DoorIcon, LineIcon, WindowIcon, FurnitureIcon,
    ControllerIcon, SenzorIcon, LockIcon, RouterIcon, TvIcon,
    InterfonIcon, PrelungitorIcon, SoundSystemIcon, BecIcon,
    PrizaIcon, AspiratorIcon, HubIcon
} from './features/canvas/Icons';
import WizardSidebar from './features/wizard/components/WizardSidebar.jsx';

// --- Interfaces for Canvas JSON Export ---
interface Wall {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

interface Window {
    x: number;
    y: number;
    width: number;
    height: number;
    distanceFromFloor: number;
}

interface Door {
    x: number;
    y: number;
}

interface Device {
    coordinates: { x: number; y: number };
    rotationAngle: number;
    device: {
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
        fieldOfView: number;
        powerConsumption: number;
        communicationFrequency: string;
        width: number;
    }
}

interface Plug {
    x: number;
    y: number;
}

interface Room {
    id: string;
    squareMeters: number;
    wallType: string;
    walls: Wall[];
    doors: Door[];
    windows: Window[];
    plugs: Plug[];
}

interface HistorySnapshot {
    lines: any[];
    icons: any[];
    furniture: any[];
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:20025';

// Mapare icon cu denumire element
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

const TOOL_ICON_MAP: Record<string, React.FC<{ color: string }>> = {
    wall: WallIcon,
    window: WindowIcon,
    door: DoorIcon,
    line: LineIcon,
    furniture: FurnitureIcon
};

const App: React.FC = () => {
    // === VIEW STATE ===
    // This state controls whether we show the Wizard or the Canvas
    const [activeView, setActiveView] = useState<'wizard' | 'canvas'>('wizard');

    const generateLayoutId = () => {
        const randomSegment = () => Math.floor(1000 + Math.random() * 9000).toString();
        return `layout-uuid-${randomSegment()}-${randomSegment()}`;
    };

    const [layoutId] = useState(generateLayoutId);
    const { darkMode: isDarkMode, toggleDarkMode } = useFilterStore();

    // === CANVAS STATE ===
    const [showFurnitureMenu, setShowFurnitureMenu] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<{ id: string, name: string, brand: string, type: string, status: string, price: string } | null>(null);
    const [hoveredIconIndex, setHoveredIconIndex] = useState<number | null>(null);
    const [placedIcons, setPlacedIcons] = useState<{ col: number, row: number, type: string, id: string, name: string, brand: string, status: string, priceEUR: number, scale?: number, rotation?: number }[]>([]);
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const [previewTransform, setPreviewTransform] = useState({ scale: 1, rotation: 0 });
    const [draggingItem, setDraggingItem] = useState<{ type: 'icon' | 'furniture' | 'wall', id: string } | null>(null);
    const [canvasZoom, setCanvasZoom] = useState(1);
    const [lines, setLines] = useState<{ id: string, type: string, start: { col: number, row: number }, end: { col: number, row: number } }[]>([]);
    const [placedFurniture, setPlacedFurniture] = useState<any[]>([]);
    const [mouseGridPos, setMouseGridPos] = useState<{ col: number, row: number } | null>(null);
    const [layout, setLayout] = useState({ offsetX: 0, offsetY: 0, dotSpacing: 0 });

    // === HISTORY STATE ===
    const [undoStack, setUndoStack] = useState<HistorySnapshot[]>([]);
    const [redoStack, setRedoStack] = useState<HistorySnapshot[]>([]);

    // === EFFECTS ===
    useEffect(() => {
        const handleWheelCanvas = (e: WheelEvent) => {
            if (e.defaultPrevented) return;
            if (e.ctrlKey) {
                e.preventDefault();
                const zoomDelta = e.deltaY < 0 ? 0.05 : -0.05;
                setCanvasZoom(prev => Math.min(Math.max(0.4, prev + zoomDelta), 4));
            }
        };

        const viewport = document.getElementById('canvas-viewport');
        if (viewport) {
            viewport.addEventListener('wheel', handleWheelCanvas, { passive: false });
            return () => viewport.removeEventListener('wheel', handleWheelCanvas);
        }
    }, [activeView]); // Re-attach if view changes

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'r') {
                if (selectedDevice) {
                    setPreviewTransform(p => ({ ...p, rotation: (p.rotation + 90) % 360 }));
                } else if (draggingItem?.type === 'icon') {
                    setPlacedIcons(prev => prev.map(i => i.id === draggingItem.id ? { ...i, rotation: ((i.rotation || 0) + 90) % 360 } : i));
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedDevice, draggingItem]);

    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (selectedDevice || draggingItem?.type === 'icon') {
                e.preventDefault();
                const zoomDelta = e.deltaY < 0 ? 0.2 : -0.2;
                if (selectedDevice) {
                    setPreviewTransform(p => ({ ...p, scale: Math.max(0.5, p.scale + zoomDelta) }));
                } else if (draggingItem?.type === 'icon') {
                    setPlacedIcons(prev => prev.map(i => i.id === draggingItem.id ? { ...i, scale: Math.max(0.5, (i.scale || 1) + zoomDelta) } : i));
                }
            }
        };
        window.addEventListener('wheel', handleWheel, { passive: false });
        return () => window.removeEventListener('wheel', handleWheel);
    }, [selectedDevice, draggingItem]);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    useEffect(() => {
        if (activeView !== 'canvas') return;
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
    }, [activeView]);

    // === THEME COLORS ===
    const theme = {
        bg: isDarkMode ? 'bg-[#1A1A1E]' : 'bg-[#EDEFF0]',
        footerBg: isDarkMode ? 'bg-[#2F2F41]' : 'bg-[#BDD3E7]',
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

    // === CANVAS FUNCTIONS ===
    const saveHistory = () => {
        const currentSnapshot: HistorySnapshot = {
            lines: [...lines],
            icons: [...placedIcons],
            furniture: [...placedFurniture]
        };
        setUndoStack(prev => [currentSnapshot, ...prev].slice(0, 30));
        setRedoStack([]);
    };

    const handleUndo = () => {
        if (undoStack.length === 0) return;
        const prevState = undoStack[0];
        const remaining = undoStack.slice(1);
        setRedoStack(prev => [{ lines: [...lines], icons: [...placedIcons], furniture: [...placedFurniture] }, ...prev]);
        setLines([...prevState.lines]);
        setPlacedIcons([...prevState.icons]);
        setPlacedFurniture([...prevState.furniture]);
        setUndoStack(remaining);
    };

    const handleRedo = () => {
        if (redoStack.length === 0) return;
        const nextState = redoStack[0];
        const remaining = redoStack.slice(1);
        setUndoStack(prev => [{ lines: [...lines], icons: [...placedIcons], furniture: [...placedFurniture] }, ...prev]);
        setLines([...nextState.lines]);
        setPlacedIcons([...nextState.icons]);
        setPlacedFurniture([...nextState.furniture]);
        setRedoStack(remaining);
    };

    const checkUniversalCollision = (col: number, row: number, ignoreId?: string) => {
        const hitIcon = placedIcons.some(icon => icon.id !== ignoreId && icon.col === col && icon.row === row);
        if (hitIcon) return true;

        const hitFurniture = placedFurniture.some(f => {
            if (f.id === ignoreId) return false;
            const halfW = f.widthCols / 2;
            const halfH = f.heightCols / 2;
            return (col >= f.centerCol - halfW && col <= f.centerCol + halfW && row >= f.centerRow - halfH && row <= f.centerRow + halfH);
        });
        if (hitFurniture) return true;

        const hitWall = lines.some(line => {
            if (line.id === ignoreId) return false;
            const isVertical = line.start.col === line.end.col;
            const isHorizontal = line.start.row === line.end.row;

            if (isVertical && col === line.start.col) {
                const minRow = Math.min(line.start.row, line.end.row);
                const maxRow = Math.max(line.start.row, line.end.row);
                return row >= minRow && row <= maxRow;
            }
            if (isHorizontal && row === line.start.row) {
                const minCol = Math.min(line.start.col, line.end.col);
                const maxCol = Math.max(line.start.col, line.end.col);
                return col >= minCol && col <= maxCol;
            }
            return false;
        });
        if (hitWall) return true;
        return false;
    };

    const handleCanvasClick = (col: number, row: number) => {
        if (!selectedDevice || activeTool) return;
        const isOccupied = checkUniversalCollision(col, row);
        if (!isOccupied) {
            saveHistory();
            setPlacedIcons([...placedIcons, {
                col, row, id: Date.now().toString(), type: selectedDevice.type,
                name: selectedDevice.name, brand: selectedDevice.brand,
                status: selectedDevice.status, priceEUR: parseInt(selectedDevice.price.replace('€', '')),
                scale: previewTransform.scale, rotation: previewTransform.rotation
            }]);
            setPreviewTransform({ scale: 1, rotation: 0 });
        }
    };

    const handleLineComplete = (type: string, start: {col: number, row: number}, end: {col: number, row: number}) => {
        setLines(prevLines => [...prevLines, { id: Date.now().toString(), type, start, end }]);
    };

    const toggleTool = (toolName: string) => {
        const tool = toolName.toLowerCase();
        if (tool === 'furniture') {
            if (activeTool?.startsWith('furniture_') || showFurnitureMenu) {
                setActiveTool(null);
                setShowFurnitureMenu(false);
            } else {
                setShowFurnitureMenu(true);
                setSelectedDevice(null);
            }
            return;
        }
        if (activeTool === tool) {
            setActiveTool(null);
        } else {
            setActiveTool(tool);
            setSelectedDevice(null);
            setShowFurnitureMenu(false);
        }
    };

    // === EXPORT LOGIC ===
    const [exportData, setExportData] = useState<{ devices: Device[]; rooms: Room[]; }>({ devices: [], rooms: [] });
    const backendSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const generateWallJSON = (line: any): Wall => {
        const scale = layout.dotSpacing || 1;
        return { x1: Math.trunc(line.start.col * scale), y1: Math.trunc(line.start.row * scale), x2: Math.trunc(line.end.col * scale), y2: Math.trunc(line.end.row * scale) };
    };

    const generateWindowJSON = (line: any): Window => {
        const scale = layout.dotSpacing || 1;
        return {
            x: Math.trunc(Math.min(line.start.col, line.end.col) * scale),
            y: Math.trunc(Math.min(line.start.row, line.end.row) * scale),
            width: Math.trunc(Math.abs(line.end.col - line.start.col) * scale) || Math.trunc(scale),
            height: Math.trunc(Math.abs(line.end.row - line.start.row) * scale) || Math.trunc(scale),
            distanceFromFloor: 0
        };
    };

    const generateDoorJSON = (line: any): Door => {
        const scale = layout.dotSpacing || 1;
        return { x: Math.trunc(Math.min(line.start.col, line.end.col) * scale), y: Math.trunc(Math.min(line.start.row, line.end.row) * scale) };
    };

    const generateDeviceJSON = (icon: any): Device => {
        const scale = layout.dotSpacing || 1;
        return {
            coordinates: { x: Math.trunc(icon.col * scale), y: Math.trunc(icon.row * scale) },
            rotationAngle: 0,
            device: {
                id: icon.id, name: icon.name, price: icon.priceEUR, ecosystem: 'Apple HomeKit',
                protocol: icon.type === 'router' ? 'WiFi' : 'Zigbee', lumens: icon.type === 'bec' ? 800 : 0,
                requiresPlug: icon.type !== 'bec', rangeRadius: icon.type === 'senzor' ? 10 : 0,
                deviceType: icon.type, mountType: icon.type === 'tv' ? 'wall' : 'table',
                fieldOfView: icon.type === 'interfon' ? 120 : 0, powerConsumption: icon.type === 'bec' ? 10 : 5,
                communicationFrequency: icon.type === 'router' ? '2.4GHz' : '868MHz', width: 10
            }
        };
    };

    const updateExportData = () => {
        const scale = layout.dotSpacing || 1;
        const walls: Wall[] = lines.filter(line => line.type === 'wall').map(generateWallJSON);
        const windows: Window[] = lines.filter(line => line.type === 'window').map(generateWindowJSON);
        const doors: Door[] = lines.filter(line => line.type === 'door').map(generateDoorJSON);
        const plugs: Plug[] = placedIcons.filter(icon => icon.type === 'priza').map(icon => ({ x: Math.trunc(icon.col * scale), y: Math.trunc(icon.row * scale) }));

        const roomSquareMeters = (() => {
            if (!walls.length) return 10;
            const xs = walls.flatMap(w => [w.x1, w.x2]);
            const ys = walls.flatMap(w => [w.y1, w.y2]);
            const widthCm = Math.max(...xs) - Math.min(...xs);
            const heightCm = Math.max(...ys) - Math.min(...ys);
            return Math.max(1, Math.trunc((widthCm / 100) * (heightCm / 100)));
        })();

        const rooms: Room[] = [{ id: 'room-001', squareMeters: roomSquareMeters, wallType: 'concrete', walls, doors, windows, plugs }];
        const devices: Device[] = placedIcons.filter((icon) => icon.type !== 'priza').map(generateDeviceJSON);
        setExportData({ devices, rooms });
    };

    useEffect(() => {
        updateExportData();
    }, [placedIcons, lines, layout.dotSpacing]);

    const buildSetupPayload = () => ({
        id: layoutId, scale: 'cm', maxBudget: 15000, targetEcosystem: 'Apple HomeKit',
        rooms: exportData.rooms, devices: exportData.devices,
    });

    useEffect(() => {
        const hasGridContent = placedIcons.length > 0 || lines.length > 0;
        if (backendSyncTimerRef.current) {
            clearTimeout(backendSyncTimerRef.current);
            backendSyncTimerRef.current = null;
        }
        if (!hasGridContent) return;

        backendSyncTimerRef.current = setTimeout(() => {
            backendSyncTimerRef.current = null;
            const body = JSON.stringify(buildSetupPayload());
            fetch(`${API_BASE}/api/team2/layouts/save`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
            }).catch(() => {});
        }, 450);

        return () => {
            if (backendSyncTimerRef.current) {
                clearTimeout(backendSyncTimerRef.current);
                backendSyncTimerRef.current = null;
            }
        };
    }, [exportData, layoutId, placedIcons.length, lines.length]);

    const exportToJSON = () => {
        const dataToExport = {
            house: { id: layoutId, name: "Smart House Setup", scale: "cm", maxBudget: 15000, targetEcosystem: "Apple HomeKit", rooms: exportData.rooms, devices: exportData.devices }
        };
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `smart-house-setup-${new Date().toISOString().split('T')[0]}.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    // === RENDER ===
    return (
        <div className={`min-h-screen flex flex-col font-montserrat transition-colors duration-300 ${theme.bg} ${theme.textMain}`}>

            {/* NAVBAR (Unified from Source 2) */}
            <Navbar
                darkMode={isDarkMode}
                onToggleDarkMode={toggleDarkMode}
                onOpenWizard={() => setActiveView('wizard')}
                isLoggedIn={false}
                userAvatar={null}
            />

            {/* VIEW RENDERER */}
            {activeView === 'wizard' ? (
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <SetupWizard onFinish={(data: any) => {
                        console.log("Wizard complete:", data);
                        setActiveView('canvas'); // Auto switch to Canvas when wizard is done!
                    }} />

                    {/* Optional manual override to jump to canvas */}
                    <button
                        onClick={() => setActiveView('canvas')}
                        className={`mt-8 px-6 py-2 rounded-full text-sm font-semibold transition-colors ${theme.btnSecondary} ${theme.textMain}`}
                    >
                        Skip to Layout Canvas &rarr;
                    </button>
                </div>
            ) : (
                <main className="flex-1 flex flex-col px-8 py-4 max-w-[1700px] mx-auto w-full gap-6 pb-40">

                    {/* Canvas Toolbar Header */}
                    <div className="flex flex-col xl:flex-row justify-between items-center gap-6">
                        <button
                            onClick={() => setActiveView('wizard')}
                            className={`px-10 py-3 rounded-full font-semibold text-sm shadow-sm transition-colors ${theme.btnSecondary} ${theme.textMain}`}
                        >
                            &larr; Back to Wizard
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
                            <button onClick={exportToJSON} className={`flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-sm shadow-sm transition-colors ${theme.btnSecondary} ${theme.textMain}`}>
                                <span className="opacity-60">💾</span> Save
                            </button>
                            <button className={`flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-sm shadow-sm transition-colors ${theme.btnSecondary} ${theme.textMain}`}>
                                <span className="opacity-60">🚀</span> Post
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col lg:flex-row gap-6 mt-2 mb-10">
                        {/* Left Sidebar */}
                        <div className="w-full lg:w-[280px] flex-shrink-0">
                            <WizardSidebar />
                        </div>

                        {/* Central Canvas Container */}
                        <div className={`flex-1 relative min-h-[600px] rounded-3xl ${theme.canvasBorder}`}>
                            <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-inner border border-transparent">

                                {/* Zoom Controls */}
                                <div className={`absolute top-4 right-8 z-40 flex items-center gap-3 px-4 py-2 rounded-2xl shadow-xl border transition-colors duration-300 ${isDarkMode ? 'bg-[#2F2F41]/95 border-[#3A3A4E]' : 'bg-white/95 border-[#C2C9CC]'}`}>
                                    <span className={`text-[9px] font-bold tracking-wider ${theme.textMuted}`}>ZOOM</span>
                                    <button onClick={() => setCanvasZoom(z => Math.max(0.4, z - 0.1))} className={`font-bold text-lg leading-none transition-colors ${theme.textMain} hover:text-[#00B4D8]`}>-</button>
                                    <input type="range" min="0.4" max="4" step="0.05" value={canvasZoom} onChange={(e) => setCanvasZoom(Number(e.target.value))} className="w-24 accent-[#00B4D8] cursor-pointer" />
                                    <button onClick={() => setCanvasZoom(z => Math.min(4, z + 0.1))} className={`font-bold text-lg leading-none transition-colors ${theme.textMain} hover:text-[#00B4D8]`}>+</button>
                                    <span className={`text-[10px] font-bold w-9 text-right ${theme.textMain}`}>{Math.round(canvasZoom * 100)}%</span>
                                </div>

                                {/* Viewport */}
                                <div id="canvas-viewport" className={`absolute inset-0 rounded-3xl overflow-auto custom-scrollbar flex transition-colors duration-300 ${isDarkMode ? 'bg-[#5293DE]' : 'bg-[#C2C9CC]'}`}>
                                    <div style={{ width: `${canvasZoom * 100}%`, height: `${canvasZoom * 100}%`, minWidth: '100%', minHeight: '100%', margin: 'auto', position: 'relative', flexShrink: 0 }}>
                                        <GridCanvas
                                            isDarkMode={isDarkMode}
                                            placedIcons={placedIcons}
                                            placedFurniture={placedFurniture}
                                            setPlacedFurniture={setPlacedFurniture}
                                            lines={lines}
                                            setLines={setLines}
                                            activeTool={activeTool}
                                            onCanvasClick={handleCanvasClick}
                                            onLineComplete={handleLineComplete}
                                            onUpdate={setLayout}
                                            onRedo={handleRedo}
                                            draggingItem={draggingItem}
                                            setDraggingItem={setDraggingItem}
                                            onMouseMove={(col, row) => setMouseGridPos({ col, row })}
                                            onMouseLeave={() => setMouseGridPos(null)}
                                            layout={layout}
                                            setPlacedIcons={setPlacedIcons}
                                            checkCollision={checkUniversalCollision}
                                            saveHistory={saveHistory}
                                            undo={handleUndo}
                                            redo={handleRedo}
                                            canUndo={undoStack.length > 0}
                                            canRedo={redoStack.length > 0}
                                        />

                                        {layout.dotSpacing > 0 && placedIcons.map((icon, index) => {
                                            const IconComponent = ICON_MAP[icon.type] || ControllerIcon;
                                            const isDraggingThis = draggingItem?.type === 'icon' && draggingItem.id === icon.id;
                                            const isHovered = hoveredIconIndex === index;

                                            return (
                                                <div
                                                    key={icon.id}
                                                    onMouseEnter={() => setHoveredIconIndex(index)}
                                                    onMouseLeave={() => setHoveredIconIndex(null)}
                                                    onMouseDown={(e) => {
                                                        if ((e.target as HTMLElement).closest('button')) return;
                                                        if (activeTool) return;
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setDraggingItem({ type: 'icon', id: icon.id });
                                                    }}
                                                    style={{
                                                        position: 'absolute', left: layout.offsetX + icon.col * layout.dotSpacing, top: layout.offsetY + icon.row * layout.dotSpacing,
                                                        width: layout.dotSpacing * (icon.scale || 1), height: layout.dotSpacing * (icon.scale || 1),
                                                        transform: `translate(-50%, -50%) rotate(${icon.rotation || 0}deg)`,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        zIndex: isDraggingThis ? 100 : 30, cursor: isDraggingThis ? 'grabbing' : 'grab',
                                                        opacity: isDraggingThis ? 0.6 : 1, pointerEvents: activeTool ? 'none' : 'auto', userSelect: 'none'
                                                    }}
                                                >
                                                    <div className="relative group flex items-center justify-center w-full h-full">
                                                        <IconComponent color={isDarkMode ? "white" : "#2C3E50"} />
                                                        {isDraggingThis && (
                                                            <div className={`absolute top-full mt-2 text-[9px] font-bold text-center whitespace-nowrap drop-shadow-md ${isDarkMode ? 'text-white' : 'text-[#2C3E50]'}`}>
                                                                PRESS 'R' TO ROTATE<br/>SCROLL TO SCALE
                                                            </div>
                                                        )}
                                                        {isHovered && !isDraggingThis && !activeTool && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    saveHistory();
                                                                    setPlacedIcons(placedIcons.filter((_, i) => i !== index));
                                                                    setHoveredIconIndex(null);
                                                                }}
                                                                className={`absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center rounded-full shadow-md z-[60] text-[10px] font-bold transition-all duration-200 border cursor-pointer ${isDarkMode ? 'bg-[#1A1A1E] text-red-500 border-red-500/30 hover:bg-red-500 hover:text-white' : 'bg-white text-red-600 border-red-200 hover:bg-red-600 hover:text-white'}`}
                                                            >✕</button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {selectedDevice && mouseGridPos && !activeTool && (
                                            <div
                                                style={{
                                                    position: 'absolute', left: layout.offsetX + mouseGridPos.col * layout.dotSpacing, top: layout.offsetY + mouseGridPos.row * layout.dotSpacing,
                                                    width: layout.dotSpacing * previewTransform.scale, height: layout.dotSpacing * previewTransform.scale,
                                                    transform: `translate(-50%, -50%) rotate(${previewTransform.rotation}deg)`,
                                                    pointerEvents: 'none', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                    transition: 'left 0.1s ease-out, top 0.1s ease-out'
                                                }}
                                            >
                                                <div className={`relative p-2 rounded-lg transition-colors duration-200 ${checkUniversalCollision(mouseGridPos.col, mouseGridPos.row) ? 'bg-red-500/40 ring-2 ring-red-600' : 'bg-green-500/40 ring-2 ring-green-600'}`}>
                                                    {React.createElement(ICON_MAP[selectedDevice.type] || ControllerIcon, { color: 'white' })}
                                                </div>
                                                <div className={`mt-2 text-[9px] font-bold text-center whitespace-nowrap drop-shadow-md ${isDarkMode ? 'text-white' : 'text-[#2C3E50]'}`}>
                                                    PRESS 'R' TO ROTATE<br/>SCROLL TO SCALE
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Floating Menu */}
                                <div id="floating-menu" className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex gap-8 px-10 py-4 rounded-full shadow-2xl border transition-all duration-300 ${isDarkMode ? 'bg-[#2F2F41]/90 backdrop-blur-md border-[#3A3A4E]' : 'bg-white/90 backdrop-blur-md border-[#C2C9CC]'}`}>
                                    {['Wall', 'Window', 'Door', 'Line', 'Furniture'].map((tool) => {
                                        const isFurniture = tool === 'Furniture';
                                        const isSelected = isFurniture ? activeTool?.startsWith('furniture_') : activeTool === tool.toLowerCase();
                                        const ToolIcon = TOOL_ICON_MAP[tool.toLowerCase()];

                                        return (
                                            <div key={tool} className="relative group">
                                                <button onClick={() => toggleTool(tool)} className={`flex flex-col items-center gap-1 transition-all ${isSelected ? 'scale-110' : 'hover:scale-105'}`}>
                                                    <div className="w-10 h-8 flex items-center justify-center">
                                                        <ToolIcon color={isSelected ? '#00B4D8' : (isDarkMode ? 'white' : '#2C3E50')} />
                                                    </div>
                                                    <span className={`text-[9px] uppercase font-bold tracking-wider ${isSelected ? 'text-[#00B4D8]' : (isDarkMode ? 'text-white' : 'text-[#2C3E50]')}`}>{tool}</span>
                                                </button>
                                                {isFurniture && showFurnitureMenu && (
                                                    <div className={`absolute bottom-full mb-4 left-1/2 -translate-x-1/2 flex gap-4 p-3 rounded-2xl border shadow-2xl animate-in fade-in slide-in-from-bottom-2 ${isDarkMode ? 'bg-[#3A3A4E] border-[#4A4A60]' : 'bg-white border-[#C2C9CC]'}`}>
                                                        {['Bed', 'Couch', 'Table'].map((item) => (
                                                            <button
                                                                key={item}
                                                                onClick={() => { setActiveTool(`furniture_${item.toLowerCase()}`); setShowFurnitureMenu(false); }}
                                                                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-colors ${activeTool === `furniture_${item.toLowerCase()}` ? 'bg-[#00B4D8] text-white' : (isDarkMode ? 'hover:bg-[#4A4A60] text-white' : 'hover:bg-gray-100 text-[#2C3E50]')}`}
                                                            >{item}</button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Right Sidebar */}
                        <aside className="w-full lg:w-[320px] flex flex-col gap-6">
                            <div className={`rounded-3xl p-6 shadow-sm flex flex-col transition-colors duration-300 ${theme.panel}`}>
                                <h3 className="font-bold text-[13px] mb-4">Device Catalog</h3>
                                <div className="relative mb-4">
                                    <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
                                    <input type="text" placeholder="Search devices..." className={`w-full py-2.5 pl-8 pr-4 rounded-xl text-xs font-medium outline-none shadow-sm focus:border-[#00B4D8] border border-transparent transition-colors ${isDarkMode ? 'bg-[#3A3A4E] text-white placeholder-gray-400' : 'bg-white text-[#2C3E50]'}`} />
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
                                                onClick={() => { setActiveTool(null); setSelectedDevice(selectedDevice?.id === d.id ? null : d); }}
                                                className={`flex items-center justify-between p-3 rounded-2xl shadow-sm cursor-pointer border-2 transition-all ${selectedDevice?.id === d.id ? `scale-[1.02] z-10 ${isDarkMode ? 'border-[#00B4D8]' : 'border-[#2C3E50]'}` : `border-transparent ${theme.card}`}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm"><IconComponent color={isDarkMode ? "white" : "#000000"} /></div>
                                                    <div>
                                                        <div className={`text-[11px] font-bold ${theme.textMain}`}>{d.name}</div>
                                                        <div className={`text-[9px] font-medium mt-0.5 ${theme.textMuted}`}>{d.price} · {d.brand}</div>
                                                    </div>
                                                </div>
                                                <div className={`font-bold text-[9px] transition-colors ${selectedDevice?.id === d.id ? `${isDarkMode ? 'text-[#00B4D8]' : 'text-[#2C3E50]'} opacity-100` : 'opacity-0'}`}>SELECTED</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className={`rounded-3xl p-6 shadow-sm flex flex-col transition-all duration-300 ${theme.panel} h-[280px]`}>
                                <h3 className={`font-bold text-[13px] mb-4 ${theme.textMain}`}>Installed Devices</h3>
                                <div className="flex flex-col gap-3 overflow-y-auto no-scrollbar flex-1">
                                    {placedIcons.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full opacity-50">
                                            <div className="text-[20px] mb-2">🏠</div>
                                            <div className={`text-[10px] font-medium ${theme.textMuted}`}>No devices active</div>
                                        </div>
                                    ) : (
                                        placedIcons.map((device, index) => {
                                            const IconComponent = ICON_MAP[device.type] || ControllerIcon;
                                            return (
                                                <div key={device.id || index} className={`flex items-center justify-between p-3 rounded-2xl shadow-sm transition-all border border-transparent ${isDarkMode ? 'bg-[#3A3A4E]' : 'bg-white'} min-h-[70px]`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-[#3A3A4E]' : 'bg-[#F8FAFC]'}`}><IconComponent color={isDarkMode ? "white" : "#2C3E50"} /></div>
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
            )}

            {/* Footer remains at the bottom in both views */}
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