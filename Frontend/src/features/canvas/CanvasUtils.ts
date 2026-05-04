// canvasUtils.ts

const createWindowSVG = (strokeColor: string, isDarkMode: boolean) => {
  // Alegem o culoare de fundal identică cu cea a canvas-ului
  const fillColor = isDarkMode ? '#5293DE' : '#C2C9CC';

  return `
<svg width="73" height="490" viewBox="0 0 73 490" fill="none" 
     preserveAspectRatio="none" 
     xmlns="http://www.w3.org/2000/svg">
  
  <style>
    .window-line { 
      vector-effect: non-scaling-stroke; 
      stroke-width: 6px;
    }
  </style>

  <rect x="2" y="2" width="69" height="486" fill="${fillColor}" />

  <line x1="14" y1="465" x2="58" y2="465" stroke="${strokeColor}" class="window-line" />
  <rect x="12" y="5" width="49" height="480" stroke="${strokeColor}" class="window-line" />
  <rect x="2" y="2" width="69" height="486" stroke="${strokeColor}" class="window-line" />
  <line x1="14" y1="26" x2="58" y2="26" stroke="${strokeColor}" class="window-line" />
  <line x1="36" y1="463" x2="36" y2="28" stroke="${strokeColor}" class="window-line" />
</svg>`;
}








// Creăm instanțele imaginilor
export const windowImgLight = new Image();
export const windowImgDark = new Image();

// Folosim un helper pentru a evita erorile de encoding
const svgToBase64 = (svgString: string) => {
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
};

windowImgLight.src = svgToBase64(createWindowSVG('#000000',false));
windowImgDark.src = svgToBase64(createWindowSVG('#FFFFFF',true));

export const drawWindow = (
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  isPreview: boolean,
  isDarkMode: boolean 
) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);

  const imgToDraw = isDarkMode ? windowImgDark : windowImgLight;

  // Verificăm dacă imaginea s-a încărcat înainte de a încerca să o desenăm
  if (!imgToDraw.complete) return;

  ctx.save();
  ctx.translate(x1, y1);
  ctx.rotate(angle);
  ctx.rotate(Math.PI / 2);

  const windowWidth = 20; 
  ctx.globalAlpha = isPreview ? 0.5 : 1;
  
  // Calculăm o mică marjă de extindere (offset) bazată pe grosimea ferestrei
// Dacă windowWidth e 20, un offset de 10px (jumătate) va acoperi colțul perfect
const offset = windowWidth / 2;

ctx.drawImage(
  imgToDraw, 
  -windowWidth / 2, 
  -distance - offset, // Începe cu "offset" mai sus de punctul de start
  windowWidth, 
  distance + (offset * 2) // Lungimea totală devine distanța + ambele capete
);
  ctx.restore();
};




// Helper pentru conversie sigură SVG -> Base64
const svgToBase64_2 = (svgString: string) => {
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
};

const createDoorSVG = (strokeColor: string, isDarkMode: boolean) => {
  const bgColor = isDarkMode ? '#5293DE' : '#C2C9CC';
  
  const strokeW = 4; 
  const off = 15; 
  const size = 412;
  const end = size - off;

  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <path d="M${off} ${off}V${end}C${off} ${end} ${end} ${end} ${end} 65V${off}H${off}Z" fill="${bgColor}" />

  <g fill="none" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke">
    <path d="M${off} ${off}V${end}" vector-effect="non-scaling-stroke" />
    <path d="M${off} ${off}H${end}" vector-effect="non-scaling-stroke" />
    <path d="M${off} ${end}C${off} ${end} ${end} ${end} ${end} 65" vector-effect="non-scaling-stroke" />
    <path d="M${end} 65V${off}" vector-effect="non-scaling-stroke" />
  </g>
</svg>`.trim();
};

// Instanțiere imagini
export const doorImgLight = new Image();
export const doorImgDark = new Image();

// Încărcare surse
doorImgLight.src = svgToBase64_2(createDoorSVG('#000000', false));
doorImgDark.src = svgToBase64_2(createDoorSVG('#FFFFFF', true));

/**
 * Randare Ușă pe Canvas
 */
export const drawDoor = (
  ctx: CanvasRenderingContext2D,
  x1: number, 
  y1: number, 
  x2: number, 
  y2: number,
  isPreview: boolean,
  isDarkMode: boolean
) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);

  const imgToDraw = isDarkMode ? doorImgDark : doorImgLight;

  if (!imgToDraw.complete) return;

  ctx.save();
  ctx.translate(x1, y1);
  ctx.rotate(angle);
  ctx.imageSmoothingEnabled = false;

  ctx.globalAlpha = isPreview ? 0.5 : 1;
  const doorWidth = 9;

  // --- REGLAJUL DE CENTRARE (OFFSET X) ---
  // Schimbă valoarea asta ca să muți ușa față de punctul de start:
  // - Valoare negativă (ex: -10): ușa se mută spre stânga (peste punct)
  // - Valoare pozitivă (ex: 5): ușa se mută spre dreapta
  const offsetX = -5; // Ajustează valoarea asta până când tocul stă perfect pe punct

  // Parametrii: imagine, x (offsetX), y (-doorWidth / 2), lățime, înălțime
  ctx.drawImage(imgToDraw, offsetX, -doorWidth / 2, distance, distance);

  ctx.restore();
};




const FURNITURE_CONFIG = {
  bed: {
    width: 1029,
    height: 619,
    baseCols: 6, // Câte coloane ocupă la scara 1
    svg: `<svg width="1029" height="619" viewBox="0 0 1029 619" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="210.049" y="4" width="608.435" height="611" rx="30.1989" stroke="#7B8285" stroke-width="8"/>
    <line x1="206.06" y1="207.05" x2="821.633" y2="204.261" stroke="#7B8285" stroke-width="8"/>
    <g filter="url(#filter0_d_205_28)">
    <rect x="7.41992" y="48.4585" width="125.376" height="115.116" rx="13.0994" stroke="#7B8285" stroke-width="8" shape-rendering="crispEdges"/>
    </g>
    <g filter="url(#filter1_d_205_28)">
    <rect x="895.736" y="48.4585" width="125.376" height="115.116" rx="13.0994" stroke="#7B8285" stroke-width="8" shape-rendering="crispEdges"/>
    </g>
    <rect x="210.266" y="206" width="307.485" height="174.109" stroke="#7B8285" stroke-width="8"/>
    <line x1="208.356" y1="380.4" x2="515.577" y2="206.841" stroke="#7B8285" stroke-width="8"/>
    <defs>
    <filter id="filter0_d_205_28" x="3.26633e-05" y="44.4585" width="140.215" height="129.956" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feFlood flood-opacity="0" result="BackgroundImageFix"/>
    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
    <feOffset dy="3.41989"/>
    <feGaussianBlur stdDeviation="1.70994"/>
    <feComposite in2="hardAlpha" operator="out"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_205_28"/>
    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_205_28" result="shape"/>
    </filter>
    <filter id="filter1_d_205_28" x="888.316" y="44.4585" width="140.215" height="129.956" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feFlood flood-opacity="0" result="BackgroundImageFix"/>
    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
    <feOffset dy="3.41989"/>
    <feGaussianBlur stdDeviation="1.70994"/>
    <feComposite in2="hardAlpha" operator="out"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_205_28"/>
    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_205_28" result="shape"/>
    </filter>
    </defs>
    </svg>
    `
  },
  table: {
    width: 744,
    height: 680,
    baseCols: 4,
    svg: `<svg width="744" height="680" viewBox="0 0 744 680" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M148.801 127.636H595.2C615.925 127.636 633.715 147.398 633.715 173.09V506.909C633.715 532.602 615.925 552.364 595.2 552.364H148.801C128.076 552.364 110.286 532.602 110.286 506.909V173.09C110.286 147.398 128.076 127.636 148.801 127.636Z" stroke="#7B8285" stroke-width="8"/>
    <path d="M207.257 4H324.172C333.156 4.00029 341.429 12.6914 341.429 24.7275V68C341.429 80.0361 333.156 88.7273 324.172 88.7275H207.257C198.272 88.7273 190 80.0362 190 68V24.7275C190 12.6914 198.272 4.0002 207.257 4Z" stroke="#7B8285" stroke-width="8"/>
    <path d="M419.828 4H536.743C545.728 4.00029 554 12.6914 554 24.7275V68C554 80.0361 545.728 88.7273 536.743 88.7275H419.828C410.844 88.7273 402.571 80.0362 402.571 68V24.7275C402.571 12.6914 410.844 4.0002 419.828 4Z" stroke="#7B8285" stroke-width="8"/>
    <path d="M207.257 591.273H324.172C333.156 591.273 341.429 599.964 341.429 612V655.273C341.429 667.309 333.156 676 324.172 676H207.257C198.272 676 190 667.309 190 655.273V612C190 599.964 198.272 591.273 207.257 591.273Z" stroke="#7B8285" stroke-width="8"/>
    <path d="M419.828 591.273H536.743C545.728 591.273 554 599.964 554 612V655.273C554 667.309 545.728 676 536.743 676H419.828C410.844 676 402.571 667.309 402.571 655.273V612C402.571 599.964 410.844 591.273 419.828 591.273Z" stroke="#7B8285" stroke-width="8"/>
    <path d="M21.2568 251.273H58.457C67.4417 251.273 75.7139 259.964 75.7139 272V408C75.7137 420.036 67.4416 428.727 58.457 428.727H21.2568C12.2723 428.727 4.00013 420.036 4 408V272C4 259.964 12.2723 251.273 21.2568 251.273Z" stroke="#7B8285" stroke-width="8"/>
    <path d="M685.543 251.273H722.743C731.728 251.273 740 259.964 740 272V408C740 420.036 731.728 428.727 722.743 428.727H685.543C676.558 428.727 668.286 420.036 668.286 408V272C668.286 259.964 676.558 251.273 685.543 251.273Z" stroke="#7B8285" stroke-width="8"/>
    </svg>
    `
  },
  couch: {
    width: 553,
    height: 925,
    baseCols: 4,
    svg: `<svg width="553" height="925" viewBox="0 0 553 925" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_d_206_88)">
    <path d="M244.709 17.5H63.7455C52.9408 17.5 44.1819 24.6634 44.1819 33.5V181.5C44.1819 190.337 52.9408 197.5 63.7455 197.5H244.709C255.514 197.5 264.273 190.337 264.273 181.5V33.5C264.273 24.6634 255.514 17.5 244.709 17.5Z" stroke="#7B8285" stroke-width="7"/>
    <path d="M44.1819 37.5H264.273" stroke="#7B8285" stroke-width="7"/>
    <path d="M80.8638 17.5V197.5M227.591 17.5V197.5" stroke="#7B8285" stroke-width="7"/>
    <path d="M296.064 573.5H12.3909C9.68973 573.5 7.5 571.709 7.5 569.5V337.5C7.5 335.291 9.68973 333.5 12.3909 333.5H296.064C298.765 333.5 300.955 335.291 300.955 337.5V569.5C300.955 571.709 298.765 573.5 296.064 573.5Z" stroke="#7B8285" stroke-width="7"/>
    <path d="M521.045 673.5H398.773C385.267 673.5 374.318 664.546 374.318 653.5V253.5C374.318 242.454 385.267 233.5 398.773 233.5H521.045C534.551 233.5 545.5 242.454 545.5 253.5V653.5C545.5 664.546 534.551 673.5 521.045 673.5Z" stroke="#7B8285" stroke-width="7"/>
    <path d="M374.318 527.5H545.5" stroke="#7B8285" stroke-width="7"/>
    <path d="M374.318 381.5H545.5" stroke="#7B8285" stroke-width="7"/>
    <path d="M521.045 673.5V233.5" stroke="#7B8285" stroke-width="7"/>
    <path d="M244.709 913.5H63.7455C52.9408 913.5 44.1819 906.337 44.1819 897.5V749.5C44.1819 740.663 52.9408 733.5 63.7455 733.5H244.709C255.514 733.5 264.273 740.663 264.273 749.5V897.5C264.273 906.337 255.514 913.5 244.709 913.5Z" stroke="#7B8285" stroke-width="7"/>
    <path d="M44.1819 893.5H264.273" stroke="#7B8285" stroke-width="7"/>
    <path d="M80.8638 913.5V733.5M227.591 913.5V733.5" stroke="#7B8285" stroke-width="7"/>
    <path d="M533.273 903.5H386.545V783.5H533.273V903.5Z" stroke="#7B8285" stroke-width="7"/>
    <path d="M533.273 123.5H386.545V3.5H533.273V123.5Z" stroke="#7B8285" stroke-width="7"/>
    <path d="M459.909 783.5V673.5" stroke="#7B8285" stroke-width="7"/>
    <path d="M459.909 233.5V123.5" stroke="#7B8285" stroke-width="7"/>
    </g>
    <defs>
    <filter id="filter0_d_206_88" x="0" y="0" width="553" height="925" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feFlood flood-opacity="0" result="BackgroundImageFix"/>
    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
    <feOffset dy="4"/>
    <feGaussianBlur stdDeviation="2"/>
    <feComposite in2="hardAlpha" operator="out"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_206_88"/>
    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_206_88" result="shape"/>
    </filter>
    </defs>
    </svg>
    `
  }
};


// Cache pentru imagini ca să nu le regenerăm la fiecare cadru de animație
const imageCache: Record<string, HTMLImageElement> = {};

/**
 * Returnează lățimea și înălțimea în unități de grid (cols/rows)
 */
export const getFurnitureDimensions = (type: string, scale: number, rotation: number) => {
  // Extragem numele curat (ex: din "furniture_bed" luăm "bed")
  const cleanType = type.includes('_') ? type.split('_')[1] : type;

  const baseDims: Record<string, {w: number, h: number}> = {
    'bed': { w: 4, h: 3 },
    'table': { w: 3, h: 3 },
    'couch': { w: 2, h: 4 }
  };

  const dim = baseDims[cleanType] || { w: 2, h: 2 };
  
  // Aspect ratio păstrat: calculăm în funcție de bază și scală
  let w = Math.round(dim.w * scale);
  let h = Math.round(dim.h * scale);

  return (rotation % 180 === 0) ? { w, h } : { w: h, h: w };
};
export const getFurnitureImage = (
  type: string, 
  isDarkMode: boolean, 
  shouldFill: boolean = false
): HTMLImageElement => {
  const cleanKey = type.replace('furniture_', '');
  const cacheKey = `${cleanKey}_${isDarkMode}_${shouldFill}`;
  
  if (imageCache[cacheKey]) return imageCache[cacheKey];

  const config = FURNITURE_CONFIG[cleanKey as keyof typeof FURNITURE_CONFIG];
  if (!config) return new Image();

  const strokeColor = isDarkMode ? '#FFFFFF' : '#000000';
  const canvasBgColor = isDarkMode ? '#5293DE' : '#C2C9CC'; 
  
  // Scădem stroke-ul pentru că SVG-ul devine "mai mic" ca scară
  const strokeWidth = "4"; 

  let svgContent = config.svg
  .replace('<svg', '<svg style="overflow: visible;" '); // ADAUGĂ ASTA

const styleTag = `
  <style>
    * { 
      stroke: ${strokeColor} !important; 
      stroke-width: ${strokeWidth} !important; 
      /* Această proprietate asigură că linia nu se scalează ciudat */
      vector-effect: non-scaling-stroke; 
      ${shouldFill ? `fill: ${canvasBgColor} !important;` : 'fill: none !important;'}
      
      /* Rotunjim colțurile și capetele liniilor ca să nu pară retezate */
      stroke-linecap: round !important;
      stroke-linejoin: round !important;
    }
  </style>`;

  svgContent = svgContent.replace(/>/, `>${styleTag}`);

  const img = new Image();
  // Folosim charset utf-8, e mai safe pentru SVG-uri clare
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
  
  imageCache[cacheKey] = img;
  return img;
};