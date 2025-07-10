/**
 * KeyNavigator – Arrow / Tab navigation + Shift‑Arrow range extension.
 */
import { CellSelection, RangeSelection, RowSelection, RowRangeSelection, ColumnRangeSelection, ColumnSelection, } from "./Selection.js";
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
        this.cursor = null;
        /* ── key handler ──────────────────────────────────────────────────── */
        /**
         *
         * @param e
         * @returns
         */
        this.onKey = (e) => {
            if (this.isEditing())
                return;
            /* plain Tab  /  (no Shift = right, Shift = left) */
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
        // /* ------------- SYNC anchor & cursor with current selection ------------- */
        const curSel = this.sel.get();
        if (curSel instanceof CellSelection) {
            this.anchor = { row: curSel.row, col: curSel.col };
            this.cursor = { row: curSel.row, col: curSel.col };
        }
        else if (curSel instanceof RangeSelection) {
            this.anchor = { row: curSel.anchorRow, col: curSel.anchorCol };
            const endRow = curSel.anchorRow === curSel.r0 ? curSel.r1 : curSel.r0;
            const endCol = curSel.anchorCol === curSel.c0 ? curSel.c1 : curSel.c0;
            this.cursor = { row: endRow, col: endCol };
        }
        else if (curSel instanceof ColumnSelection) {
            // ← NEW
            this.anchor = this.cursor = { row: 0, col: curSel.col };
        }
        else if (curSel instanceof RowSelection) {
            // ← NEW
            this.anchor = this.cursor = { row: curSel.row, col: 0 };
        }
        else if (curSel instanceof ColumnRangeSelection) {
            // ← NEW
            this.anchor = { row: 0, col: curSel.anchorCol };
            this.cursor = { row: 0, col: curSel.c1 }; // far end of the range
        }
        else if (curSel instanceof RowRangeSelection) {
            // ← NEW
            this.anchor = { row: curSel.anchorRow, col: 0 };
            this.cursor = { row: curSel.r1, col: 0 }; // far end of the range
        }
        /* ----------------------------------------------------------------------- */
        if (!this.cursor || !this.anchor)
            return; // sheet might be empty
        /* ---------- calculate new cursor position ---------- */
        const newRow = this.clamp(this.cursor.row + dr, 0, this.cfg.rows - 1);
        const newCol = this.clamp(this.cursor.col + dc, 0, this.cfg.cols - 1);
        /* ---------- NO Shift : collapse to anchor then move one cell ---------- */
        if (!extend) {
            const base = this.anchor; // always the fixed anchor cell
            const row = this.clamp(base.row + dr, 0, this.cfg.rows - 1);
            const col = this.clamp(base.col + dc, 0, this.cfg.cols - 1);
            this.anchor = { row, col };
            this.cursor = { row, col };
            this.sel.set(new CellSelection(row, col));
            this.scrollIntoView(row, col);
            this.requestRender();
            return;
        }
        /* ---------- Shift held : extend around fixed anchor ---------- */
        this.cursor = { row: newRow, col: newCol };
        const rng = new RangeSelection(this.anchor.row, this.anchor.col, this.anchor.row, this.anchor.col);
        rng.extendTo(this.cursor.row, this.cursor.col); // keeps anchor fixed
        this.sel.set(rng);
        this.scrollIntoView(newRow, newCol);
        this.requestRender();
    }
    /* ── helpers ─────────────────────────────────────────────────────── */
    /**
     *
     * @param key
     * @returns
     */
    delta(key) {
        return key === "ArrowUp"
            ? { dr: -1, dc: 0 }
            : key === "ArrowDown"
                ? { dr: 1, dc: 0 }
                : key === "ArrowLeft"
                    ? { dr: 0, dc: -1 }
                    : key === "ArrowRight"
                        ? { dr: 0, dc: 1 }
                        : { dr: 0, dc: 0 };
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
