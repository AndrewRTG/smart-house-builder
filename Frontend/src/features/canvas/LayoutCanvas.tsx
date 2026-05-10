import React, {useState, useEffect, useRef} from 'react';
import GridCanvas from './GridCanvas';
import {
    WallIcon, DoorIcon, LineIcon, WindowIcon, FurnitureIcon,
    ControllerIcon, SenzorIcon, LockIcon, RouterIcon, TvIcon,
    InterfonIcon, PrelungitorIcon, SoundSystemIcon, BecIcon,
    PrizaIcon, AspiratorIcon, HubIcon
} from './Icons';
import WizardSidebar from '../wizard/components/WizardSidebar';
import useFilterStore from '../../store/useFilterStore';
// --- INTERFACES ---
interface Wall { x1: number; y1: number; x2: number; y2: number; }
interface Window { x: number; y: number; width: number; height: number; distanceFromFloor: number; }
interface Door { x: number; y: number; }
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
interface Plug { x: number; y: number; }
interface Room {
    id: string; squareMeters: number; wallType: string;
    walls: Wall[]; doors: Door[]; windows: Window[]; plugs: Plug[];
}
interface HistorySnapshot { lines: any[]; icons: any[]; furniture: any[]; }

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



interface LayoutCanvasProps { isDarkMode: boolean; onBack: () => void; }

const LayoutCanvas: React.FC<LayoutCanvasProps> = ({isDarkMode, onBack}) => {
    const generateLayoutId = () => {
        const r = () => Math.floor(1000 + Math.random() * 9000).toString();
        return `layout-uuid-${r()}-${r()}`;
    };

    const [layoutId] = useState(generateLayoutId);
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

    // --- THEME (inline styles only, no Tailwind) ---
    const colors = {
        panel:        isDarkMode ? '#2F2F41' : '#BDD3E7',
        card:         isDarkMode ? '#3A3A4E' : '#ffffff',
        cardHover:    isDarkMode ? '#4A4A60' : '#f0f4f8',
        textMain:     isDarkMode ? '#ffffff' : '#2C3E50',
        textMuted:    isDarkMode ? '#9AA0BE' : '#5A6080',
        btnSecondary: isDarkMode ? '#3A3A4E' : '#A9C4DD',
        btnSecHover:  isDarkMode ? '#4A4A60' : '#9AB5CE',
        canvasBg:     isDarkMode ? '#5293DE' : '#C2C9CC',
        border:       isDarkMode ? '#3A3A4E' : '#C2C9CC',
        zoomBg:       isDarkMode ? 'rgba(47,47,65,0.95)' : 'rgba(255,255,255,0.95)',
        floatingBg:   isDarkMode ? 'rgba(47,47,65,0.92)' : 'rgba(255,255,255,0.92)',
        furnitureMenuBg: isDarkMode ? '#3A3A4E' : '#ffffff',
    };

    const [fetchedDevices, setFetchedDevices] = useState<any[]>([]);
    const [isCatalogLoading, setIsCatalogLoading] = useState(true);

    const { priceRange, categories, protocols, brands, ecosystem } = useFilterStore();

    const getIconTypeForCategory = (categoryId: number) => {
        const iconMapping: Record<number, string> = {
            1: 'interfon',
            2: 'prelungitor',
            3: 'controller',
            4: 'hub',
            5: 'hub',
            6: 'tv',
            7: 'priza',
            8: 'senzor',
            9: 'soundsystem',
            10: 'tv',
            11: 'aspirator',
            12: 'router'
        };
        return iconMapping[categoryId] || 'bec';
    };

    const getCategoryIdByName = (name: string) => {
        const mapping: Record<string, number> = {
            "Smart Cameras": 1,
            "Smart Power Strips": 2,
            "Gaming Consoles": 3,
            "Smart Appliances": 4,
            "Smart Hubs": 5,
            "Smart Monitors": 6,
            "Smart Outlets": 7,
            "Smart Sensors": 8,
            "Smart Audio": 9,
            "Smart TVs": 10,
            "Robot Vacuums": 11,
            "Smart Routers": 12
        };
        return mapping[name];
    };

    useEffect(() => {
        const fetchCatalog = async () => {
            setIsCatalogLoading(true);
            try {
                let url = new URL(`${API_BASE}/api/devices`);
                url.searchParams.append('minPrice', priceRange[0].toString());
                url.searchParams.append('maxPrice', priceRange[1].toString());

                if (categories.length > 0) {
                    categories.forEach((catName: string) => {
                        const id = getCategoryIdByName(catName);
                        if (id) url.searchParams.append('categoryIds', id.toString());
                    });
                }

                if (brands.length > 0) {
                    brands.forEach((brandName: string) => url.searchParams.append('brand', brandName));
                }

                if (protocols.length > 0) {
                    protocols.forEach((protName: string) => {
                        url.searchParams.append('protocols', protName);
                    });
                }

                // Ecosistem
                if (ecosystem) {
                    url.searchParams.append('ecosystem', ecosystem);
                }

                const response = await fetch(url.toString());
                if (response.ok) {
                    const data = await response.json();

                    const mapped = data.map((d: any) => ({
                        id: d.id.toString(),
                        name: d.name,
                        brand: d.brand,
                        price: `€${d.bestPrice || 0}`,
                        priceEUR: d.bestPrice || 0,
                        type: getIconTypeForCategory(d.categoryId), // Aici folosim funcția ta!
                        status: 'online'
                    }));
                    setFetchedDevices(mapped);
                }
            } catch (error) {
                console.error("Eroare la aducerea produselor:", error);
            } finally {
                setIsCatalogLoading(false);
            }
        };

        fetchCatalog();
    }, [priceRange, categories, brands, protocols, ecosystem]);

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
                    setPlacedIcons(prev => prev.map(i => i.id === draggingItem.id
                        ? {...i, rotation: ((i.rotation || 0) + 90) % 360} : i));
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
                    setPlacedIcons(prev => prev.map(i => i.id === draggingItem.id
                        ? {...i, scale: Math.max(0.5, (i.scale || 1) + zoomDelta)} : i));
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
            menu.style.bottom = footerRect.top < windowHeight - 40
                ? `${windowHeight - footerRect.top + 60}px` : '40px';
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // --- LOGIC ---
    const saveHistory = () => {
        setUndoStack(prev => [{
            lines: [...lines], icons: [...placedIcons], furniture: [...placedFurniture]
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
        if (placedFurniture.some(f => f.id !== ignoreId
            && col >= f.centerCol - f.widthCols / 2 && col <= f.centerCol + f.widthCols / 2
            && row >= f.centerRow - f.heightCols / 2 && row <= f.centerRow + f.heightCols / 2)) return true;
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
                col, row, id: Date.now().toString(),
                type: selectedDevice.type, name: selectedDevice.name,
                brand: selectedDevice.brand, status: selectedDevice.status,
                priceEUR: parseInt(selectedDevice.price.replace('€', '')),
                scale: previewTransform.scale, rotation: previewTransform.rotation
            }]);
            setPreviewTransform({scale: 1, rotation: 0});
        }
    };

    const handleLineComplete = (type: string, start: { col: number, row: number }, end: { col: number, row: number }) => {
        setLines(prev => [...prev, {id: Date.now().toString(), type, start, end}]);
    };

    const toggleTool = (toolName: string) => {
        const tool = toolName.toLowerCase();
        if (tool === 'furniture') {
            if (activeTool?.startsWith('furniture_') || showFurnitureMenu) {
                setActiveTool(null); setShowFurnitureMenu(false);
            } else {
                setShowFurnitureMenu(true); setSelectedDevice(null);
            }
            return;
        }
        if (activeTool === tool) setActiveTool(null);
        else { setActiveTool(tool); setSelectedDevice(null); setShowFurnitureMenu(false); }
    };

    // --- EXPORT LOGIC ---
    useEffect(() => {
        const scale = layout.dotSpacing || 1;
        const walls = lines.filter(l => l.type === 'wall').map(l => ({
            x1: Math.trunc(l.start.col * scale), y1: Math.trunc(l.start.row * scale),
            x2: Math.trunc(l.end.col * scale), y2: Math.trunc(l.end.row * scale)
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
            x: Math.trunc(i.col * scale), y: Math.trunc(i.row * scale)
        }));
        const roomSquareMeters = (() => {
            if (!walls.length) return 10;
            const xs = walls.flatMap(w => [w.x1, w.x2]);
            const ys = walls.flatMap(w => [w.y1, w.y2]);
            return Math.max(1, Math.trunc(((Math.max(...xs) - Math.min(...xs)) / 100) * ((Math.max(...ys) - Math.min(...ys)) / 100)));
        })();
        const rooms = [{id: 'room-001', squareMeters: roomSquareMeters, wallType: 'concrete', walls, doors, windows, plugs}];
        const devices = placedIcons.filter(i => i.type !== 'priza').map(i => ({
            coordinates: {x: Math.trunc(i.col * scale), y: Math.trunc(i.row * scale)},
            rotationAngle: 0,
            device: {
                id: i.id, name: i.name, price: i.priceEUR, ecosystem: 'Apple HomeKit',
                protocol: i.type === 'router' ? 'WiFi' : 'Zigbee',
                lumens: i.type === 'bec' ? 800 : 0, requiresPlug: i.type !== 'bec',
                rangeRadius: i.type === 'senzor' ? 10 : 0, deviceType: i.type,
                mountType: i.type === 'tv' ? 'wall' : 'table',
                fieldOfView: i.type === 'interfon' ? 120 : 0,
                powerConsumption: i.type === 'bec' ? 10 : 5,
                communicationFrequency: i.type === 'router' ? '2.4GHz' : '868MHz', width: 10
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
                    id: layoutId, scale: 'cm', maxBudget: 15000,
                    targetEcosystem: 'Apple HomeKit',
                    rooms: exportData.rooms, devices: exportData.devices
                }),
            }).catch(() => {});
        }, 450);
        return () => { if (backendSyncTimerRef.current) clearTimeout(backendSyncTimerRef.current); };
    }, [exportData, layoutId]);

    const exportToJSON = () => {
        const dataStr = JSON.stringify({
            house: {
                id: layoutId, name: "Smart House Setup", scale: "cm", maxBudget: 15000,
                targetEcosystem: "Apple HomeKit", rooms: exportData.rooms, devices: exportData.devices
            }
        }, null, 2);
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr));
        linkElement.setAttribute('download', `smart-house-setup-${new Date().toISOString().split('T')[0]}.json`);
        linkElement.click();
    };

    // ─── RENDER ────────────────────────────────────────────────────────────────
    return (
        <main style={{
            display: 'flex', flexDirection: 'column', flex: 1,
            padding: '16px 32px', maxWidth: '1700px', margin: '0 auto',
            width: '100%', gap: '24px', paddingBottom: '160px',
            boxSizing: 'border-box'
        }}>

            {/* ── Header row ── */}
            <div style={{
                display: 'flex', flexWrap: 'wrap', alignItems: 'center',
                justifyContent: 'space-between', gap: '16px'
            }}>
                {/* Back button */}
                <button
                    onClick={onBack}
                    style={{
                        padding: '10px 32px', borderRadius: '999px', border: 'none',
                        background: colors.btnSecondary, color: colors.textMain,
                        fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.1)', whiteSpace: 'nowrap',
                        fontFamily: 'inherit', transition: 'background 0.2s'
                    }}
                >
                    ← Back to Wizard
                </button>

                {/* Stats panel */}
                <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                    alignItems: 'center', padding: '16px 24px',
                    borderRadius: '24px', background: colors.panel,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    flex: '1 1 300px', maxWidth: '640px', gap: 0
                }}>
                    <div style={{textAlign: 'center'}}>
                        <div style={{fontSize: '11px', fontWeight: 700, color: colors.textMuted, marginBottom: '4px', letterSpacing: '0.05em'}}>DEVICES</div>
                        <div style={{fontWeight: 700, fontSize: '24px', color: colors.textMain}}>{placedIcons.length}</div>
                    </div>
                    <div style={{
                        textAlign: 'center', borderLeft: `1px solid ${colors.border}`,
                        borderRight: `1px solid ${colors.border}`, padding: '0 16px'
                    }}>
                        <div style={{fontSize: '11px', fontWeight: 700, color: colors.textMuted, marginBottom: '4px', letterSpacing: '0.05em'}}>ESTIMATED COST</div>
                        <div style={{fontWeight: 700, fontSize: '24px', color: colors.textMain}}>0 EUR</div>
                    </div>
                    <div style={{textAlign: 'center'}}>
                        <div style={{fontSize: '11px', fontWeight: 700, color: colors.textMuted, marginBottom: '4px', letterSpacing: '0.05em'}}>PROTOCOLS</div>
                        <div style={{fontWeight: 700, fontSize: '18px', color: colors.textMain}}>-</div>
                    </div>
                </div>

                {/* Save / Post buttons */}
                <div style={{display: 'flex', gap: '12px'}}>
                    <button
                        onClick={exportToJSON}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 28px', borderRadius: '999px', border: 'none',
                            background: colors.btnSecondary, color: colors.textMain,
                            fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.1)', whiteSpace: 'nowrap',
                            fontFamily: 'inherit'
                        }}
                    >
                        <span style={{opacity: 0.7}}>💾</span> Save
                    </button>
                    <button
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 28px', borderRadius: '999px', border: 'none',
                            background: colors.btnSecondary, color: colors.textMain,
                            fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.1)', whiteSpace: 'nowrap',
                            fontFamily: 'inherit'
                        }}
                    >
                        <span style={{opacity: 0.7}}>🚀</span> Post
                    </button>
                </div>
            </div>

            {/* ── Main content row ── */}
            <div style={{display: 'flex', flex: 1, gap: '24px', flexWrap: 'wrap', marginBottom: '40px'}}>

                {/* Left sidebar – WizardSidebar */}
                <div style={{width: '280px', flexShrink: 0}}>
                    <WizardSidebar/>
                </div>

                {/* Canvas area */}
                <div style={{
                    flex: 1, position: 'relative', minHeight: '600px',
                    borderRadius: '24px', minWidth: '300px'
                }}>
                    <div style={{
                        position: 'absolute', inset: 0, borderRadius: '24px',
                        overflow: 'hidden', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                        {/* Zoom Controls */}
                        <div style={{
                            position: 'absolute', top: '16px', right: '32px', zIndex: 40,
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '8px 16px', borderRadius: '16px',
                            background: colors.zoomBg, border: `1px solid ${colors.border}`,
                            boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
                        }}>
                            <span style={{fontSize: '9px', fontWeight: 700, color: colors.textMuted, letterSpacing: '0.1em'}}>ZOOM</span>
                            <button
                                onClick={() => setCanvasZoom(z => Math.max(0.4, z - 0.1))}
                                style={{background: 'none', border: 'none', fontWeight: 700, fontSize: '18px', color: colors.textMain, cursor: 'pointer', padding: '0 4px', lineHeight: 1}}
                            >-</button>
                            <input type="range" min="0.4" max="4" step="0.05" value={canvasZoom}
                                onChange={(e) => setCanvasZoom(Number(e.target.value))}
                                style={{width: '96px', cursor: 'pointer', accentColor: '#00B4D8'}}
                            />
                            <button
                                onClick={() => setCanvasZoom(z => Math.min(4, z + 0.1))}
                                style={{background: 'none', border: 'none', fontWeight: 700, fontSize: '18px', color: colors.textMain, cursor: 'pointer', padding: '0 4px', lineHeight: 1}}
                            >+</button>
                            <span style={{fontSize: '10px', fontWeight: 700, color: colors.textMain, minWidth: '36px', textAlign: 'right'}}>{Math.round(canvasZoom * 100)}%</span>
                        </div>

                        {/* Viewport */}
                        <div
                            id="canvas-viewport"
                            style={{
                                position: 'absolute', inset: 0, borderRadius: '24px',
                                overflow: 'auto', display: 'flex',
                                background: colors.canvasBg, transition: 'background 0.3s'
                            }}
                        >
                            <div style={{
                                width: `${canvasZoom * 100}%`, height: `${canvasZoom * 100}%`,
                                minWidth: '100%', minHeight: '100%',
                                margin: 'auto', position: 'relative', flexShrink: 0
                            }}>
                                <GridCanvas
                                    isDarkMode={isDarkMode} placedIcons={placedIcons}
                                    placedFurniture={placedFurniture} setPlacedFurniture={setPlacedFurniture}
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

                                {/* Placed icons */}
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
                                                if ((e.target as HTMLElement).closest('button') || activeTool) return;
                                                e.preventDefault(); e.stopPropagation();
                                                setDraggingItem({type: 'icon', id: icon.id});
                                            }}
                                            style={{
                                                position: 'absolute',
                                                left: layout.offsetX + icon.col * layout.dotSpacing,
                                                top: layout.offsetY + icon.row * layout.dotSpacing,
                                                width: layout.dotSpacing * (icon.scale || 1),
                                                height: layout.dotSpacing * (icon.scale || 1),
                                                transform: `translate(-50%, -50%) rotate(${icon.rotation || 0}deg)`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                zIndex: isDraggingThis ? 100 : 30,
                                                cursor: isDraggingThis ? 'grabbing' : 'grab',
                                                opacity: isDraggingThis ? 0.6 : 1,
                                                pointerEvents: activeTool ? 'none' : 'auto',
                                                userSelect: 'none'
                                            }}
                                        >
                                            <div style={{position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%'}}>
                                                <IconComponent color={isDarkMode ? "white" : "#2C3E50"}/>
                                                {isDraggingThis && (
                                                    <div style={{position: 'absolute', top: '100%', marginTop: '8px', fontSize: '9px', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap', color: isDarkMode ? 'white' : '#2C3E50'}}>
                                                        PRESS 'R' TO ROTATE<br/>SCROLL TO SCALE
                                                    </div>
                                                )}
                                                {isHovered && !isDraggingThis && !activeTool && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault(); e.stopPropagation();
                                                            saveHistory();
                                                            setPlacedIcons(placedIcons.filter((_, i) => i !== index));
                                                            setHoveredIconIndex(null);
                                                        }}
                                                        style={{
                                                            position: 'absolute', top: '-8px', right: '-8px',
                                                            width: '20px', height: '20px', borderRadius: '50%',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            background: isDarkMode ? '#1A1A1E' : '#ffffff',
                                                            color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)',
                                                            fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                                                            zIndex: 60, boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                                                        }}
                                                    >✕</button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Device placement preview */}
                                {selectedDevice && mouseGridPos && !activeTool && (
                                    <div style={{
                                        position: 'absolute',
                                        left: layout.offsetX + mouseGridPos.col * layout.dotSpacing,
                                        top: layout.offsetY + mouseGridPos.row * layout.dotSpacing,
                                        width: layout.dotSpacing * previewTransform.scale,
                                        height: layout.dotSpacing * previewTransform.scale,
                                        transform: `translate(-50%, -50%) rotate(${previewTransform.rotation}deg)`,
                                        pointerEvents: 'none', zIndex: 100,
                                        display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', justifyContent: 'center',
                                        transition: 'left 0.1s ease-out, top 0.1s ease-out'
                                    }}>
                                        <div style={{
                                            position: 'relative', padding: '8px', borderRadius: '8px',
                                            background: checkUniversalCollision(mouseGridPos.col, mouseGridPos.row)
                                                ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.4)',
                                            outline: checkUniversalCollision(mouseGridPos.col, mouseGridPos.row)
                                                ? '2px solid #dc2626' : '2px solid #16a34a'
                                        }}>
                                            {React.createElement(ICON_MAP[selectedDevice.type] || ControllerIcon, {color: 'white'})}
                                        </div>
                                        <div style={{marginTop: '8px', fontSize: '9px', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap', color: isDarkMode ? 'white' : '#2C3E50'}}>
                                            PRESS 'R' TO ROTATE<br/>SCROLL TO SCALE
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Floating toolbar ── */}
                        <div
                            id="floating-menu"
                            style={{
                                position: 'fixed', bottom: '40px',
                                left: '50%', transform: 'translateX(-50%)',
                                zIndex: 50, display: 'flex', gap: '32px',
                                padding: '16px 40px', borderRadius: '999px',
                                background: colors.floatingBg,
                                border: `1px solid ${colors.border}`,
                                boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                                backdropFilter: 'blur(8px)',
                                transition: 'all 0.3s'
                            }}
                        >
                            {['Wall', 'Window', 'Door', 'Line', 'Furniture'].map((tool) => {
                                const isFurniture = tool === 'Furniture';
                                const isSelected = isFurniture
                                    ? activeTool?.startsWith('furniture_')
                                    : activeTool === tool.toLowerCase();
                                const ToolIcon = TOOL_ICON_MAP[tool.toLowerCase()];
                                return (
                                    <div key={tool} style={{position: 'relative'}}>
                                        <button
                                            onClick={() => toggleTool(tool)}
                                            style={{
                                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                gap: '4px', background: 'none', border: 'none', cursor: 'pointer',
                                                transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                                                transition: 'transform 0.15s', padding: '4px 8px'
                                            }}
                                        >
                                            <div style={{width: '40px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                                <ToolIcon color={isSelected ? '#00B4D8' : (isDarkMode ? 'white' : '#2C3E50')}/>
                                            </div>
                                            <span style={{
                                                fontSize: '9px', textTransform: 'uppercase', fontWeight: 700,
                                                letterSpacing: '0.08em', fontFamily: 'inherit',
                                                color: isSelected ? '#00B4D8' : (isDarkMode ? 'white' : '#2C3E50')
                                            }}>{tool}</span>
                                        </button>

                                        {/* Furniture submenu */}
                                        {isFurniture && showFurnitureMenu && (
                                            <div style={{
                                                position: 'absolute', bottom: '100%', marginBottom: '16px',
                                                left: '50%', transform: 'translateX(-50%)',
                                                display: 'flex', gap: '8px', padding: '12px',
                                                borderRadius: '16px', border: `1px solid ${colors.border}`,
                                                background: colors.furnitureMenuBg,
                                                boxShadow: '0 8px 24px rgba(0,0,0,0.18)'
                                            }}>
                                                {['Bed', 'Couch', 'Table'].map((item) => (
                                                    <button
                                                        key={item}
                                                        onClick={() => { setActiveTool(`furniture_${item.toLowerCase()}`); setShowFurnitureMenu(false); }}
                                                        style={{
                                                            padding: '8px 16px', borderRadius: '12px', border: 'none',
                                                            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                                                            cursor: 'pointer', fontFamily: 'inherit',
                                                            background: activeTool === `furniture_${item.toLowerCase()}`
                                                                ? '#00B4D8' : (isDarkMode ? '#4A4A60' : '#f3f4f6'),
                                                            color: activeTool === `furniture_${item.toLowerCase()}`
                                                                ? 'white' : (isDarkMode ? 'white' : '#2C3E50')
                                                        }}
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

                {/* ── Right Sidebar ── */}
                <div style={{width: '320px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '24px'}}>

                    {/* Device Catalog */}
                    <div style={{
                        borderRadius: '24px', padding: '24px',
                        background: colors.panel, boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                        display: 'flex', flexDirection: 'column'
                    }}>
                        <p style={{fontWeight: 700, fontSize: '13px', marginBottom: '16px', color: colors.textMain, margin: '0 0 16px 0'}}>Device Catalog</p>
                        <div style={{position: 'relative', marginBottom: '16px'}}>
                            <span style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '14px'}}>🔍</span>
                            <input
                                type="text"
                                placeholder="Search devices..."
                                style={{
                                    width: '100%', padding: '10px 16px 10px 36px',
                                    borderRadius: '12px', border: '1px solid transparent',
                                    background: isDarkMode ? '#3A3A4E' : '#ffffff',
                                    color: isDarkMode ? '#ffffff' : '#2C3E50',
                                    fontSize: '12px', fontWeight: 500, outline: 'none',
                                    boxSizing: 'border-box', fontFamily: 'inherit',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                                }}
                            />
                        </div>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto', padding: '2px'}}>
                            {isCatalogLoading ? (
                                <div style={{fontSize: '11px', textAlign: 'center', padding: '20px', color: colors.textMuted}}>Se caută produse...</div>
                            ) : fetchedDevices.length === 0 ? (
                                <div style={{fontSize: '11px', textAlign: 'center', padding: '20px', color: colors.textMuted}}>Niciun produs găsit.</div>
                            ) : (
                                fetchedDevices.map((d) => {
                                    const IconComponent = ICON_MAP[d.type] || ControllerIcon;
                                    const isSelected = selectedDevice?.id === d.id;
                                    return (
                                        <div
                                            key={d.id}
                                            onClick={() => { setActiveTool(null); setSelectedDevice(isSelected ? null : d); }}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '12px', borderRadius: '16px',
                                                background: isSelected ? 'transparent' : colors.card,
                                                border: isSelected
                                                    ? `2px solid ${isDarkMode ? '#00B4D8' : '#2C3E50'}`
                                                    : '2px solid transparent',
                                                cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
                                                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                                                transition: 'all 0.15s'
                                            }}
                                        >
                                            <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                                                <div style={{width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                                    <IconComponent color={isDarkMode ? "white" : "#000000"}/>
                                                </div>
                                                <div>
                                                    <div style={{fontSize: '11px', fontWeight: 700, color: colors.textMain}}>{d.name}</div>
                                                    <div style={{fontSize: '9px', fontWeight: 500, color: colors.textMuted, marginTop: '2px'}}>{d.price} · {d.brand}</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Installed Devices */}
                    <div style={{
                        borderRadius: '24px', padding: '24px',
                        background: colors.panel, boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                        display: 'flex', flexDirection: 'column', height: '280px'
                    }}>
                        <p style={{fontWeight: 700, fontSize: '13px', color: colors.textMain, margin: '0 0 16px 0'}}>Installed Devices</p>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1}}>
                            {placedIcons.length === 0 ? (
                                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5}}>
                                    <div style={{fontSize: '20px', marginBottom: '8px'}}>🏠</div>
                                    <div style={{fontSize: '10px', fontWeight: 500, color: colors.textMuted}}>No devices active</div>
                                </div>
                            ) : (
                                placedIcons.map((device, index) => {
                                    const IconComponent = ICON_MAP[device.type] || ControllerIcon;
                                    return (
                                        <div
                                            key={device.id || index}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '12px', borderRadius: '16px', minHeight: '70px',
                                                background: isDarkMode ? '#3A3A4E' : '#ffffff',
                                                border: '1px solid transparent',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.07)'
                                            }}
                                        >
                                            <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                                                <div style={{
                                                    width: '40px', height: '40px', borderRadius: '50%',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: isDarkMode ? '#3A3A4E' : '#F8FAFC'
                                                }}>
                                                    <IconComponent color={isDarkMode ? "white" : "#2C3E50"}/>
                                                </div>
                                                <div>
                                                    <div style={{fontSize: '11px', fontWeight: 700, color: colors.textMain, maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{device.name}</div>
                                                    <div style={{fontSize: '9px', fontWeight: 500, color: colors.textMuted, marginTop: '2px'}}>{device.brand}</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default LayoutCanvas;