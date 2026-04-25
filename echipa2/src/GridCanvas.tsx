import React, { useRef, useEffect, useState } from "react";

import {
  drawWindow,
  drawDoor,
  getFurnitureDimensions,
  getFurnitureImage,
} from "./CanvasUtils";

interface CanvasSnapshot {
  lines: any[]; // Array-ul de linii (pereți, geamuri etc.)
  placedIcons: any[]; // Array-ul de iconițe de device-uri
  placedFurniture: PlacedFurniture[]; // Array-ul de mobilă
}

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
  placedIcons: { col: number; row: number; type: string }[];
  lines: {
    type: string;
    start: { col: number; row: number };
    end: { col: number; row: number };
  }[];
  activeTool: string | null;
  onCanvasClick: (col: number, row: number) => void;
  onLineComplete: (
    type: string,
    start: { col: number; row: number },
    end: { col: number; row: number },
  ) => void;
  onUpdate: (data: {
    offsetX: number;
    offsetY: number;
    dotSpacing: number;
  }) => void;
  onRestoreHistory: (lines: any[], icons: any[]) => void;
  placedFurniture: any[];
  setPlacedFurniture: React.Dispatch<React.SetStateAction<any[]>>;
  onMouseMove?: (col: number, row: number) => void;
  onMouseLeave?: () => void;
}

const GridCanvas: React.FC<GridCanvasProps> = ({
  isDarkMode,
  placedIcons,
  lines,
  activeTool,
  onCanvasClick,
  onLineComplete,
  onUpdate,
  onRestoreHistory,
  onMouseMove,
  onMouseLeave,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: -100, y: -100 });
  const layoutRef = useRef({ offsetX: 0, offsetY: 0, dotSpacing: 0 });

  // folosim ref pentru a nu reseta animatia la fiecare schimbare minora de mouse
  // pastreaza primul punct apasat cand incepi sa desenezi o linie
  const startPointRef = useRef<{ col: number; row: number } | null>(null);

  const [errors, setErrors] = useState<string[]>([]);
  const [placedFurniture, setPlacedFurniture] = useState<PlacedFurniture[]>([]);
  const [fScale, setFScale] = useState(1);
  const [fRotation, setFRotation] = useState(0);

  const [history, setHistory] = useState<CanvasSnapshot[]>([]);

  // Funcția de salvare a stării (o chemăm înainte de ORICE modificare)
  const saveSnapshot = () => {
    setHistory((prev) => {
      const currentSnapshot: CanvasSnapshot = {
        lines: [...lines],
        placedIcons: [...placedIcons],
        placedFurniture: [...placedFurniture],
      };
      return [...prev, currentSnapshot].slice(-30); // Păstrăm ultimele 30 de acțiuni
    });
  };

  const handleUndo = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // Prevenim declanșarea click-ului pe canvas când apeși butonul
    if (history.length === 0) return;

    const lastSnapshot = history[history.length - 1];

    // Restaurăm mobila locală
    setPlacedFurniture(lastSnapshot.placedFurniture);

    // Trimitem liniile și iconițele înapoi la App.tsx
    onRestoreHistory(lastSnapshot.lines, lastSnapshot.placedIcons);

    // Ștergem snapshot-ul din istoric
    setHistory((prev) => prev.slice(0, -1));
  };

  const checkFurnitureCollision = (
    col: number,
    row: number,
    w: number,
    h: number,
  ) => {
    const xMin = col - w / 2;
    const xMax = col + w / 2;
    const yMin = row - h / 2;
    const yMax = row + h / 2;

    return lines.some((line) => {
      if (line.type !== "wall") return false;
      // Verificăm dacă segmentul peretelui intersectează dreptunghiul mobilei
      // O verificare simplificată de Bounding Box:
      const lXMin = Math.min(line.start.col, line.end.col);
      const lXMax = Math.max(line.start.col, line.end.col);
      const lYMin = Math.min(line.start.row, line.end.row);
      const lYMax = Math.max(line.start.row, line.end.row);

      return lXMin < xMax && lXMax > xMin && lYMin < yMax && lYMax > yMin;
    });
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
        e.preventDefault(); // Oprește scroll-ul paginii
        setFScale((prev) => Math.max(1, prev + (e.deltaY < 0 ? 1 : -1)));
      }
    };

    // Important: adăugăm listener-ul direct pe elementul canvas cu passive: false
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

            // Verificăm dacă e fereastră orizontală (row e același)
            const isHorizontal = l.start.row === l.end.row;
            // Verificăm dacă e fereastră verticală (col e același)
            const isVertical = l.start.col === l.end.col;

            if (isHorizontal) {
              // Punctul trebuie să fie pe același rând ȘI între coloane
              return j === l.start.row && i >= minCol && i <= maxCol;
            } else if (isVertical) {
              // Punctul trebuie să fie pe aceeași coloană ȘI între rânduri
              return i === l.start.col && j >= minRow && j <= maxRow;
            }
            return false;
          });

          // 2. Dacă e sub o iconiță SAU sub un geam, nu mai desena punctul
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

        // se prinde / snap la punctul grid-ului daca suntem in raza lui, daca nu, doar urmareste cursorul
        const endX = activeX !== -100 ? activeX : mousePos.x;
        const endY = activeY !== -100 ? activeY : mousePos.y;

        drawCustomLine(x1, y1, endX, endY, activeTool, true);
      }
      // --- PASUL 3: DESENĂM MOBILA PLASATĂ ---
      placedFurniture.forEach((f) => {
        // Aici punem TRUE pentru fundal, ca să acopere punctele
        const img = getFurnitureImage(f.type, isDarkMode, true);

        // FOLOSEȘTE Math.round pentru a evita "sub-pixel rendering"
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

        // 1. DESENĂM FUNDALUL DE COLIZIUNE (Rămâne transparent ca să vedem culorile)
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

        // 2. DESENĂM IMAGINEA (Fără fundal opac în preview)
        // Al treilea parametru 'false' asigură că SVG-ul nu are fundalul care acoperă punctele
        const previewImg = getFurnitureImage(type, isDarkMode, false);

        if (previewImg.complete && previewImg.naturalWidth !== 0) {
          ctx.save(); // Salvăm starea înainte de rotația imaginii
          ctx.rotate((fRotation * Math.PI) / 180);
          ctx.globalAlpha = 0.8;
          ctx.drawImage(
            previewImg,
            -(baseDims.w * dotSpacing) / 2,
            -(baseDims.h * dotSpacing) / 2,
            baseDims.w * dotSpacing,
            baseDims.h * dotSpacing,
          );
          ctx.restore(); // Revenim la contextul nertotit (dar translatat pe obiect)
        } else {
          previewImg.onload = () => {};
        }

        // 3. ADĂUGARE MESAJE (SUB MOBILĂ)
        // Contextul este deja la (hoverI, hoverJ) datorită primului translate
        ctx.font = "bold 9px sans-serif";
        ctx.fillStyle = isDarkMode ? "white" : "#2C3E50";
        ctx.textAlign = "center";
        ctx.globalAlpha = 0.8;

        // Calculăm poziția textului să fie sub zona de coliziune (h)
        const textY = (h * dotSpacing) / 2 + 25;

        ctx.fillText("PRESS 'R' TO ROTATE", 0, textY);
        ctx.fillText("SCROLL TO SCALE", 0, textY + 16);

        ctx.restore(); // Închidem save-ul de la începutul pasului 4
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
  ]); // reporneste daca se schimba lista de linii sau unealta

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    mousePosRef.current = { x, y };

    if (onMouseMove) {
      const col = Math.round(
        (x - layoutRef.current.offsetX) / layoutRef.current.dotSpacing,
      );
      const row = Math.round(
        (y - layoutRef.current.offsetY) / layoutRef.current.dotSpacing,
      );
      onMouseMove(col, row);
    }
  };

  const handleMouseLeave = () => {
    mousePosRef.current = { x: -100, y: -100 };
    if (onMouseLeave) onMouseLeave();
  };

  // logica de click pe grid, gestioneaza atat plasarea device-urilor cat si desenarea liniilor
  const handleInternalClick = () => {
    const { x, y } = mousePosRef.current;
    const { offsetX, offsetY, dotSpacing } = layoutRef.current;

    const col = Math.round((x - offsetX) / dotSpacing);
    const row = Math.round((y - offsetY) / dotSpacing);

    if (activeTool?.startsWith("furniture_")) {
      const type = activeTool.split("_")[1] as "bed" | "couch" | "table";

      // 1. Calculăm dimensiunile REALE (cu scală și rotație) pentru coliziune
      const { w, h } = getFurnitureDimensions(type, fScale, fRotation);

      if (!checkFurnitureCollision(col, row, w, h)) {
        // 2. Calculăm dimensiunile scalate dar fără rotație pentru stocare
        // (ca să știm cât spațiu ocupă ea "drept")
        const scaledBase = getFurnitureDimensions(type, fScale, 0);

        const newItem: PlacedFurniture = {
          id: Date.now().toString(),
          type,
          centerCol: col,
          centerRow: row,
          widthCols: scaledBase.w, // SALVĂM DIMENSIUNEA SCALATĂ, NU 1
          heightCols: scaledBase.h, // SALVĂM DIMENSIUNEA SCALATĂ, NU 1
          rotation: fRotation,
        };
        saveSnapshot(); // SALVĂM ÎNAINTE SĂ PUNEM MOBILA

        setPlacedFurniture((prev) => [...prev, newItem]);
      }
      return;
    }
    const targetX = offsetX + col * dotSpacing;
    const targetY = offsetY + row * dotSpacing;

    // ne asiguram ca user-ul da click curat pe langa un punct de grid
    if (Math.hypot(targetX - x, targetY - y) < dotSpacing * 0.5) {
      // mod desenare
      if (activeTool) {
        if (!startPointRef.current) {
          // click 1: inregistreaza punctul de start
          startPointRef.current = { col, row };
        } else {
          // click 2: daca nu am dat click in acelasi punct pe loc, trimite linia sa se salveze
          if (
            startPointRef.current.col !== col ||
            startPointRef.current.row !== row
          ) {
            saveSnapshot();
            onLineComplete(activeTool, startPointRef.current, { col, row });
          }
          // reseteaza referinta pentru a lasa liber la trasat o noua linie complet diferita
          startPointRef.current = null;
        }
      }
      // mod plasare element din catalog
      else {
        onCanvasClick(col, row);
      }
    }
  };

  const validateLayout = async () => {
    // Prepare data in SetupBuildDTO format
    const data = {
      id: "layout1",
      scale: "1:1",
      maxBudget: 1000.0,
      targetEcosystem: "smart",
      rooms: [], // TODO: convert lines to rooms
      devices: placedIcons.map((icon) => ({
        id: icon.type + icon.col + icon.row,
        type: icon.type,
        position: { x: icon.col, y: icon.row },
      })), // Simplified
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

  return (
    <>
      {/* Butonul de Undo poziționat deasupra canvas-ului */}
      <button
        onClick={handleUndo}
        disabled={history.length === 0}
        className={`absolute top-4 left-4 z-20 flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-lg transition-all active:scale-95
        ${
          history.length === 0
            ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50"
            : isDarkMode
              ? "bg-[#2D2D3D] text-white hover:bg-[#3D3D4D]" // Stil Dark: fundal închis, scris alb
              : "bg-[#B8C6D4] text-[#2C3E50] hover:bg-[#A8B6C4]" // Stil Light: fundal albastru-gri, scris închis
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 7v6h6" />
          <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
        </svg>
        {isDarkMode ? "UNDO" : "UNDO"}
      </button>

      {errors.length > 0 && (
        <div className="absolute bottom-6 left-6 z-20 bg-red-500 text-white p-4 rounded-2xl shadow-2xl max-w-xs animate-in fade-in slide-in-from-bottom-4">
          <ul className="list-disc ml-4 text-xs font-semibold uppercase tracking-wider">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleInternalClick}
        className="absolute inset-0 w-full h-full cursor-crosshair rounded-3xl"
      />
    </>
  );
};

export default GridCanvas;
