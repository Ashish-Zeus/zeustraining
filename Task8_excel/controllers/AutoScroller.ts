/**
 * AutoScroller – smoother, faster, full‑window drag auto‑scroll.
 */
export class AutoScroller {
  private raf = 0;
  private lockAxis: "none" | "x" | "y" | "both" = "both";
  /**
   *
   * @param {HTMLDivElement} wrapper
   * @param {function} getPt
   */
  constructor(
    private readonly wrapper: HTMLDivElement,
    /**Always‑current pointer position (clientX, clientY) */
    private readonly getPt: () => { x: number; y: number },
    private readonly getBounds: () => {
      left: number;
      top: number;
      right: number;
      bottom: number;
    },
    private readonly getCellSize: () => { colW: number; rowH: number }
  ) {}

  /**
   *
   * @param {string} lockAxis
   * @returns
   */
  start(lockAxis: "none" | "x" | "y" | "both" = "both"): void {
    this.lockAxis = lockAxis;
    if (this.raf) return;
    const step = () => {
      const v = this.edgeSpeed(this.getPt());
      if (v.dx || v.dy) {
        // Scroll the wrapper element, not the window
        this.wrapper.scrollBy(v.dx, v.dy);
      }
      this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  stop(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  /**Return px/frame scroll speed based on pointer proximity to *window* edges for full-window dragging.*/
  /**
   *
   * @param p
   * @param {number} p.x
   * @param {number} p.y
   * @returns { dx: number; dy: number }
   *
   */
  private edgeSpeed(p: { x: number; y: number }): { dx: number; dy: number } {
    const { left, top, right, bottom } = this.getBounds();

    const { rowH } = this.getCellSize();
    // The horizontal scroll speed is now a fixed value for smoother, more predictable behavior.
    // The previous value of 30px/frame was too fast.
    const dxStep = 10;
    // The vertical scroll speed is based on the row height to maintain a "by-row" scrolling feel.
    const dyStep = rowH;
    let dx = 0,
      dy = 0;

    if (this.lockAxis === "both" || this.lockAxis === "x") {
      if (p.x <= left + 60) {
        dx = -dxStep; // scroll left by 10px per frame
      } else if (p.x > right) {
        dx = dxStep; // scroll right by 10px per frame
      }
    }

    if (this.lockAxis === "both" || this.lockAxis === "y") {
      if (p.y <= top + 24) {
        dy = -dyStep; // scroll up by one row
      } else if (p.y > bottom) {
        dy = dyStep; // scroll down by one row
      }
    }

    return { dx, dy };
  }
}
