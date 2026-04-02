import React, { useRef, useEffect } from 'react';

// preia proprietatea de tema pentru a sti cand sa schimbe culorile interiorului
interface GridCanvasProps {
  isDarkMode: boolean;
}

const GridCanvas: React.FC<GridCanvasProps> = ({ isDarkMode }) => {
  // referinta catre elementul html de tip canvas unde desenam
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // FIX BUG #1: mousePos e acum un ref in loc de state
  // Asta previne re-montarea intregului useEffect la fiecare miscare de mouse
  const mousePosRef = useRef<{ x: number; y: number }>({ x: -100, y: -100 });

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

        // protectie impotriva flash-ului: aplicam setarile de marime doar daca containerul parinte chiar s-a marit/micsorat
        if (rect.width !== currentWidth || rect.height !== currentHeight) {
          currentWidth = rect.width;
          currentHeight = rect.height;

          // dpr e pentru ecrane de telefon sau high resolution - face elementele de 2x mai clare
          const dpr = window.devicePixelRatio || 1;

          canvas.width = rect.width * dpr;
          canvas.height = rect.height * dpr;

          canvas.style.width = `${rect.width}px`;
          canvas.style.height = `${rect.height}px`;

          // FIX BUG #2: resetam transformul inainte de scale
          // Fara acest reset, ctx.scale se acumula la fiecare resize (2x -> 4x -> 8x...)
          // si gridul ajungea sa se deseneze complet in afara canvas-ului
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.scale(dpr, dpr);
        }
      }
    };

    // se apeleaza prima oara inainte sa incepem desenul
    resizeCanvas();

    // functia principala, ruleaza in loop la infinit de 60 de ori pe secunda
    const draw = () => {
      if (!canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      // curata cadrul precedent pentru a nu ramane "urme" pe ecran
      ctx.clearRect(0, 0, w, h);

      // setarea fixa de randuri si coloane din specificatie
      const cols = 24;
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

      // raze dinamice de desen pentru punctul default si raza lui de evidentiere cand stam pe el
      const baseRadius = Math.max(1.8, dotSpacing * 0.05);
      const highlightRadius = baseRadius * 3;
      const highlightDistance = dotSpacing * 0.6;

      // extragerea culorilor corecte in functie de switch
      const bgColor = isDarkMode ? '#2D4E6C' : '#C2C9CC';
      const dotColor = isDarkMode ? '#FFFFFF' : '#2C3E50';
      const highlightColor = '#00B4D8';

      // umplem backgroudul cu culoarea de baza
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);

      // FIX BUG #1 (continuare): citim pozitia din ref in loc de state
      // Ref-ul e intotdeauna actual fara sa declanseze re-render sau re-mount
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
            ctx.fillStyle = 'rgba(0, 180, 216, 0.25)';
            ctx.fill();
          }
        }
      }

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
  // FIX BUG #1 (continuare): mousePos a fost eliminat din dependency array
  // useEffect-ul se re-ruleaza acum doar cand se schimba tema, nu la fiecare pixel de mouse
  }, [isDarkMode]);

  // FIX BUG #1 (continuare): scriem direct in ref, fara setState
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

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="absolute inset-0 w-full h-full cursor-crosshair rounded-3xl"
    />
  );
};

export default GridCanvas;