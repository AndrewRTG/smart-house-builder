import React, { useRef, useEffect } from 'react';

// definirea formei proprietatilor primite de canvas
interface GridCanvasProps {
  isDarkMode: boolean;
  placedIcons: { col: number; row: number; type: string }[];
  lines: { type: string, start: {col: number, row: number}, end: {col: number, row: number} }[];
  activeTool: string | null;
  onCanvasClick: (col: number, row: number) => void;
  onLineComplete: (type: string, start: {col: number, row: number}, end: {col: number, row: number}) => void;
  onUpdate: (data: { offsetX: number; offsetY: number; dotSpacing: number }) => void;
}

const GridCanvas: React.FC<GridCanvasProps> = ({ isDarkMode, placedIcons, lines, activeTool, onCanvasClick, onLineComplete, onUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: -100, y: -100 });
  const layoutRef = useRef({ offsetX: 0, offsetY: 0, dotSpacing: 0 });
  
  // folosim ref pentru a nu reseta animatia la fiecare schimbare minora de mouse
  // pastreaza primul punct apasat cand incepi sa desenezi o linie
  const startPointRef = useRef<{col: number, row: number} | null>(null);

  // daca user-ul schimba unealta (din wall in window etc) abandonam linia incompleta
  useEffect(() => {
     if (!activeTool) {
         startPointRef.current = null;
     }
  }, [activeTool]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
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
    }

    resizeCanvas();

    const draw = () => {
      if (!canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      // stergere cadru anterior
      ctx.clearRect(0, 0, w, h);
      
      const cols = 25;
      const rows = 19;
      const padding = Math.min(w, h) * 0.05;

      const availableWidth = w - padding * 2;
      const availableHeight = h - padding * 2;

      // calcul distante dintre puncte si centrarea
      const dotSpacing = Math.min(
        availableWidth / (cols - 1),
        availableHeight / (rows - 1)
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

      const bgColor = isDarkMode ? '#5293DE' : '#C2C9CC';
      const dotColor = isDarkMode ? '#FFFFFF' : '#2C3E50';
      const highlightColor = isDarkMode ? '#2C3E50' : '#00B4D8';

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
        if (Math.hypot(targetX - mousePos.x, targetY - mousePos.y) < highlightDistance) {
          activeX = targetX;
          activeY = targetY;
        }
      }

      // functie auxiliara pentru a desena o linie cu stiluri custom
      const drawCustomLine = (x1: number, y1: number, x2: number, y2: number, type: string, isPreview: boolean = false) => {
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.lineCap = 'round'; // capete rotunjite la linii

          let strokeColor = isDarkMode ? '#FFFFFF' : '#2C3E50';
          let lineWidth = 6;

          // stilizarea fiecarei unelte in parte
          if (type === 'window') { 
              strokeColor = '#00B4D8'; // turcoaz pentru sticla
              lineWidth = 5; 
          }
          else if (type === 'door') { 
              strokeColor = '#F4A300'; // portocaliu/galben pentru usi
              lineWidth = 6; 
          }
          else if (type === 'line') { 
              lineWidth = 2; // linie subtire simpla
          }
          else if (type === 'furniture') { 
              strokeColor = '#A9C4DD'; // culoare terna ptr mobila
              lineWidth = 4; 
          }

          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = lineWidth;
          ctx.globalAlpha = isPreview ? 0.5 : 1; // cand urmareste mouse-ul e semi-transparent
          ctx.stroke();
          ctx.globalAlpha = 1;
      };

      // randam toate peretii/liniile finalizate intai, ca sa ramana pe fundal
      lines.forEach(line => {
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
          const endX = (activeX !== -100) ? activeX : mousePos.x;
          const endY = (activeY !== -100) ? activeY : mousePos.y;
          
          drawCustomLine(x1, y1, endX, endY, activeTool, true);
      }

      // randam grila de puncte
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          // ascundem punctul daca are o iconita pusa pe el
          const hasIcon = placedIcons.some(icon => icon.col === i && icon.row === j);
          if (hasIcon) continue;

          const x = offsetX + i * dotSpacing;
          const y = offsetY + j * dotSpacing;

          const isHovered = (Math.abs(x - activeX) < 0.1 && Math.abs(y - activeY) < 0.1);

          ctx.beginPath();
          ctx.arc(x, y, isHovered ? highlightRadius : baseRadius, 0, Math.PI * 2);
          ctx.fillStyle = isHovered ? highlightColor : dotColor;

          ctx.globalAlpha = isHovered ? 1 : (isDarkMode ? 0.4 : 0.4);
          ctx.fill();
          ctx.globalAlpha = 1;

          if (isHovered) {
            ctx.beginPath();
            ctx.arc(x, y, highlightRadius + (dotSpacing * 0.2), 0, Math.PI * 2);
            ctx.fillStyle = isDarkMode ? 'rgba(44, 62, 80, 0.25)' : 'rgba(0, 180, 216, 0.25)';
            ctx.fill();
          }
        }
      }

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
    
  }, [isDarkMode, placedIcons, lines, activeTool]); // reporneste daca se schimba lista de linii sau unealta
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    mousePosRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseLeave = () => {
    mousePosRef.current = { x: -100, y: -100 };
  };

  // logica de click pe grid, gestioneaza atat plasarea device-urilor cat si desenarea liniilor
  const handleInternalClick = () => {
    const { x, y } = mousePosRef.current;
    const { offsetX, offsetY, dotSpacing } = layoutRef.current;

    const col = Math.round((x - offsetX) / dotSpacing);
    const row = Math.round((y - offsetY) / dotSpacing);
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
             if (startPointRef.current.col !== col || startPointRef.current.row !== row) {
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

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleInternalClick}
      className="absolute inset-0 w-full h-full cursor-crosshair rounded-3xl"
    />
  );
};

export default GridCanvas;