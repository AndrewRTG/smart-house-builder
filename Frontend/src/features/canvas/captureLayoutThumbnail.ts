// Thumbnail capture strategy:
// 1. Grab the <canvas> element (has the grid + walls + furniture already drawn).
// 2. Draw a colored bullet + label for each placed device on top.
//
// We deliberately do NOT use html2canvas: it walks the entire React tree,
// re-renders every SVG, and trips on modern CSS (oklch, color-mix). On a
// dense layout it blocks the main thread for seconds — which is what was
// freezing the Post action.
//
// Output: JPEG ~150-300KB at high quality.

const MAX_WIDTH_PX = 1200;
const JPEG_QUALITY = 0.92;

interface PlacedIconLite {
    col: number;
    row: number;
    type: string;
    name?: string;
    scale?: number;
    rotation?: number;
}

interface LayoutInfo {
    offsetX: number;
    offsetY: number;
    dotSpacing: number;
}

// Per-type colors so devices stand out visually in the thumbnail.
const TYPE_COLORS: Record<string, string> = {
    bec: '#facc15',          // yellow
    senzor: '#a855f7',       // purple
    lock: '#ef4444',         // red
    router: '#3b82f6',       // blue
    controller: '#0ea5e9',   // cyan
    tv: '#1e293b',           // dark slate
    interfon: '#6366f1',     // indigo
    prelungitor: '#f97316',  // orange
    soundsystem: '#ec4899',  // pink
    priza: '#64748b',        // gray
    aspirator: '#14b8a6',    // teal
    hub: '#10b981',          // green
};

export async function captureLayoutThumbnailRoot(
    el: HTMLElement | null,
    placedIcons?: PlacedIconLite[],
    layout?: LayoutInfo
): Promise<string | null> {
    if (!el) return null;
    const sourceCanvas = el.querySelector('canvas') as HTMLCanvasElement | null;
    if (!sourceCanvas || sourceCanvas.width < 1 || sourceCanvas.height < 1) return null;

    try {
        const w = sourceCanvas.width;
        const h = sourceCanvas.height;

        // Output canvas at original or downscaled size.
        const tw = Math.min(w, MAX_WIDTH_PX);
        const th = Math.round(h * (tw / w));
        const scaleFactor = tw / w;

        const out = document.createElement('canvas');
        out.width = tw;
        out.height = th;
        const ctx = out.getContext('2d');
        if (!ctx) return null;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Step 1: draw the source canvas (walls + furniture + grid).
        ctx.drawImage(sourceCanvas, 0, 0, tw, th);

        // Step 2: draw a marker for each placed device on top.
        if (placedIcons?.length && layout && layout.dotSpacing > 0) {
            const dotSpacing = layout.dotSpacing * scaleFactor;
            const offsetX = layout.offsetX * scaleFactor;
            const offsetY = layout.offsetY * scaleFactor;
            // Radius scales with grid density so markers stay legible.
            const baseRadius = Math.max(8, dotSpacing * 0.45);

            for (const icon of placedIcons) {
                const x = offsetX + icon.col * dotSpacing;
                const y = offsetY + icon.row * dotSpacing;
                const r = baseRadius * (icon.scale || 1);
                const color = TYPE_COLORS[icon.type] || '#5092ce';

                // Outer ring for contrast against any background.
                ctx.beginPath();
                ctx.arc(x, y, r + 2, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255,255,255,0.95)';
                ctx.fill();

                // Colored bullet.
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();

                // First letter of type as label.
                ctx.font = `bold ${Math.max(10, r * 0.9)}px sans-serif`;
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText((icon.type || '?').charAt(0).toUpperCase(), x, y);
            }
        }

        return out.toDataURL('image/jpeg', JPEG_QUALITY).split(',')[1] ?? null;
    } catch (err) {
        console.warn('Thumbnail capture failed:', err);
        return null;
    }
}
