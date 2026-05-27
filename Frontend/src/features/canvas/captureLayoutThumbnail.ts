// Thumbnail capture strategy:
// 1. Grab the <canvas> element (has the grid + walls + furniture already drawn).
// 2. For each placed device, find its live SVG element in the DOM via the
//    data-placed-icon attribute, rasterize it through a data: URL image, and
//    draw the result at the correct position / scale / rotation.
//
// We deliberately do NOT use html2canvas — it re-renders the whole React tree,
// trips on modern CSS (oklch, color-mix), and freezes the main thread on dense
// layouts. Per-SVG rasterization through Image() is targeted and fast.

const MAX_WIDTH_PX = 1200;
const JPEG_QUALITY = 0.92;

// Output is letter-boxed to this aspect ratio so every card in My Setups looks
// the same regardless of how square or wide the user's room is. 16:9 matches
// the article-card image area and the community feed cards, so a published
// setup blends in next to articles instead of being a random rectangle.
const OUTPUT_ASPECT = 16 / 9;
const LETTERBOX_COLOR = '#f3f4f8';

interface PlacedIconLite {
    id?: string;
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

const TYPE_COLORS: Record<string, string> = {
    bec: '#facc15',
    senzor: '#a855f7',
    lock: '#ef4444',
    router: '#3b82f6',
    controller: '#0ea5e9',
    tv: '#1e293b',
    interfon: '#6366f1',
    prelungitor: '#f97316',
    soundsystem: '#ec4899',
    priza: '#64748b',
    aspirator: '#14b8a6',
    hub: '#10b981',
};

// Take a live <svg> element, force its size attributes, and load it through an
// <img> so we can drawImage it onto the output canvas. Returns null if the SVG
// fails to rasterize (e.g. external resource refs the browser refused).
async function rasterizeSvg(svgEl: SVGSVGElement, sizePx: number): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
        try {
            const clone = svgEl.cloneNode(true) as SVGSVGElement;
            if (!clone.getAttribute('xmlns')) clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            clone.setAttribute('width', String(sizePx));
            clone.setAttribute('height', String(sizePx));
            // Strip styling that referenced parent CSS variables which won't
            // resolve inside the standalone SVG document we're about to load.
            clone.removeAttribute('style');
            const xml = new XMLSerializer().serializeToString(clone);
            const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = url;
        } catch {
            resolve(null);
        }
    });
}

export async function captureLayoutThumbnailRoot(
    el: HTMLElement | null,
    placedIcons?: PlacedIconLite[],
    layout?: LayoutInfo
): Promise<string | null> {
    if (!el) return null;
    const sourceCanvas = el.querySelector('canvas') as HTMLCanvasElement | null;
    if (!sourceCanvas || sourceCanvas.width < 1 || sourceCanvas.height < 1) return null;

    try {
        const sw = sourceCanvas.width;
        const sh = sourceCanvas.height;

        // Pick output dimensions: 16:9 letterbox, capped at MAX_WIDTH_PX.
        const tw = Math.min(MAX_WIDTH_PX, Math.max(sw, 800));
        const th = Math.round(tw / OUTPUT_ASPECT);

        // Fit the source canvas inside the letterbox preserving aspect ratio.
        const srcAspect = sw / sh;
        let drawW: number;
        let drawH: number;
        if (srcAspect > OUTPUT_ASPECT) {
            drawW = tw;
            drawH = Math.round(tw / srcAspect);
        } else {
            drawH = th;
            drawW = Math.round(th * srcAspect);
        }
        const offX = Math.round((tw - drawW) / 2);
        const offY = Math.round((th - drawH) / 2);

        const out = document.createElement('canvas');
        out.width = tw;
        out.height = th;
        const ctx = out.getContext('2d');
        if (!ctx) return null;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Letterbox background so the card doesn't show transparent gaps
        // around odd-shaped layouts.
        ctx.fillStyle = LETTERBOX_COLOR;
        ctx.fillRect(0, 0, tw, th);

        // Step 1: draw the source canvas (walls + furniture + grid).
        ctx.drawImage(sourceCanvas, offX, offY, drawW, drawH);

        // Step 2: draw the real device icons by rasterizing their live SVG.
        //
        // Measure each icon's position from the DOM (its bounding rect
        // relative to the source canvas) instead of recomputing from
        // layout.offsetX + col*dotSpacing. The layout numbers are in CSS
        // pixels, while sourceCanvas.width/height is the drawing-buffer size
        // (often 2x CSS on retina displays). Mixing the two — which the old
        // code did — pulled icons off the wall by exactly the devicePixelRatio
        // factor.
        if (placedIcons?.length) {
            const canvasRect = sourceCanvas.getBoundingClientRect();
            // Fall back to drawing-buffer dimensions when the DOM rect is
            // unavailable (jsdom test environment, detached element). Real
            // browsers use the live CSS rect so retina dpr scaling stays right.
            const cssToOutX = canvasRect.width > 0 ? drawW / canvasRect.width : drawW / sw;
            const cssToOutY = canvasRect.height > 0 ? drawH / canvasRect.height : drawH / sh;

            for (const icon of placedIcons) {
                let cx: number;
                let cy: number;
                let sizeOnOutput: number;
                let svgEl: SVGSVGElement | null = null;

                if (icon.id) {
                    const iconDiv = el.querySelector(
                        `[data-placed-icon="${CSS.escape(String(icon.id))}"]`
                    ) as HTMLElement | null;
                    if (iconDiv) {
                        const iconRect = iconDiv.getBoundingClientRect();
                        // Center of icon relative to the source canvas, in CSS px.
                        const iconCxCss = (iconRect.left + iconRect.width / 2) - canvasRect.left;
                        const iconCyCss = (iconRect.top + iconRect.height / 2) - canvasRect.top;
                        cx = offX + iconCxCss * cssToOutX;
                        cy = offY + iconCyCss * cssToOutY;
                        // offsetWidth/Height ignore the CSS rotate(), so we
                        // get the unrotated square size of the icon container.
                        const unrotatedSizeCss = iconDiv.offsetWidth || iconRect.width;
                        sizeOnOutput = Math.max(16, unrotatedSizeCss * cssToOutX);
                        svgEl = iconDiv.querySelector('svg');
                    } else if (layout && layout.dotSpacing > 0) {
                        // Fallback to layout-based math if the DOM lookup
                        // failed (icon removed mid-capture, headless test).
                        const dotSpacing = layout.dotSpacing * cssToOutX;
                        cx = offX + layout.offsetX * cssToOutX + icon.col * dotSpacing;
                        cy = offY + layout.offsetY * cssToOutY + icon.row * dotSpacing;
                        sizeOnOutput = Math.max(16, dotSpacing * (icon.scale || 1));
                    } else {
                        continue;
                    }
                } else if (layout && layout.dotSpacing > 0) {
                    const dotSpacing = layout.dotSpacing * cssToOutX;
                    cx = offX + layout.offsetX * cssToOutX + icon.col * dotSpacing;
                    cy = offY + layout.offsetY * cssToOutY + icon.row * dotSpacing;
                    sizeOnOutput = Math.max(16, dotSpacing * (icon.scale || 1));
                } else {
                    continue;
                }

                let drewSvg = false;
                if (svgEl) {
                    const img = await rasterizeSvg(svgEl, Math.round(sizeOnOutput * 2));
                    if (img) {
                        ctx.save();
                        ctx.translate(cx, cy);
                        if (icon.rotation) ctx.rotate((icon.rotation * Math.PI) / 180);
                        ctx.drawImage(img, -sizeOnOutput / 2, -sizeOnOutput / 2, sizeOnOutput, sizeOnOutput);
                        ctx.restore();
                        drewSvg = true;
                    }
                }

                if (!drewSvg) {
                    const r = Math.max(8, sizeOnOutput * 0.45);
                    const color = TYPE_COLORS[icon.type] || '#5092ce';
                    ctx.beginPath();
                    ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(255,255,255,0.95)';
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(cx, cy, r, 0, Math.PI * 2);
                    ctx.fillStyle = color;
                    ctx.fill();
                    ctx.font = `bold ${Math.max(10, r * 0.9)}px sans-serif`;
                    ctx.fillStyle = '#fff';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText((icon.type || '?').charAt(0).toUpperCase(), cx, cy);
                }
            }
        }

        return out.toDataURL('image/jpeg', JPEG_QUALITY).split(',')[1] ?? null;
    } catch (err) {
        console.warn('Thumbnail capture failed:', err);
        return null;
    }
}
