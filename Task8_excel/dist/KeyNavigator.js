/**
 * KeyNavigator – Arrow / Tab navigation + Shift‑Arrow range extension.
 */
import { CellSelection, RangeSelection, } from "./Selection.js";
export class KeyNavigator {
    /**
     *
     * @param cfg
     * @param sel
     * @param wrapper
     * @param isEditing
     * @param requestRender
     */
    constructor(cfg, sel, wrapper, isEditing, requestRender) {
        this.cfg = cfg;
        this.sel = sel;
        this.wrapper = wrapper;
        this.isEditing = isEditing;
        this.requestRender = requestRender;
        this.anchor = null;
        /* ── key handler ──────────────────────────────────────────────────── */
        /**
         *
         * @param e
         * @returns
         */
        this.onKey = (e) => {
            if (this.isEditing())
                return;
            /* plain Tab ⇦ / ⇨ (no Shift = right, Shift = left) */
            if (e.key === "Tab") {
                this.move(0, e.shiftKey ? -1 : 1, e.shiftKey);
                e.preventDefault();
                return;
            }
            const { dr, dc } = this.delta(e.key);
            if (dr === 0 && dc === 0)
                return;
            this.move(dr, dc, e.shiftKey);
            e.preventDefault();
        };
        window.addEventListener("keydown", this.onKey, { passive: false });
    }
    /* ── move or extend ──────────────────────────────────────────────── */
    /**
     *
     * @param dr
     * @param dc
     * @param extend
     * @returns
     */
    move(dr, dc, extend) {
        const focus = this.sel.getActiveCell();
        if (!focus)
            return;
        const row = this.clamp(focus.row + dr, 0, this.cfg.rows - 1);
        const col = this.clamp(focus.col + dc, 0, this.cfg.cols - 1);
        if (!extend) {
            this.anchor = { row, col };
            this.sel.set(new CellSelection(row, col));
        }
        else {
            if (!this.anchor)
                this.anchor = { ...focus };
            this.sel.set(new RangeSelection(Math.min(this.anchor.row, row), Math.min(this.anchor.col, col), Math.max(this.anchor.row, row), Math.max(this.anchor.col, col)));
        }
        this.scrollIntoView(row, col);
        this.requestRender();
    }
    /* ── helpers ─────────────────────────────────────────────────────── */
    /**
     *
     * @param key
     * @returns
     */
    delta(key) {
        return key === "ArrowUp" ? { dr: -1, dc: 0 } :
            key === "ArrowDown" ? { dr: 1, dc: 0 } :
                key === "ArrowLeft" ? { dr: 0, dc: -1 } :
                    key === "ArrowRight" ? { dr: 0, dc: 1 } :
                        { dr: 0, dc: 0 };
    }
    /**
     *
     * @param r
     * @param c
     */
    scrollIntoView(r, c) {
        const offX = this.cfg.headerWidth;
        const offY = this.cfg.headerHeight;
        const cellX = c * this.cfg.defaultColWidth;
        const cellY = r * this.cfg.defaultRowHeight;
        const viewL = this.wrapper.scrollLeft;
        const viewT = this.wrapper.scrollTop;
        const viewR = viewL + this.wrapper.clientWidth - offX;
        const viewB = viewT + this.wrapper.clientHeight - offY;
        let newL = viewL;
        let newT = viewT;
        if (cellX < viewL)
            newL = cellX;
        else if (cellX + this.cfg.defaultColWidth > viewR)
            newL = cellX + this.cfg.defaultColWidth - (viewR - viewL);
        if (cellY < viewT)
            newT = cellY;
        else if (cellY + this.cfg.defaultRowHeight > viewB)
            newT = cellY + this.cfg.defaultRowHeight - (viewB - viewT);
        if (newL !== viewL || newT !== viewT) {
            this.wrapper.scrollTo({ left: newL, top: newT, behavior: "auto" });
        }
    }
    /**
     *
     * @param v
     * @param min
     * @param max
     * @returns
     */
    clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }
}
