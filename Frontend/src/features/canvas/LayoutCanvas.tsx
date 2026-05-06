import React, {useState, useEffect, useRef} from 'react';
import GridCanvas from './GridCanvas';
import {
    WallIcon, DoorIcon, LineIcon, WindowIcon, FurnitureIcon,
    ControllerIcon, SenzorIcon, LockIcon, RouterIcon, TvIcon,
    InterfonIcon, PrelungitorIcon, SoundSystemIcon, BecIcon,
    PrizaIcon, AspiratorIcon, HubIcon
} from './Icons';
import WizardSidebar from '../wizard/components/WizardSidebar';

// --- INTERFACES ---
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
        id: string; name: string; price: number; ecosystem: string; protocol: string;
        lumens: number; requiresPlug: boolean; rangeRadius: number; deviceType: string;
        mountType: string; fieldOfView: number; powerConsumption: number;
        communicationFrequency: string; width: number;
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

const ICON_MAP: Record<string, React.FC<{ color: string }>> = {
    bec: BecIcon, senzor: SenzorIcon, lock: LockIcon, router: RouterIcon,
    controller: ControllerIcon, tv: TvIcon, interfon: InterfonIcon,
    prelungitor: PrelungitorIcon, soundsystem: SoundSystemIcon,
    priza: PrizaIcon, aspirator: AspiratorIcon, hub: HubIcon
};

const TOOL_ICON_MAP: Record<string, React.FC<{ color: string }>> = {
    wall: WallIcon, window: WindowIcon, door: DoorIcon, line: LineIcon, furniture: FurnitureIcon
};

const catalogDevices = [
    {id: '1', name: 'Philips Hue E27', price: '49€', brand: 'Philips', type: 'bec', status: 'online'},
    {id: '2', name: 'Nest Thermostat', price: '279€', brand: 'Google', type: 'senzor', status: 'online'},
    {id: '3', name: 'Lock', price: '30€', brand: 'Amazon', type: 'lock', status: 'online'},
    {id: '4', name: 'Router', price: '200€', brand: 'Amazon', type: 'router', status: 'online'},
    {id: '5', name: 'Ps5', price: '400€', brand: 'Sony', type: 'controller', status: 'online'},
    {id: '6', name: 'Smart Tv', price: '638€', brand: 'Samsung', type: 'tv', status: 'online'},
    {id: '7', name: 'Door Camera', price: '64€', brand: 'Amazon', type: 'interfon', status: 'online'},
    {id: '8', name: 'Extension Cord', price: '15€', brand: 'Amazon', type: 'prelungitor', status: 'online'},
    {id: '9', name: 'Sound system', price: '148€', brand: 'Amazon', type: 'soundsystem', status: 'online'},
    {id: '10', name: 'Plug', price: '5€', brand: 'Amazon', type: 'priza', status: 'online'},
    {id: '11', name: 'Smart vacum', price: '250€', brand: 'Amazon', type: 'aspirator', status: 'online'},
    {id: '12', name: 'Hub', price: '300€', brand: 'Amazon', type: 'hub', status: 'online'}
];

// PROPS
interface LayoutCanvasProps {
    isDarkMode: boolean;
    onBack: () => void;
}

const LayoutCanvas: React.FC<LayoutCanvasProps> = ({isDarkMode, onBack}) => {
    const generateLayoutId = () => {
        const randomSegment = () => Math.floor(1000 + Math.random() * 9000).toString();
        return `layout-uuid-${randomSegment()}-${randomSegment()}`;
    };

    const [layoutId] = useState(generateLayoutId);

    // --- STATE ---
    const [showFurnitureMenu, setShowFurnitureMenu] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<any | null>(null);
    const [hoveredIconIndex, setHoveredIconIndex] = useState<number | null>(null);
    const [placedIcons, setPlacedIcons] = useState<any[]>([]);
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const [previewTransform, setPreviewTransform] = useState({scale: 1, rotation: 0});
    const [draggingItem, setDraggingItem] = useState<{ type: 'icon' | 'furniture' | 'wall', id: string } | null>(null);
    const [canvasZoom, setCanvasZoom] = useState(1);
    const [lines, setLines] = useState<any[]>([]);
    const [placedFurniture, setPlacedFurniture] = useState<any[]>([]);
    const [mouseGridPos, setMouseGridPos] = useState<{ col: number, row: number } | null>(null);
    const [layout, setLayout] = useState({offsetX: 0, offsetY: 0, dotSpacing: 0});

    const [undoStack, setUndoStack] = useState<HistorySnapshot[]>([]);
    const [redoStack, setRedoStack] = useState<HistorySnapshot[]>([]);
    const [exportData, setExportData] = useState<{ devices: Device[]; rooms: Room[]; }>({devices: [], rooms: []});
    const backendSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // --- THEME ---
    const theme = {
        panel: isDarkMode ? 'bg-[#2F2F41]' : 'bg-[#BDD3E7]',
        card: isDarkMode ? 'bg-[#3A3A4E]' : 'bg-white',
        textMain: isDarkMode ? 'text-white' : 'text-[#2C3E50]',
        textMuted: isDarkMode ? 'text-[#9AA0BE]' : 'text-[#5A6080]',
        btnSecondary: isDarkMode ? 'bg-[#3A3A4E] hover:bg-[#4A4A60]' : 'bg-[#A9C4DD] hover:bg-[#9AB5CE]',
        canvasBorder: isDarkMode ? 'border-[#2D4E6C]' : 'border-[#C2C9CC]',
        divider: isDarkMode ? 'border-[#3A3A4E]' : 'border-[#A9C4DD]',
    };

    // --- EFFECTS ---
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
            viewport.addEventListener('wheel', handleWheelCanvas, {passive: false});
            return () => viewport.removeEventListener('wheel', handleWheelCanvas);
        }
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'r') {
                if (selectedDevice) {
                    setPreviewTransform(p => ({...p, rotation: (p.rotation + 90) % 360}));
                } else if (draggingItem?.type === 'icon') {
                    setPlacedIcons(prev => prev.map(i => i.id === draggingItem.id ? {
                        ...i,
                        rotation: ((i.rotation || 0) + 90) % 360
                    } : i));
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
                    setPreviewTransform(p => ({...p, scale: Math.max(0.5, p.scale + zoomDelta)}));
                } else if (draggingItem?.type === 'icon') {
                    setPlacedIcons(prev => prev.map(i => i.id === draggingItem.id ? {
                        ...i,
                        scale: Math.max(0.5, (i.scale || 1) + zoomDelta)
                    } : i));
                }
            }
        };
        window.addEventListener('wheel', handleWheel, {passive: false});
        return () => window.removeEventListener('wheel', handleWheel);
    }, [selectedDevice, draggingItem]);

    useEffect(() => {
        const handleScroll = () => {
            const menu = document.getElementById('floating-menu');
            const footer = document.querySelector('footer');
            if (!menu || !footer) return;
            const footerRect = footer.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            if (footerRect.top < windowHeight - 40) {
                menu.style.bottom = `${windowHeight - footerRect.top + 60}px`;
            } else {
                menu.style.bottom = '40px';
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // --- LOGIC ---
    const saveHistory = () => {
        setUndoStack(prev => [{
            lines: [...lines],
            icons: [...placedIcons],
            furniture: [...placedFurniture]
        }, ...prev].slice(0, 30));
        setRedoStack([]);
    };

    const handleUndo = () => {
        if (undoStack.length === 0) return;
        const prevState = undoStack[0];
        setRedoStack(prev => [{lines: [...lines], icons: [...placedIcons], furniture: [...placedFurniture]}, ...prev]);
        setLines([...prevState.lines]);
        setPlacedIcons([...prevState.icons]);
        setPlacedFurniture([...prevState.furniture]);
        setUndoStack(undoStack.slice(1));
    };

    const handleRedo = () => {
        if (redoStack.length === 0) return;
        const nextState = redoStack[0];
        setUndoStack(prev => [{lines: [...lines], icons: [...placedIcons], furniture: [...placedFurniture]}, ...prev]);
        setLines([...nextState.lines]);
        setPlacedIcons([...nextState.icons]);
        setPlacedFurniture([...nextState.furniture]);
        setRedoStack(redoStack.slice(1));
    };

    const checkUniversalCollision = (col: number, row: number, ignoreId?: string) => {
        if (placedIcons.some(i => i.id !== ignoreId && i.col === col && i.row === row)) return true;
        if (placedFurniture.some(f => f.id !== ignoreId && col >= f.centerCol - f.widthCols / 2 && col <= f.centerCol + f.widthCols / 2 && row >= f.centerRow - f.heightCols / 2 && row <= f.centerRow + f.heightCols / 2)) return true;
        return lines.some(line => {
            if (line.id === ignoreId) return false;
            const isVert = line.start.col === line.end.col;
            const isHoriz = line.start.row === line.end.row;
            if (isVert && col === line.start.col) return row >= Math.min(line.start.row, line.end.row) && row <= Math.max(line.start.row, line.end.row);
            if (isHoriz && row === line.start.row) return col >= Math.min(line.start.col, line.end.col) && col <= Math.max(line.start.col, line.end.col);
            return false;
        });
    };

    const handleCanvasClick = (col: number, row: number) => {
        if (!selectedDevice || activeTool) return;
        if (!checkUniversalCollision(col, row)) {
            saveHistory();
            setPlacedIcons([...placedIcons, {
                col,
                row,
                id: Date.now().toString(),
                type: selectedDevice.type,
                name: selectedDevice.name,
                brand: selectedDevice.brand,
                status: selectedDevice.status,
                priceEUR: parseInt(selectedDevice.price.replace('€', '')),
                scale: previewTransform.scale,
                rotation: previewTransform.rotation
            }]);
            setPreviewTransform({scale: 1, rotation: 0});
        }
    };

    const handleLineComplete = (type: string, start: { col: number, row: number }, end: {
        col: number,
        row: number
    }) => {
        setLines(prev => [...prev, {id: Date.now().toString(), type, start, end}]);
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
        if (activeTool === tool) setActiveTool(null);
        else {
            setActiveTool(tool);
            setSelectedDevice(null);
            setShowFurnitureMenu(false);
        }
    };

    // --- EXPORT LOGIC ---
    useEffect(() => {
        const scale = layout.dotSpacing || 1;
        const walls = lines.filter(l => l.type === 'wall').map(l => ({
            x1: Math.trunc(l.start.col * scale),
            y1: Math.trunc(l.start.row * scale),
            x2: Math.trunc(l.end.col * scale),
            y2: Math.trunc(l.end.row * scale)
        }));
        const windows = lines.filter(l => l.type === 'window').map(l => ({
            x: Math.trunc(Math.min(l.start.col, l.end.col) * scale),
            y: Math.trunc(Math.min(l.start.row, l.end.row) * scale),
            width: Math.trunc(Math.abs(l.end.col - l.start.col) * scale) || Math.trunc(scale),
            height: Math.trunc(Math.abs(l.end.row - l.start.row) * scale) || Math.trunc(scale),
            distanceFromFloor: 0
        }));
        const doors = lines.filter(l => l.type === 'door').map(l => ({
            x: Math.trunc(Math.min(l.start.col, l.end.col) * scale),
            y: Math.trunc(Math.min(l.start.row, l.end.row) * scale)
        }));
        const plugs = placedIcons.filter(i => i.type === 'priza').map(i => ({
            x: Math.trunc(i.col * scale),
            y: Math.trunc(i.row * scale)
        }));

        const roomSquareMeters = (() => {
            if (!walls.length) return 10;
            const xs = walls.flatMap(w => [w.x1, w.x2]);
            const ys = walls.flatMap(w => [w.y1, w.y2]);
            return Math.max(1, Math.trunc(((Math.max(...xs) - Math.min(...xs)) / 100) * ((Math.max(...ys) - Math.min(...ys)) / 100)));
        })();

        const rooms = [{
            id: 'room-001',
            squareMeters: roomSquareMeters,
            wallType: 'concrete',
            walls,
            doors,
            windows,
            plugs
        }];
        const devices = placedIcons.filter(i => i.type !== 'priza').map(i => ({
            coordinates: {x: Math.trunc(i.col * scale), y: Math.trunc(i.row * scale)},
            rotationAngle: 0,
            device: {
                id: i.id,
                name: i.name,
                price: i.priceEUR,
                ecosystem: 'Apple HomeKit',
                protocol: i.type === 'router' ? 'WiFi' : 'Zigbee',
                lumens: i.type === 'bec' ? 800 : 0,
                requiresPlug: i.type !== 'bec',
                rangeRadius: i.type === 'senzor' ? 10 : 0,
                deviceType: i.type,
                mountType: i.type === 'tv' ? 'wall' : 'table',
                fieldOfView: i.type === 'interfon' ? 120 : 0,
                powerConsumption: i.type === 'bec' ? 10 : 5,
                communicationFrequency: i.type === 'router' ? '2.4GHz' : '868MHz',
                width: 10
            }
        }));
        setExportData({devices, rooms});
    }, [placedIcons, lines, layout.dotSpacing]);

    useEffect(() => {
        if (!placedIcons.length && !lines.length) return;
        if (backendSyncTimerRef.current) clearTimeout(backendSyncTimerRef.current);
        backendSyncTimerRef.current = setTimeout(() => {
            backendSyncTimerRef.current = null;
            fetch(`${API_BASE}/api/team2/layouts/save`, {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    id: layoutId,
                    scale: 'cm',
                    maxBudget: 15000,
                    targetEcosystem: 'Apple HomeKit',
                    rooms: exportData.rooms,
                    devices: exportData.devices
                }),
            }).catch(() => {
            });
        }, 450);
        return () => {
            if (backendSyncTimerRef.current) clearTimeout(backendSyncTimerRef.current);
        };
    }, [exportData, layoutId]);

    const exportToJSON = () => {
        const dataStr = JSON.stringify({
            house: {
                id: layoutId,
                name: "Smart House Setup",
                scale: "cm",
                maxBudget: 15000,
                targetEcosystem: "Apple HomeKit",
                rooms: exportData.rooms,
                devices: exportData.devices
            }
        }, null, 2);
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr));
        linkElement.setAttribute('download', `smart-house-setup-${new Date().toISOString().split('T')[0]}.json`);
        linkElement.click();
    };

    return (
        <main className="flex-1 flex flex-col px-8 py-4 max-w-[1700px] mx-auto w-full gap-6 pb-40">

            {/* Header Tools */}
            <div className="flex flex-col xl:flex-row justify-between items-center gap-6">
                <button onClick={onBack}
                        className={`px-10 py-3 rounded-full font-semibold text-sm shadow-sm transition-colors ${theme.btnSecondary} ${theme.textMain}`}>
                    &larr; Back to Wizard
                </button>

                <div
                    className={`grid grid-cols-3 items-center px-6 py-4 rounded-3xl shadow-sm transition-colors duration-300 w-full max-w-2xl ${theme.panel}`}>
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
                    <button onClick={exportToJSON}
                            className={`flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-sm shadow-sm transition-colors ${theme.btnSecondary} ${theme.textMain}`}>
                        <span className="opacity-60">💾</span> Save
                    </button>
                    <button
                        className={`flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-sm shadow-sm transition-colors ${theme.btnSecondary} ${theme.textMain}`}>
                        <span className="opacity-60">🚀</span> Post
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-6 mt-2 mb-10">
                <div className="w-full lg:w-[280px] flex-shrink-0"><WizardSidebar/></div>

                <div className={`flex-1 relative min-h-[600px] rounded-3xl ${theme.canvasBorder}`}>
                    <div
                        className="absolute inset-0 rounded-3xl overflow-hidden shadow-inner border border-transparent">

                        {/* Zoom Controls */}
                        <div
                            className={`absolute top-4 right-8 z-40 flex items-center gap-3 px-4 py-2 rounded-2xl shadow-xl border transition-colors duration-300 ${isDarkMode ? 'bg-[#2F2F41]/95 border-[#3A3A4E]' : 'bg-white/95 border-[#C2C9CC]'}`}>
                            <span className={`text-[9px] font-bold tracking-wider ${theme.textMuted}`}>ZOOM</span>
                            <button onClick={() => setCanvasZoom(z => Math.max(0.4, z - 0.1))}
                                    className={`font-bold text-lg leading-none transition-colors ${theme.textMain} hover:text-[#00B4D8]`}>-
                            </button>
                            <input type="range" min="0.4" max="4" step="0.05" value={canvasZoom}
                                   onChange={(e) => setCanvasZoom(Number(e.target.value))}
                                   className="w-24 accent-[#00B4D8] cursor-pointer"/>
                            <button onClick={() => setCanvasZoom(z => Math.min(4, z + 0.1))}
                                    className={`font-bold text-lg leading-none transition-colors ${theme.textMain} hover:text-[#00B4D8]`}>+
                            </button>
                            <span
                                className={`text-[10px] font-bold w-9 text-right ${theme.textMain}`}>{Math.round(canvasZoom * 100)}%</span>
                        </div>

                        {/* Viewport */}
                        <div id="canvas-viewport"
                             className={`absolute inset-0 rounded-3xl overflow-auto custom-scrollbar flex transition-colors duration-300 ${isDarkMode ? 'bg-[#5293DE]' : 'bg-[#C2C9CC]'}`}>
                            <div style={{
                                width: `${canvasZoom * 100}%`,
                                height: `${canvasZoom * 100}%`,
                                minWidth: '100%',
                                minHeight: '100%',
                                margin: 'auto',
                                position: 'relative',
                                flexShrink: 0
                            }}>
                                <GridCanvas
                                    isDarkMode={isDarkMode} placedIcons={placedIcons} placedFurniture={placedFurniture}
                                    setPlacedFurniture={setPlacedFurniture}
                                    lines={lines} setLines={setLines} activeTool={activeTool}
                                    onCanvasClick={handleCanvasClick} onLineComplete={handleLineComplete}
                                    onUpdate={setLayout} onRedo={handleRedo} draggingItem={draggingItem}
                                    setDraggingItem={setDraggingItem}
                                    onMouseMove={(col, row) => setMouseGridPos({col, row})}
                                    onMouseLeave={() => setMouseGridPos(null)} layout={layout}
                                    setPlacedIcons={setPlacedIcons} checkCollision={checkUniversalCollision}
                                    saveHistory={saveHistory} undo={handleUndo}
                                    redo={handleRedo} canUndo={undoStack.length > 0} canRedo={redoStack.length > 0}
                                />

                                {layout.dotSpacing > 0 && placedIcons.map((icon, index) => {
                                    const IconComponent = ICON_MAP[icon.type] || ControllerIcon;
                                    const isDraggingThis = draggingItem?.type === 'icon' && draggingItem.id === icon.id;
                                    const isHovered = hoveredIconIndex === index;

                                    return (
                                        <div
                                            key={icon.id} onMouseEnter={() => setHoveredIconIndex(index)}
                                            onMouseLeave={() => setHoveredIconIndex(null)}
                                            onMouseDown={(e) => {
                                                if ((e.target as HTMLElement).closest('button') || activeTool) return;
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setDraggingItem({type: 'icon', id: icon.id});
                                            }}
                                            style={{
                                                position: 'absolute',
                                                left: layout.offsetX + icon.col * layout.dotSpacing,
                                                top: layout.offsetY + icon.row * layout.dotSpacing,
                                                width: layout.dotSpacing * (icon.scale || 1),
                                                height: layout.dotSpacing * (icon.scale || 1),
                                                transform: `translate(-50%, -50%) rotate(${icon.rotation || 0}deg)`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                zIndex: isDraggingThis ? 100 : 30,
                                                cursor: isDraggingThis ? 'grabbing' : 'grab',
                                                opacity: isDraggingThis ? 0.6 : 1,
                                                pointerEvents: activeTool ? 'none' : 'auto',
                                                userSelect: 'none'
                                            }}
                                        >
                                            <div
                                                className="relative group flex items-center justify-center w-full h-full">
                                                <IconComponent color={isDarkMode ? "white" : "#2C3E50"}/>
                                                {isDraggingThis && (<div
                                                    className={`absolute top-full mt-2 text-[9px] font-bold text-center whitespace-nowrap drop-shadow-md ${isDarkMode ? 'text-white' : 'text-[#2C3E50]'}`}>PRESS
                                                    'R' TO ROTATE<br/>SCROLL TO SCALE</div>)}
                                                {isHovered && !isDraggingThis && !activeTool && (
                                                    <button onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        saveHistory();
                                                        setPlacedIcons(placedIcons.filter((_, i) => i !== index));
                                                        setHoveredIconIndex(null);
                                                    }}
                                                            className={`absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center rounded-full shadow-md z-[60] text-[10px] font-bold transition-all duration-200 border cursor-pointer ${isDarkMode ? 'bg-[#1A1A1E] text-red-500 border-red-500/30 hover:bg-red-500 hover:text-white' : 'bg-white text-red-600 border-red-200 hover:bg-red-600 hover:text-white'}`}>✕</button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {selectedDevice && mouseGridPos && !activeTool && (
                                    <div style={{
                                        position: 'absolute',
                                        left: layout.offsetX + mouseGridPos.col * layout.dotSpacing,
                                        top: layout.offsetY + mouseGridPos.row * layout.dotSpacing,
                                        width: layout.dotSpacing * previewTransform.scale,
                                        height: layout.dotSpacing * previewTransform.scale,
                                        transform: `translate(-50%, -50%) rotate(${previewTransform.rotation}deg)`,
                                        pointerEvents: 'none',
                                        zIndex: 100,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'left 0.1s ease-out, top 0.1s ease-out'
                                    }}>
                                        <div
                                            className={`relative p-2 rounded-lg transition-colors duration-200 ${checkUniversalCollision(mouseGridPos.col, mouseGridPos.row) ? 'bg-red-500/40 ring-2 ring-red-600' : 'bg-green-500/40 ring-2 ring-green-600'}`}>
                                            {React.createElement(ICON_MAP[selectedDevice.type] || ControllerIcon, {color: 'white'})}
                                        </div>
                                        <div
                                            className={`mt-2 text-[9px] font-bold text-center whitespace-nowrap drop-shadow-md ${isDarkMode ? 'text-white' : 'text-[#2C3E50]'}`}>PRESS
                                            'R' TO ROTATE<br/>SCROLL TO SCALE
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Floating Menu */}
                        <div id="floating-menu"
                             className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex gap-8 px-10 py-4 rounded-full shadow-2xl border transition-all duration-300 ${isDarkMode ? 'bg-[#2F2F41]/90 backdrop-blur-md border-[#3A3A4E]' : 'bg-white/90 backdrop-blur-md border-[#C2C9CC]'}`}>
                            {['Wall', 'Window', 'Door', 'Line', 'Furniture'].map((tool) => {
                                const isFurniture = tool === 'Furniture';
                                const isSelected = isFurniture ? activeTool?.startsWith('furniture_') : activeTool === tool.toLowerCase();
                                const ToolIcon = TOOL_ICON_MAP[tool.toLowerCase()];
                                return (
                                    <div key={tool} className="relative group">
                                        <button onClick={() => toggleTool(tool)}
                                                className={`flex flex-col items-center gap-1 transition-all ${isSelected ? 'scale-110' : 'hover:scale-105'}`}>
                                            <div className="w-10 h-8 flex items-center justify-center"><ToolIcon
                                                color={isSelected ? '#00B4D8' : (isDarkMode ? 'white' : '#2C3E50')}/>
                                            </div>
                                            <span
                                                className={`text-[9px] uppercase font-bold tracking-wider ${isSelected ? 'text-[#00B4D8]' : (isDarkMode ? 'text-white' : 'text-[#2C3E50]')}`}>{tool}</span>
                                        </button>
                                        {isFurniture && showFurnitureMenu && (
                                            <div
                                                className={`absolute bottom-full mb-4 left-1/2 -translate-x-1/2 flex gap-4 p-3 rounded-2xl border shadow-2xl animate-in fade-in slide-in-from-bottom-2 ${isDarkMode ? 'bg-[#3A3A4E] border-[#4A4A60]' : 'bg-white border-[#C2C9CC]'}`}>
                                                {['Bed', 'Couch', 'Table'].map((item) => (
                                                    <button key={item} onClick={() => {
                                                        setActiveTool(`furniture_${item.toLowerCase()}`);
                                                        setShowFurnitureMenu(false);
                                                    }}
                                                            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-colors ${activeTool === `furniture_${item.toLowerCase()}` ? 'bg-[#00B4D8] text-white' : (isDarkMode ? 'hover:bg-[#4A4A60] text-white' : 'hover:bg-gray-100 text-[#2C3E50]')}`}>{item}</button>
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
                    <div
                        className={`rounded-3xl p-6 shadow-sm flex flex-col transition-colors duration-300 ${theme.panel}`}>
                        <h3 className="font-bold text-[13px] mb-4">Device Catalog</h3>
                        <div className="relative mb-4">
                            <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
                            <input type="text" placeholder="Search devices..."
                                   className={`w-full py-2.5 pl-8 pr-4 rounded-xl text-xs font-medium outline-none shadow-sm focus:border-[#00B4D8] border border-transparent transition-colors ${isDarkMode ? 'bg-[#3A3A4E] text-white placeholder-gray-400' : 'bg-white text-[#2C3E50]'}`}/>
                        </div>
                        <div className="flex flex-col gap-3 max-h-[230px] overflow-y-auto no-scrollbar px-1 py-1">
                            {catalogDevices.map((d) => {
                                const IconComponent = ICON_MAP[d.type] || ControllerIcon;
                                return (
                                    <div key={d.id} onClick={() => {
                                        setActiveTool(null);
                                        setSelectedDevice(selectedDevice?.id === d.id ? null : d);
                                    }}
                                         className={`flex items-center justify-between p-3 rounded-2xl shadow-sm cursor-pointer border-2 transition-all ${selectedDevice?.id === d.id ? `scale-[1.02] z-10 ${isDarkMode ? 'border-[#00B4D8]' : 'border-[#2C3E50]'}` : `border-transparent ${theme.card}`}`}>
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-full flex items-center justify-center text-sm">
                                                <IconComponent color={isDarkMode ? "white" : "#000000"}/></div>
                                            <div>
                                                <div
                                                    className={`text-[11px] font-bold ${theme.textMain}`}>{d.name}</div>
                                                <div
                                                    className={`text-[9px] font-medium mt-0.5 ${theme.textMuted}`}>{d.price} · {d.brand}</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div
                        className={`rounded-3xl p-6 shadow-sm flex flex-col transition-all duration-300 ${theme.panel} h-[280px]`}>
                        <h3 className={`font-bold text-[13px] mb-4 ${theme.textMain}`}>Installed Devices</h3>
                        <div className="flex flex-col gap-3 overflow-y-auto no-scrollbar flex-1">
                            {placedIcons.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full opacity-50">
                                    <div className="text-[20px] mb-2">🏠</div>
                                    <div className={`text-[10px] font-medium ${theme.textMuted}`}>No devices active
                                    </div>
                                </div>
                            ) : (
                                placedIcons.map((device, index) => {
                                    const IconComponent = ICON_MAP[device.type] || ControllerIcon;
                                    return (
                                        <div key={device.id || index}
                                             className={`flex items-center justify-between p-3 rounded-2xl shadow-sm transition-all border border-transparent ${isDarkMode ? 'bg-[#3A3A4E]' : 'bg-white'} min-h-[70px]`}>
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-[#3A3A4E]' : 'bg-[#F8FAFC]'}`}>
                                                    <IconComponent color={isDarkMode ? "white" : "#2C3E50"}/></div>
                                                <div>
                                                    <div
                                                        className={`text-[11px] font-bold ${theme.textMain} truncate w-[100px]`}>{device.name}</div>
                                                    <div
                                                        className={`text-[9px] font-medium mt-0.5 ${theme.textMuted}`}>{device.brand}</div>
                                                </div>
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
    );
};

export default LayoutCanvas;