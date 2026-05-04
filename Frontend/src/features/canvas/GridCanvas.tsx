import React, { useRef, useEffect, useState } from "react";

import {
  drawWindow,
  drawDoor,
  getFurnitureDimensions,
  getFurnitureImage,
} from "./CanvasUtils.ts";


export interface PlacedFurniture {
  id: string;
  type: "bed" | "couch" | "table";
  centerCol: number;
  centerRow: number;
  widthCols: number;
  heightCols: number;
  rotation: number; // 0, 90, 180, 270
}

// definirea formei proprietatilor primite de canvas
interface GridCanvasProps {
  isDarkMode: boolean;
  placedIcons: any[];
  lines: any[];
  setLines: React.Dispatch<React.SetStateAction<any[]>>;
  activeTool: string | null;
  onCanvasClick: (col: number, row: number) => void;
  onLineComplete: (type: string, start: { col: number; row: number }, end: { col: number; row: number }) => void;
  onUpdate: (data: { offsetX: number; offsetY: number; dotSpacing: number; }) => void;
  placedFurniture: any[];
  setPlacedIcons: React.Dispatch<React.SetStateAction<any[]>>;
  draggingItem: { type: 'icon' | 'furniture' | 'wall', id: string } | null;
  setDraggingItem: React.Dispatch<React.SetStateAction<{ type: 'icon' | 'furniture' | 'wall', id: string } | null>>;
  setPlacedFurniture: React.Dispatch<React.SetStateAction<any[]>>;
  onRedo: (lines: any[], icons: any[], furniture: any[]) => void;
  onMouseMove?: (col: number, row: number) => void;
  onMouseLeave?: () => void;
  // New props for delete overlays
  layout: { offsetX: number; offsetY: number; dotSpacing: number };
  checkCollision: (col: number, row: number, ignoreId?: string) => boolean;
  saveHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean; // Adaugă asta
  canRedo: boolean // Adaugă asta
}

const GridCanvas: React.FC<GridCanvasProps> = ({
  isDarkMode,
  placedIcons,
  lines,
  activeTool,
  setLines,
  setPlacedIcons,
  draggingItem,
  setDraggingItem,
  onCanvasClick,
  onLineComplete,
  onUpdate,
  onMouseMove,
  onMouseLeave,
  layout,
  checkCollision,
  placedFurniture,
  setPlacedFurniture,
  saveHistory,
  undo,
  redo,
  canRedo,
  canUndo
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: -100, y: -100 });
  const layoutRef = useRef({ offsetX: 0, offsetY: 0, dotSpacing: 0 });

  // folosim ref pentru a nu reseta animatia la fiecare schimbare minora de mouse
  // pastreaza primul punct apasat cand incepi sa desenezi o linie
  const startPointRef = useRef<{ col: number; row: number } | null>(null);

  const [errors, setErrors] = useState<string[]>([]);
  //const [placedFurniture, setPlacedFurniture] = useState<PlacedFurniture[]>([]);
  const [fScale, setFScale] = useState(1);
  const [fRotation, setFRotation] = useState(0);


  // Track which wall/furniture is hovered for showing X button
  const [hoveredWallId, setHoveredWallId] = useState<string | null>(null);
  const [hoveredFurnitureId, setHoveredFurnitureId] = useState<string | null>(null);

  // Track drag offset so object doesn't jump on grab
  const dragOffsetRef = useRef<{ dcol: number; drow: number }>({ dcol: 0, drow: 0 });
  // Track if we actually moved during drag (to distinguish click from drag)
  const didMoveRef = useRef(false);


  // În interiorul componentei GridCanvas
  const [hoverTooltip, setHoverTooltip] = useState<{device: any ; x: number ; y: number ;} | null>(null);

  const hoverTimerRef = useRef<any>(null);
  const currentHoveredIdRef = useRef<string | null>(null);




  

  
  const checkFurnitureCollision = (col: number, row: number, w: number, h: number, ignoreId?: string) => {
  const xMin = col - w / 2;
  const xMax = col + w / 2;
  const yMin = row - h / 2;
  const yMax = row + h / 2;

  // Verificăm pereții
  const hitWall = lines.some((line) => {
    if (line.id === ignoreId) return false;
    if (line.type !== "wall") return false;
    const lXMin = Math.min(line.start.col, line.end.col);
    const lXMax = Math.max(line.start.col, line.end.col);
    const lYMin = Math.min(line.start.row, line.end.row);
    const lYMax = Math.max(line.start.row, line.end.row);
    return lXMin < xMax && lXMax > xMin && lYMin < yMax && lYMax > yMin;
  });
  if (hitWall) return true;

  // Verificăm cealaltă mobilă
  const hitFurniture = placedFurniture.some((f) => {
    if (f.id === ignoreId) return false;
    const fXMin = f.centerCol - f.widthCols / 2;
    const fXMax = f.centerCol + f.widthCols / 2;
    const fYMin = f.centerRow - f.heightCols / 2;
    const fYMax = f.centerRow + f.heightCols / 2;
    return fXMin < xMax && fXMax > xMin && fYMin < yMax && fYMax > yMin;
  });
  if (hitFurniture) return true;

  // Verificăm iconițele
  const hitIcon = placedIcons.some((icon) => {
    if (icon.id === ignoreId) return false;
    return icon.col >= xMin && icon.col <= xMax && icon.row >= yMin && icon.row <= yMax;
  });
  
  return hitIcon;
};

  // 1. Handler pentru Rotație (Tasta R) - E OK
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTool?.startsWith("furniture_") && e.key.toLowerCase() === "r") {
        setFRotation((prev) => (prev + 90) % 360);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTool]);

  // 2. Handler pentru Scalare (Rotiță) - CORECTAT
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      if (activeTool?.startsWith("furniture_")) {
        e.preventDefault();
        setFScale((prev) => Math.max(1, prev + (e.deltaY < 0 ? 1 : -1)));
      }
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [activeTool]);

  // daca user-ul schimba unealta (din wall in window etc) abandonam linia incompleta
  useEffect(() => {
    if (!activeTool) {
      startPointRef.current = null;
    }
  }, [activeTool]);

  useEffect(() => {
  if (draggingItem) {
    didMoveRef.current = false;
    if (draggingItem.type === 'icon') {
       dragOffsetRef.current = { dcol: 0, drow: 0 };
    }
  }
}, [draggingItem]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let currentWidth = 0;
    let currentHeight = 0;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const rect = parent.getBoundingClientRect();

        if (rect.width !== currentWidth || rect.height !== currentHeight) {
          currentWidth = rect.width;
          currentHeight = rect.height;

          const dpr = window.devicePixelRatio || 1;

          canvas.width = rect.width * dpr;
          canvas.height = rect.height * dpr;

          canvas.style.width = `${rect.width}px`;
          canvas.style.height = `${rect.height}px`;

          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.scale(dpr, dpr);
        }
      }
    };

    resizeCanvas();

    const draw = () => {
      if (!canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      // stergere cadru anterior
      ctx.clearRect(0, 0, w, h);

      const cols = 24;
      const rows = 22;
      const padding = Math.min(w, h) * 0.05;

      const availableWidth = w - padding * 2;
      const availableHeight = h - padding * 2;

      // calcul distante dintre puncte si centrarea
      const dotSpacing = Math.min(
        availableWidth / (cols - 1),
        availableHeight / (rows - 1),
      );

      const gridWidth = dotSpacing * (cols - 1);
      const gridHeight = dotSpacing * (rows - 1);
      const offsetX = (w - gridWidth) / 2;
      const offsetY = (h - gridHeight) / 2;

      // raportare catre componenta parinte a coordonatelor
      if (
        Math.abs(layoutRef.current.offsetX - offsetX) > 0.1 ||
        Math.abs(layoutRef.current.offsetY - offsetY) > 0.1 ||
        Math.abs(layoutRef.current.dotSpacing - dotSpacing) > 0.1
      ) {
        const newLayout = { offsetX, offsetY, dotSpacing };
        layoutRef.current = newLayout;
        setTimeout(() => onUpdate(newLayout), 0);
      }

      const baseRadius = Math.max(1.8, dotSpacing * 0.05);
      const highlightRadius = baseRadius * 3;
      const highlightDistance = dotSpacing * 0.6;

      const bgColor = isDarkMode ? "#5293DE" : "#C2C9CC";
      const dotColor = isDarkMode ? "#FFFFFF" : "#2C3E50";
      const highlightColor = isDarkMode ? "#2C3E50" : "#00B4D8";

      // fill background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);

      const mousePos = mousePosRef.current;

      // aflam coordonata gridului apropiata de mouse
      const hoverI = Math.round((mousePos.x - offsetX) / dotSpacing);
      const hoverJ = Math.round((mousePos.y - offsetY) / dotSpacing);

      let activeX = -100;
      let activeY = -100;

      if (hoverI >= 0 && hoverI < cols && hoverJ >= 0 && hoverJ < rows) {
        const targetX = offsetX + hoverI * dotSpacing;
        const targetY = offsetY + hoverJ * dotSpacing;

        // verificare raza actiune
        if (
          Math.hypot(targetX - mousePos.x, targetY - mousePos.y) <
          highlightDistance
        ) {
          activeX = targetX;
          activeY = targetY;
        }
      }

      // functie auxiliara pentru a desena o linie cu stiluri custom
      const drawCustomLine = (
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        type: string,
        isPreview: boolean = false,
      ) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineCap = "round"; // capete rotunjite la linii

        let strokeColor = isDarkMode ? "#FFFFFF" : "#2C3E50";
        let lineWidth = 6;

        if (type == "wall") {
          lineWidth = 10;
        } else if (type === "window") {
          drawWindow(ctx, x1, y1, x2, y2, isPreview, isDarkMode);
          return;
        } else if (type === "door") {
          drawDoor(ctx, x1, y1, x2, y2, isPreview, isDarkMode);
          return;
        } else if (type === "line") {
          lineWidth = 3; // linie subtire simpla
        } else if (type === "furniture") {
          strokeColor = "#A9C4DD"; // culoare terna ptr mobila
          lineWidth = 4;
        }

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.globalAlpha = isPreview ? 0.5 : 1; // cand urmareste mouse-ul e semi-transparent
        ctx.stroke();
        ctx.globalAlpha = 1;
      };

      // randam grila de puncte
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          // ascundem punctul daca are o iconita pusa pe el
          const hasIcon = placedIcons.some(
            (icon) => icon.col === i && icon.row === j,
          );
          // 1. Verificăm dacă punctul curent (i, j) se află pe traseul oricărei ferestre
          const isOnWindow = lines.some((l) => {
            if (l.type !== "window" && l.type !== "door") return false;

            const minCol = Math.min(l.start.col, l.end.col);
            const maxCol = Math.max(l.start.col, l.end.col);
            const minRow = Math.min(l.start.row, l.end.row);
            const maxRow = Math.max(l.start.row, l.end.row);

            const isHorizontal = l.start.row === l.end.row;
            const isVertical = l.start.col === l.end.col;

            if (isHorizontal) {
              return j === l.start.row && i >= minCol && i <= maxCol;
            } else if (isVertical) {
              return i === l.start.col && j >= minRow && j <= maxRow;
            }
            return false;
          });

          if (hasIcon || isOnWindow) continue;

          const x = offsetX + i * dotSpacing;
          const y = offsetY + j * dotSpacing;

          const isHovered =
            Math.abs(x - activeX) < 0.1 && Math.abs(y - activeY) < 0.1;

          ctx.beginPath();
          ctx.arc(
            x,
            y,
            isHovered ? highlightRadius : baseRadius,
            0,
            Math.PI * 2,
          );
          ctx.fillStyle = isHovered ? highlightColor : dotColor;

          ctx.globalAlpha = isHovered ? 1 : isDarkMode ? 0.4 : 0.4;
          ctx.fill();
          ctx.globalAlpha = 1;

          if (isHovered) {
            ctx.beginPath();
            ctx.arc(x, y, highlightRadius + dotSpacing * 0.2, 0, Math.PI * 2);
            ctx.fillStyle = isDarkMode
              ? "rgba(44, 62, 80, 0.25)"
              : "rgba(0, 180, 216, 0.25)";
            ctx.fill();
          }
        }
      }

      // PASUL A: Randăm mai întâi doar pereții (fundalul alb/negru gros)
      lines
        .filter((line) => line.type === "wall")
        .forEach((line) => {
          const x1 = offsetX + line.start.col * dotSpacing;
          const y1 = offsetY + line.start.row * dotSpacing;
          const x2 = offsetX + line.end.col * dotSpacing;
          const y2 = offsetY + line.end.row * dotSpacing;
          drawCustomLine(x1, y1, x2, y2, line.type);
        });

      // randam linia in progres (cea care urmareste cursorul)
      if (startPointRef.current && activeTool) {
        const x1 = offsetX + startPointRef.current.col * dotSpacing;
        const y1 = offsetY + startPointRef.current.row * dotSpacing;

        const endX = activeX !== -100 ? activeX : mousePos.x;
        const endY = activeY !== -100 ? activeY : mousePos.y;

        drawCustomLine(x1, y1, endX, endY, activeTool, true);
      }
      // --- PASUL 3: DESENĂM MOBILA PLASATĂ ---
      placedFurniture.forEach((f) => {
        const img = getFurnitureImage(f.type, isDarkMode, true);

        const x = Math.round(offsetX + f.centerCol * dotSpacing);
        const y = Math.round(offsetY + f.centerRow * dotSpacing);
        const w = Math.round(f.widthCols * dotSpacing);
        const h = Math.round(f.heightCols * dotSpacing);

        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.translate(x, y);
        ctx.rotate((f.rotation * Math.PI) / 180);

        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        ctx.restore();
      });

      // --- PASUL 4: GHOST PREVIEW ---
      if (
        activeTool?.startsWith("furniture_") &&
        hoverI >= 0 &&
        hoverI < cols
      ) {
        const type = activeTool.split("_")[1] as any;
        const { w, h } = getFurnitureDimensions(type, fScale, fRotation);
        const baseDims = getFurnitureDimensions(type, fScale, 0);
        const hasCollision = checkFurnitureCollision(hoverI, hoverJ, w, h);

        ctx.save();
        ctx.translate(
          offsetX + hoverI * dotSpacing,
          offsetY + hoverJ * dotSpacing,
        );

        ctx.globalAlpha = 0.3;
        ctx.fillStyle = hasCollision
          ? "rgba(255, 0, 0, 0.4)"
          : "rgba(0, 255, 0, 0.2)";
        ctx.fillRect(
          -(w * dotSpacing) / 2,
          -(h * dotSpacing) / 2,
          w * dotSpacing,
          h * dotSpacing,
        );

        const previewImg = getFurnitureImage(type, isDarkMode, false);

        if (previewImg.complete && previewImg.naturalWidth !== 0) {
          ctx.save();
          ctx.rotate((fRotation * Math.PI) / 180);
          ctx.globalAlpha = 0.8;
          ctx.drawImage(
            previewImg,
            -(baseDims.w * dotSpacing) / 2,
            -(baseDims.h * dotSpacing) / 2,
            baseDims.w * dotSpacing,
            baseDims.h * dotSpacing,
          );
          ctx.restore();
        } else {
          previewImg.onload = () => {};
        }

        ctx.font = "bold 9px sans-serif";
        ctx.fillStyle = isDarkMode ? "white" : "#2C3E50";
        ctx.textAlign = "center";
        ctx.globalAlpha = 0.8;

        const textY = (h * dotSpacing) / 2 + 25;

        ctx.fillText("PRESS 'R' TO ROTATE", 0, textY);
        ctx.fillText("SCROLL TO SCALE", 0, textY + 16);

        ctx.restore();
      }

      // PASUL B: Randăm restul (geamurile, ușile) - acestea vor veni DEASUPRA pereților
      lines
        .filter((line) => line.type !== "wall")
        .forEach((line) => {
          const x1 = offsetX + line.start.col * dotSpacing;
          const y1 = offsetY + line.start.row * dotSpacing;
          const x2 = offsetX + line.end.col * dotSpacing;
          const y2 = offsetY + line.end.row * dotSpacing;
          drawCustomLine(x1, y1, x2, y2, line.type);
        });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        resizeCanvas();
      }, 50);
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    return () => {
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    isDarkMode,
    placedIcons,
    lines,
    activeTool,
    fScale,
    fRotation,
    placedFurniture,
  ]);

  const findWallAt = (col: number, row: number) => {
    return lines.findIndex(l => {
      if (l.type !== 'wall') return false;
      const isV = l.start.col === l.end.col;
      const isH = l.start.row === l.end.row;
      if (isV && col === l.start.col) return row >= Math.min(l.start.row, l.end.row) && row <= Math.max(l.start.row, l.end.row);
      if (isH && row === l.start.row) return col >= Math.min(l.start.col, l.end.col) && col <= Math.max(l.start.col, l.end.col);
      return false;
    });
  };

  const findLineAt = (col: number, row: number) => {
    return lines.findIndex(l => {
      const isV = l.start.col === l.end.col;
      const isH = l.start.row === l.end.row;
      if (isV && col === l.start.col) return row >= Math.min(l.start.row, l.end.row) && row <= Math.max(l.start.row, l.end.row);
      if (isH && row === l.start.row) return col >= Math.min(l.start.col, l.end.col) && col <= Math.max(l.start.col, l.end.col);
      return false;
    });
  };

  const handleInternalMouseDown = (e: React.MouseEvent) => {
  didMoveRef.current = false;
  const { x, y } = mousePosRef.current;
  const { offsetX, offsetY, dotSpacing } = layoutRef.current;
  const col = Math.round((x - offsetX) / dotSpacing);
  const row = Math.round((y - offsetY) / dotSpacing);

  if (activeTool) return;

  // --- LOGICA UNITARĂ PENTRU ICONIȚE (PIXEL-PERFECT) ---
  const iconSize = 40;
  const iconIdx = placedIcons.findIndex(i => {
    const baseX = (i.coordinates?.x ?? (i.col * dotSpacing)) + offsetX;
    const baseY = (i.coordinates?.y ?? (i.row * dotSpacing)) + offsetY;
    
    // Căutăm centrul (la fel ca la hover)
    const centerX = baseX + iconSize / 2;
    const centerY = baseY + iconSize / 2;

    const dx = x - centerX;
    const dy = y - centerY;
    return Math.sqrt(dx * dx + dy * dy) < 20; // Raza de 20px
  });

  if (iconIdx !== -1) {
    const icon = placedIcons[iconIdx];
    // Calculăm poziția pe grid a iconiței
    const iconCol = icon.col ?? Math.round((icon.coordinates!.x) / dotSpacing);
    const iconRow = icon.row ?? Math.round((icon.coordinates!.y) / dotSpacing);
    
    // Păstrăm distanța dintre mouse și centrul obiectului
    dragOffsetRef.current = { dcol: col - iconCol, drow: row - iconRow };
    setDraggingItem({ type: 'icon', id: icon.id });
    return;
  }

  // --- LOGICĂ MOBILĂ ---
  const furnIdx = placedFurniture.findIndex(f =>
    col >= f.centerCol - f.widthCols / 2 &&
    col <= f.centerCol + f.widthCols / 2 &&
    row >= f.centerRow - f.heightCols / 2 &&
    row <= f.centerRow + f.heightCols / 2
  );
  if (furnIdx !== -1) {
    const f = placedFurniture[furnIdx];
    dragOffsetRef.current = { dcol: col - f.centerCol, drow: row - f.centerRow };
    setDraggingItem({ type: 'furniture', id: f.id });
    return;
  }

  // --- LOGICĂ PEREȚI ---
  const lineIdx = findLineAt(col, row);
  if (lineIdx !== -1) {
    const line = lines[lineIdx];
    const midCol = (line.start.col + line.end.col) / 2;
    const midRow = (line.start.row + line.end.row) / 2;
    dragOffsetRef.current = { dcol: col - midCol, drow: row - midRow };
    setDraggingItem({ type: 'wall', id: line.id });
  }
};

  const handleInternalMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    // 1. Calculăm poziția mouse-ului pe canvas
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mousePosRef.current = { x, y };

    const { offsetX, offsetY, dotSpacing } = layoutRef.current;
    const col = Math.round((x - offsetX) / dotSpacing);
    const row = Math.round((y - offsetY) / dotSpacing);

    // 2. Resetăm Tooltip-ul la orice mișcare pentru a evita carduri "lipite"
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    if (hoverTooltip) setHoverTooltip(null);

    // Comunicăm poziția către părinte dacă e necesar
    if (onMouseMove) onMouseMove(col, row);

    // 3. LOGICA DE DRAGGING (Prioritate Maximă)
    if (draggingItem) {
      // Apelăm funcția ta exactă de dragging
      handleDraggingLogic(x, y);

      // În timpul drag-ului, nu vrem tooltip-uri active
      currentHoveredIdRef.current = null;
      return; // Ieșim, nu mai procesăm hover
    }
  };



  const handleInternalMouseUp = () => {
  setDraggingItem(null);
  didMoveRef.current = false;
  currentHoveredIdRef.current = null;
  
  if (hoverTimerRef.current) {
    clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = null;
  }

  const { x: mouseX, y: mouseY } = mousePosRef.current;
  const hoveredIcon = getIconAtPosition(mouseX, mouseY);

  if (hoveredIcon) {
    const targetId = hoveredIcon.id || hoveredIcon.device?.id;
    currentHoveredIdRef.current = targetId;

    hoverTimerRef.current = window.setTimeout(() => {
      if (currentHoveredIdRef.current !== targetId) return;
      
      const data = hoveredIcon.device ? hoveredIcon.device : hoveredIcon;
      const { offsetX, offsetY, dotSpacing } = layoutRef.current;
      const iconSize = 40;
      const baseX = hoveredIcon.coordinates?.x ?? (hoveredIcon.col * dotSpacing);
      const baseY = hoveredIcon.coordinates?.y ?? (hoveredIcon.row * dotSpacing);

      setHoverTooltip({
        device: {
          name: data.name || "N/A",
          type: data.deviceType || data.type || "N/A",
          priceEUR: data.price ?? data.priceEUR ?? 0,
          protocol: data.protocol || 'Zigbee',
          ecosystem: data.ecosystem || 'Apple HomeKit'
        },
        x: baseX + offsetX + (iconSize / 2),
        y: baseY + offsetY + (iconSize / 2)
      });
    }, 800);
  }
};

  const getIconAtPosition = (mouseX: number, mouseY: number) => {
    const { offsetX, offsetY, dotSpacing } = layoutRef.current;
    const iconSize = 40; // Sau mărimea ta dinamică

    return placedIcons.find(icon => {
      // 1. Calculăm centrul real pe Canvas
      const baseX = icon.coordinates?.x ?? (icon.col * dotSpacing);
      const baseY = icon.coordinates?.y ?? (icon.row * dotSpacing);
      
      // Centrul este: Poziția de bază + Offset-ul Global + Jumătate din mărime
      const centerX = baseX + offsetX + (iconSize / 2);
      const centerY = baseY + offsetY + (iconSize / 2);

      // 2. Distanța de la mouse la acest centru
      const dx = mouseX - centerX;
      const dy = mouseY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // 3. Raza de detecție: jumătate din iconiță + o mică marjă (5-10px)
      return distance < (iconSize / 2 + 5);
    });
  };


  const handleDraggingLogic = (x: number, y: number) => {
    // Verificăm dacă există ceva selectat pentru a evita eroarea de 'null'
    if (!draggingItem) return;

    const { offsetX, offsetY, dotSpacing } = layoutRef.current;
    
    // Transformăm pixelii mouse-ului în coordonate de grid (coloană/rând)
    const col = Math.round((x - offsetX) / dotSpacing);
    const row = Math.round((y - offsetY) / dotSpacing);

    // 1. Marcăm faptul că obiectul s-a mișcat (pentru istoric/undo)
    if (!didMoveRef.current) {
      saveHistory();
      didMoveRef.current = true;
    }

    // 2. LOGICA DE DRAGGING (EXACT CA ÎN CODUL TĂU)
    if (draggingItem.type === 'icon') {
      if (!checkCollision(col, row, draggingItem.id)) {
        setPlacedIcons(prev => prev.map(i => 
          i.id === draggingItem.id ? { ...i, col, row } : i
        ));
      }
    } 
    
    else if (draggingItem.type === 'furniture') {
      const { dcol, drow } = dragOffsetRef.current;
      const newCol = col - dcol;
      const newRow = row - drow;
      const f = placedFurniture.find(f => f.id === draggingItem.id);
      
      if (f && !checkFurnitureCollision(newCol, newRow, f.widthCols, f.heightCols, draggingItem.id)) {
        setPlacedFurniture(prev => prev.map(item =>
          item.id === draggingItem.id ? { ...item, centerCol: newCol, centerRow: newRow } : item
        ));
      }
    } 
    
    else if (draggingItem.type === 'wall') {
      const { dcol, drow } = dragOffsetRef.current;
      const newMidCol = col - dcol;
      const newMidRow = row - drow;

      setLines(prev => prev.map(l => {
        if (l.id !== draggingItem.id) return l;
        
        const midCol = (l.start.col + l.end.col) / 2;
        const midRow = (l.start.row + l.end.row) / 2;
        const ddc = newMidCol - midCol;
        const ddr = newMidRow - midRow;

        return {
          ...l,
          start: { col: Math.round(l.start.col + ddc), row: Math.round(l.start.row + ddr) },
          end: { col: Math.round(l.end.col + ddc), row: Math.round(l.end.row + ddr) },
        };
      }));
    }
  };
  const handleMouseLeave = () => {
    mousePosRef.current = { x: -100, y: -100 };
    setDraggingItem(null);
    if (onMouseLeave) onMouseLeave();
  };

  // logica de click pe grid
  const handleInternalClick = () => {

    
    
    if (didMoveRef.current) return; // previne plasarea daca tocmai am facut drag
    if (draggingItem) return;
    const { x, y } = mousePosRef.current;
    const { offsetX, offsetY, dotSpacing } = layoutRef.current;

    const col = Math.round((x - offsetX) / dotSpacing);
    const row = Math.round((y - offsetY) / dotSpacing);

    if (activeTool?.startsWith("furniture_")) {
      const type = activeTool.split("_")[1] as "bed" | "couch" | "table";

      const { w, h } = getFurnitureDimensions(type, fScale, fRotation);

      if (!checkFurnitureCollision(col, row, w, h)) {

        saveHistory();
        const scaledBase = getFurnitureDimensions(type, fScale, 0);

        const newItem: PlacedFurniture = {
          id: Date.now().toString(),
          type,
          centerCol: col,
          centerRow: row,
          widthCols: scaledBase.w,
          heightCols: scaledBase.h,
          rotation: fRotation,
        };

        setPlacedFurniture((prev) => [...prev, newItem]);
      }
      return;
    }
    const targetX = offsetX + col * dotSpacing;
    const targetY = offsetY + row * dotSpacing;

    if (Math.hypot(targetX - x, targetY - y) < dotSpacing * 0.5) {
      if (activeTool) {
        if (!startPointRef.current) {
          startPointRef.current = { col, row };
        } else {
          if (
            startPointRef.current.col !== col ||
            startPointRef.current.row !== row
          ) {
            saveHistory();
            onLineComplete(activeTool, startPointRef.current, { col, row });
          }
          startPointRef.current = null;
        }
      } else {
        saveHistory();
        onCanvasClick(col, row);
      }
    }
  };

  const validateLayout = async () => {
    const data = {
      id: "layout1",
      scale: "1:1",
      maxBudget: 1000.0,
      targetEcosystem: "smart",
      rooms: [],
      devices: placedIcons.map((icon) => ({
        id: icon.type + icon.col + icon.row,
        type: icon.type,
        position: { x: icon.col, y: icon.row },
      })),
    };

    try {
      const response = await fetch(
        "http://localhost:20025/api/team2/layouts/validate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
      const result = await response.json();
      if (result.errors) {
        setErrors(result.errors.map((e: any) => e.message));
      } else {
        setErrors([]);
      }
    } catch (error) {
      setErrors(["Eroare la validare"]);
    }
  };

  // Helper: get pixel position of wall midpoint for X button
  const getWallMidPx = (line: any) => {
    const { offsetX, offsetY, dotSpacing } = layout;
    if (!dotSpacing) return null;
    const midCol = (line.start.col + line.end.col) / 2;
    const midRow = (line.start.row + line.end.row) / 2;
    return {
      x: offsetX + midCol * dotSpacing,
      y: offsetY + midRow * dotSpacing,
    };
  };

  // Helper: get pixel position of furniture for X button
  const getFurniturePx = (f: any) => {
    const { offsetX, offsetY, dotSpacing } = layout;
    if (!dotSpacing) return null;
    return {
      x: offsetX + f.centerCol * dotSpacing,
      y: offsetY + f.centerRow * dotSpacing,
      w: f.widthCols * dotSpacing,
      h: f.heightCols * dotSpacing,
    };
  };

  // Siguranță: Oprește drag-ul automat dacă dai drumul la mouse oriunde pe ecran
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (draggingItem) setDraggingItem(null);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [draggingItem, setDraggingItem]);

  return (
    <div className="relative w-full h-full"> {/* Container necesar pentru coordonate absolute corecte */}
    
    {/* 1. Canvas-ul este baza (Z-index 10) */}
    <canvas
      ref={canvasRef}
      onMouseDown={handleInternalMouseDown}
      onMouseMove={handleInternalMouseMove}
      onMouseUp={handleInternalMouseUp}
      onMouseLeave={handleMouseLeave}
      onClick={handleInternalClick}
      className="absolute inset-0 w-full h-full cursor-crosshair rounded-3xl"
      style={{ zIndex: 10 }}
    />
        
      {/* Container pentru butoanele de Undo și Redo */}
      <div className="absolute top-4 left-4 z-20 flex gap-2">
       
        {/* Butonul de UNDO */}
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-lg transition-all active:scale-95
          ${
            !canUndo
              ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50"
              : isDarkMode
                ? "bg-[#2D2D3D] text-white hover:bg-[#3D3D4D]"
                : "bg-[#B8C6D4] text-[#2C3E50] hover:bg-[#A8B6C4]"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
          </svg>
          UNDO
        </button>

        {/* Butonul de REDO */}
        <button
          onClick={redo}
          disabled={!canRedo}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-lg transition-all active:scale-95
          ${
            !canRedo
              ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50"
              : isDarkMode
                ? "bg-[#2D2D3D] text-white hover:bg-[#3D3D4D]"
                : "bg-[#B8C6D4] text-[#2C3E50] hover:bg-[#A8B6C4]"
          }`}
        >
          REDO
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 7v6h-6" />
            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
          </svg>
        </button>
      </div>

      {/* Afișarea erorilor */}
      {errors.length > 0 && (
        <div className="absolute bottom-6 left-6 z-20 bg-red-500 text-white p-4 rounded-2xl shadow-2xl max-w-xs animate-in fade-in slide-in-from-bottom-4">
          <ul className="list-disc ml-4 text-xs font-semibold uppercase tracking-wider">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Overlay HTML: butoane X și DRAG pentru walls/linii */}
      {layout.dotSpacing > 0 && lines.map((line) => {
        const mid = getWallMidPx(line);
        if (!mid) return null;
        const isHovered = hoveredWallId === line.id;
        const isDraggingThis = draggingItem?.type === 'wall' && draggingItem.id === line.id;
        
        return (
          <div
            key={`wall-overlay-${line.id}`}
            onMouseEnter={() => setHoveredWallId(line.id)}
            onMouseLeave={() => setHoveredWallId(null)}
            onMouseDown={(e) => {
              if ((e.target as HTMLElement).closest('button')) {
                return; 
              }
              if (activeTool) return;
              e.preventDefault();
              e.stopPropagation();
              if (!canvasRef.current) return;
              const rect = canvasRef.current.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              const col = Math.round((x - layout.offsetX) / layout.dotSpacing);
              const row = Math.round((y - layout.offsetY) / layout.dotSpacing);
              const midCol = (line.start.col + line.end.col) / 2;
              const midRow = (line.start.row + line.end.row) / 2;
              dragOffsetRef.current = { dcol: col - midCol, drow: row - midRow };
              setDraggingItem({ type: 'wall', id: line.id });
            }}
            style={{
              position: 'absolute',
              left: mid.x,
              top: mid.y,
              transform: 'translate(-50%, -50%)',
              width: Math.max(
                Math.abs((line.end.col - line.start.col) * layout.dotSpacing),
                layout.dotSpacing * 1.2
              ),
              height: Math.max(
                Math.abs((line.end.row - line.start.row) * layout.dotSpacing),
                layout.dotSpacing * 1.2
              ),
              zIndex: 25,
              cursor: isDraggingThis ? 'grabbing' : 'grab',
              pointerEvents: activeTool ? 'none' : 'auto',
              userSelect: 'none',
            }}
          >
            
            {isHovered && !isDraggingThis && (
            <button
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                saveHistory();
                setLines(prev => prev.filter(l => l.id !== line.id));
                setHoveredWallId(null);
              }}
              className={`
                  absolute 
                  -top-2 -right-2 
                  w-5 h-5 
                  flex items-center justify-center 
                  rounded-full 
                  shadow-md 
                  z-[60] 
                  text-[10px] 
                  font-bold 
                  transition-all 
                  duration-200 
                  border 
                  cursor-pointer 
                  ${isDarkMode 
                    ? 'bg-[#1A1A1E] text-red-500 border-red-500/30 hover:bg-red-500 hover:text-white' 
                    : 'bg-white text-red-600 border-red-200 hover:bg-red-600 hover:text-white'
                  }
                  
                `}
                style={{
                    fontSize: '10px',
                    lineHeight: '1',
                    pointerEvents: 'auto' // Crucial pentru a înregistra click-ul
                }}
            >
              ✕
            </button>
            )}
          </div>
        );
      })}


      {/* Overlay HTML: butoane X și DRAG pentru furniture */}
      {layout.dotSpacing > 0 && placedFurniture.map((f) => {
        const pos = getFurniturePx(f);
        if (!pos) return null;
        const isHovered = hoveredFurnitureId === f.id;
        const isDraggingThis = draggingItem?.type === 'furniture' && draggingItem.id === f.id;
        
        return (
          <div
            key={`furn-overlay-${f.id}`}
            onMouseEnter={() => setHoveredFurnitureId(f.id)}
            onMouseLeave={() => setHoveredFurnitureId(null)}
            onMouseDown={(e) => {
              if (activeTool) return;
              e.preventDefault();
              e.stopPropagation();
              if (!canvasRef.current) return;
              const rect = canvasRef.current.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              const col = Math.round((x - layout.offsetX) / layout.dotSpacing);
              const row = Math.round((y - layout.offsetY) / layout.dotSpacing);
              dragOffsetRef.current = { dcol: col - f.centerCol, drow: row - f.centerRow };
              setDraggingItem({ type: 'furniture', id: f.id });
            }}
            style={{
              position: 'absolute',
              left: pos.x - pos.w / 2,
              top: pos.y - pos.h / 2,
              width: pos.w,
              height: pos.h,
              zIndex: 25,
              cursor: isDraggingThis ? 'grabbing' : 'grab',
              pointerEvents: activeTool ? 'none' : 'auto',
              userSelect: 'none',
            }}
          >
            {isHovered && !isDraggingThis && (
              <button
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                saveHistory();
                setPlacedFurniture(prev => prev.filter(item => item.id !== f.id));
                setHoveredFurnitureId(null);
              }}
              className={`
                  absolute 
                  -top-2 -right-2 
                  w-5 h-5 
                  flex items-center justify-center 
                  rounded-full 
                  shadow-md 
                  z-[60] 
                  text-[10px] 
                  font-bold 
                  transition-all 
                  duration-200 
                  border 
                  cursor-pointer 
                  ${isDarkMode 
                    ? 'bg-[#1A1A1E] text-red-500 border-red-500/30 hover:bg-red-500 hover:text-white' 
                    : 'bg-white text-red-600 border-red-200 hover:bg-red-600 hover:text-white'
                  }
                `}
                style={{
                    fontSize: '10px',
                    lineHeight: '1',
                    pointerEvents: 'auto' // Crucial pentru a înregistra click-ul
                }}
            >
              ✕
            </button>
            )}
          </div>
        );
      })}

    </div>
  );
};

export default GridCanvas;