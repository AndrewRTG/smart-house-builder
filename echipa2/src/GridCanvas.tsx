import React, { useRef, useEffect } from 'react';





interface GridCanvasProps {
  isDarkMode: boolean;
  placedIcons: { col: number; row: number; type: string }[];
  onCanvasClick: (col: number, row: number) => void;
  onUpdate: (data: { offsetX: number; offsetY: number; dotSpacing: number }) => void;
}

const GridCanvas: React.FC<GridCanvasProps> = ({ isDarkMode, placedIcons, onCanvasClick, onUpdate }) => {
  // referinta catre elementul html de tip canvas unde desenam
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: -100, y: -100 });
  const layoutRef = useRef({ offsetX: 0, offsetY: 0, dotSpacing: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ctx este utilitarul care ne ofera metodele sa tragem linii si sa facem cercuri (2d)
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let currentWidth = 0;
    let currentHeight = 0;

    // functie care calculeaza dinamic marimea ecranului pentru a preveni desenare in afara
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const rect = parent.getBoundingClientRect();

       
        if (rect.width !== currentWidth || rect.height !== currentHeight) {
          currentWidth = rect.width;
          currentHeight = rect.height;

          // dpr e pentru ecrane de telefon sau high resolution - face elementele de 2x mai clare
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

    // se apeleaza prima oara inainte sa incepem desenul
    resizeCanvas();

    // functia principala, ruleaza in loop la infinit de 60 de ori pe secunda
    const draw = () => {
      if (!canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      // curata cadrul precedent 
      ctx.clearRect(0, 0, w, h);

      
      const cols = 25;
      const rows = 19;

      // margine de 5% dinamica sa nu se lipeasca gridul de bordura peretilor
      const padding = Math.min(w, h) * 0.05;

      const availableWidth = w - padding * 2;
      const availableHeight = h - padding * 2;

      // matematica ce calculeaza departarea corecta pentru ca patratele sa ramana simetrice 1:1
      const dotSpacing = Math.min(
        availableWidth / (cols - 1),
        availableHeight / (rows - 1)
      );

      // calculul centrului ferestrei pt amplasarea gridului
      const gridWidth = dotSpacing * (cols - 1);
      const gridHeight = dotSpacing * (rows - 1);
      const offsetX = (w - gridWidth) / 2;
      const offsetY = (h - gridHeight) / 2;

      if (
        Math.abs(layoutRef.current.offsetX - offsetX) > 0.1 ||
        Math.abs(layoutRef.current.offsetY - offsetY) > 0.1 ||
        Math.abs(layoutRef.current.dotSpacing - dotSpacing) > 0.1
      ) {
        const newLayout = { offsetX, offsetY, dotSpacing };
        layoutRef.current = newLayout;
        // Folosim un mic delay sau requestAnimationFrame pentru a scoate apelul din ciclul de randare curent
        setTimeout(() => onUpdate(newLayout), 0);
      }

      // raze dinamice de desen pentru punctul default si raza lui de evidentiere cand stam pe el
      const baseRadius = Math.max(1.8, dotSpacing * 0.05);
      const highlightRadius = baseRadius * 3;
      const highlightDistance = dotSpacing * 0.6;

      // extragerea culorilor corecte in functie de switch
      const bgColor = isDarkMode ? '#5293DE' : '#C2C9CC';
      const dotColor = isDarkMode ? '#FFFFFF' : '#2C3E50';
      const highlightColor = isDarkMode ? '#2C3E50' : '#00B4D8';

      // umplem backgroudul cu culoarea de baza
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);

     
      const mousePos = mousePosRef.current;

      // algoritm sa gasim direct coordonata matematica cel mai aproape de cursorul mouse-ului
      const hoverI = Math.round((mousePos.x - offsetX) / dotSpacing);
      const hoverJ = Math.round((mousePos.y - offsetY) / dotSpacing);

      let activeX = -100;
      let activeY = -100;

      // ne asiguram ca ne aflam in plaja grid-ului vizibil si nu in afara lui (marginea canvas-ului)
      if (hoverI >= 0 && hoverI < cols && hoverJ >= 0 && hoverJ < rows) {
        const targetX = offsetX + hoverI * dotSpacing;
        const targetY = offsetY + hoverJ * dotSpacing;

        // distanta matematica sa detectam daca mouse-ul e in raza ceruta sa devina turcoaz
        if (Math.hypot(targetX - mousePos.x, targetY - mousePos.y) < highlightDistance) {
          activeX = targetX;
          activeY = targetY;
        }
      }

      // motorul vizual - randam fiecare punct pe baza calculelor geometrice de deasupra
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {

          // Verific daca este icpn
          const hasIcon = placedIcons.some(icon => icon.col === i && icon.row === j);
          if (hasIcon) continue;
          const x = offsetX + i * dotSpacing;
          const y = offsetY + j * dotSpacing;

          // conditie care verifica exact punctul unic selectat de user
          const isHovered = (Math.abs(x - activeX) < 0.1 && Math.abs(y - activeY) < 0.1);

          ctx.beginPath();
          ctx.arc(x, y, isHovered ? highlightRadius : baseRadius, 0, Math.PI * 2);
          ctx.fillStyle = isHovered ? highlightColor : dotColor;

          // punctele stau la o transparenta scazuta decat atunci cand au mouse-ul pe ele
          ctx.globalAlpha = isHovered ? 1 : (isDarkMode ? 0.4 : 0.4);
          ctx.fill();
          ctx.globalAlpha = 1;

          // zona de "glow/aura" a punctului peste care stam
          if (isHovered) {
            ctx.beginPath();
            ctx.arc(x, y, highlightRadius + (dotSpacing * 0.2), 0, Math.PI * 2);
            ctx.fillStyle = isDarkMode ? 'rgba(44, 62, 80, 0.25)' : 'rgba(0, 180, 216, 0.25)';
            ctx.fill();
          }
        }
      }

      linesRef.current.forEach(line => {
      drawLine(ctx, line.x1, line.y1, line.x2, line.y2);
      });

      // apelam din nou functia sa pregatim urmatorul cadru (frame)
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    // tehnica de debounce: asteapta 50ms inainte sa traga de ecran, face ca animatia sa curga fin cand dam maximize
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        resizeCanvas();
      }, 50);
    });

    // incepe urmarirea redimensionarii panoului div
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    // actiune de curatare - cand componenta dispare de pe ecran, oprim timeout-ul si canvas ul
    return () => {
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
    
    // useEffect-ul se re-ruleaza acum doar cand se schimba tema, nu la fiecare pixel de mouse
  }, [isDarkMode, placedIcons]);

  
  // Asta nu declanseaza niciun re-render, dar draw() va citi intotdeauna valoarea actuala
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    mousePosRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  // aruncam mouse-ul cand iesim din zona desenata - ca sa se stinga efectul
  const handleMouseLeave = () => {
    mousePosRef.current = { x: -100, y: -100 };
  };

  // detecteaza pe ce punct sunt si trimite catre App.tsx
  const handleInternalClick = () => {
    const { x, y } = mousePosRef.current;
    const { offsetX, offsetY, dotSpacing } = layoutRef.current;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    //onClickWithWall({x, y});
    //drawLine(ctx, 0, 0, 500, 500);
    handleWallClick

    const col = Math.round((x - offsetX) / dotSpacing);
    const row = Math.round((y - offsetY) / dotSpacing);

    // verificare daca clickul este langa un punct de pe grid
    const targetX = offsetX + col * dotSpacing;
    

    if (Math.hypot(targetX - x, (offsetY + row * dotSpacing) - y) < dotSpacing * 0.5) {
      onCanvasClick(col, row);
    }
  };

  // daca se da click pe un punct de pe grid dupa ce selectam perete din bara de jos
  

  const drawLine = (
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) => {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = isDarkMode ? '#FFFFFF' : '#000000';
  ctx.lineWidth = 2;
  ctx.stroke();
};

const toCanvasCoords = (col: number, row: number) => {
  const { offsetX, offsetY, dotSpacing } = layoutRef.current;

  return {
    x: offsetX + col * dotSpacing,
    y: offsetY + row * dotSpacing,
  };
};


const handleWallClick = () => {
  const { x, y } = mousePosRef.current;
  const { offsetX, offsetY, dotSpacing } = layoutRef.current;

  const col = Math.round((x - offsetX) / dotSpacing);
  const row = Math.round((y - offsetY) / dotSpacing);

  const targetX = offsetX + col * dotSpacing;
  const targetY = offsetY + row * dotSpacing;

  if (Math.hypot(targetX - x, targetY - y) < dotSpacing * 0.5) {
    const firstPointRef = useRef<{ col: number; row: number } | null>(null);
    if (!firstPointRef.current) {
      // first click
      firstPointRef.current = { col, row };
    } else {
      // second click → draw line
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;

      const p1 = toCanvasCoords(firstPointRef.current.col, firstPointRef.current.row);
      const p2 = toCanvasCoords(col, row);

      //drawLine(ctx, p1.x, p1.y, p2.x, p2.y);

      linesRef.current.push({
      x1: p1.x,
      y1: p1.y,
      x2: p2.x,
      y2: p2.y,
      });

      firstPointRef.current = null;
    }
  }
};
const linesRef = useRef<
  { x1: number; y1: number; x2: number; y2: number }[]
>([]);

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