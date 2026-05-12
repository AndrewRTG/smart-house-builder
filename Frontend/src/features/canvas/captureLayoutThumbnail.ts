const MAX_WIDTH_PX = 960;

export async function captureLayoutThumbnailRoot(el: HTMLElement | null): Promise<string | null> {
    if (!el) return null;
    const canvas = el.querySelector('canvas');
    if (!canvas || canvas.width < 1 || canvas.height < 1) return null;

    try {
        const w = canvas.width;
        const h = canvas.height;
        if (w <= MAX_WIDTH_PX) {
            const dataUrl = canvas.toDataURL('image/png');
            return dataUrl.split(',')[1] ?? null;
        }
        const tw = MAX_WIDTH_PX;
        const th = Math.round(h * (MAX_WIDTH_PX / w));
        const c2 = document.createElement('canvas');
        c2.width = tw;
        c2.height = th;
        const ctx = c2.getContext('2d');
        if (!ctx) {
            const dataUrl = canvas.toDataURL('image/png');
            return dataUrl.split(',')[1] ?? null;
        }
        ctx.drawImage(canvas, 0, 0, tw, th);
        return c2.toDataURL('image/png').split(',')[1] ?? null;
    } catch {
        return null;
    }
}
