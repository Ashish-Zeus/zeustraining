/**
 * AutoScroller – smoother, faster, full‑window drag auto‑scroll.
 */
export class AutoScroller {
    constructor(wrapper, 
    /**Always‑current pointer position (clientX, clientY) */
    getPt) {
        this.wrapper = wrapper;
        this.getPt = getPt;
        this.raf = 0;
    }
    start() {
        if (this.raf)
            return;
        const step = () => {
            const v = this.edgeSpeed(this.getPt());
            if (v.dx || v.dy)
                this.wrapper.scrollBy(v.dx, v.dy);
            this.raf = requestAnimationFrame(step);
        };
        this.raf = requestAnimationFrame(step);
    }
    stop() {
        if (this.raf)
            cancelAnimationFrame(this.raf);
        this.raf = 0;
    }
    /**Return px/frame scroll speed based on pointer proximity to *inner* edges.*/
    edgeSpeed(p) {
        const r = this.wrapper.getBoundingClientRect();
        const zone = 80; // px inside each edge
        const maxPerSec = 1200; // px/sec if pointer is hard against the edge
        const perFrame = maxPerSec / 60; // assume ≈60 fps
        const lin = (d) => Math.min(perFrame, (perFrame * d) / zone);
        /* ------------ horizontal (left / right) ------------ */
        const dx = p.x < r.left + zone
            ? -lin(r.left + zone - p.x) /* scroll left  */
            : p.x > r.right - zone
                ? lin(p.x - (r.right - zone)) /* scroll right */
                : 0;
        /* ------------ vertical (top / bottom) -------------- */
        const dy = p.y < r.top + zone
            ? -lin(r.top + zone - p.y) /* scroll up    */
            : p.y > r.bottom - zone
                ? lin(p.y - (r.bottom - zone)) /* scroll down  */
                : 0;
        return { dx, dy };
    }
}
