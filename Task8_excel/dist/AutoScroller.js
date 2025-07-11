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
        this.lockAxis = "both";
    }
    // start(): void {
    //     if (this.raf) return;
    //     const step = () => {
    //         const v = this.edgeSpeed(this.getPt());
    //         if (v.dx || v.dy) this.wrapper.scrollBy(v.dx, v.dy);
    //         this.raf = requestAnimationFrame(step);
    //     };
    //     this.raf = requestAnimationFrame(step);
    // }
    start(lockAxis = "both") {
        this.lockAxis = lockAxis;
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
    /**
     *
     * @param p
     * @returns
     */
    // private edgeSpeed(p: { x: number; y: number }): { dx: number; dy: number } {
    //     const r = this.wrapper.getBoundingClientRect();
    //     const zone = 80;              // px inside each edge
    //     const maxPerSec = 1200;       // px/sec if pointer is hard against the edge
    //     const perFrame = maxPerSec / 60;     // assume ≈60 fps
    //     const lin = (d: number) => Math.min(perFrame, (perFrame * d) / zone);
    //     /* ------------ horizontal (left / right) ------------ */
    //     const dx =
    //         p.x < r.left + zone
    //             ? -lin(r.left + zone - p.x)                   /* scroll left  */
    //             : p.x > r.right - zone
    //                 ? lin(p.x - (r.right - zone))                /* scroll right */
    //                 : 0;
    //     /* ------------ vertical (top / bottom) -------------- */
    //     const dy =
    //         p.y < r.top + zone
    //             ? -lin(r.top + zone - p.y)                    /* scroll up    */
    //             : p.y > r.bottom - zone
    //                 ? lin(p.y - (r.bottom - zone))               /* scroll down  */
    //                 : 0;
    //     return { dx, dy };
    // }
    edgeSpeed(p) {
        const r = this.wrapper.getBoundingClientRect();
        const zone = 80;
        const maxPerSec = 1200;
        const perFrame = maxPerSec / 60;
        const lin = (d) => Math.min(perFrame, (perFrame * d) / zone);
        let dx = 0, dy = 0;
        if (this.lockAxis === "both" || this.lockAxis === "x") {
            dx =
                p.x < r.left + zone
                    ? -lin(r.left + zone - p.x)
                    : p.x > r.right - zone
                        ? lin(p.x - (r.right - zone))
                        : 0;
        }
        if (this.lockAxis === "both" || this.lockAxis === "y") {
            dy =
                p.y < r.top + zone
                    ? -lin(r.top + zone - p.y)
                    : p.y > r.bottom - zone
                        ? lin(p.y - (r.bottom - zone))
                        : 0;
        }
        return { dx, dy };
    }
}
