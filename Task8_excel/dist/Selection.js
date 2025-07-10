/**
 * Typed selection models – each in its own class so behaviour can diverge.
 * --------------------------------------------------------------------------
 */
/* ───────────────────  Concrete selection types  ──────────────────────── */
export class CellSelection {
    /**
     *
     * @param row
     * @param col
     */
    constructor(row, col) {
        this.row = row;
        this.col = col;
    }
}
/**Entire column (all rows) */
export class ColumnSelection {
    /**
     *
     * @param col
     */
    constructor(col) {
        this.col = col;
    }
}
/**Entire row (all cols) */
export class RowSelection {
    /**
     *
     * @param row
     */
    constructor(row) {
        this.row = row;
    }
}
/**Rectangular range */
export class RangeSelection {
    /**
     *
     * @param r0
     * @param c0
     * @param r1
     * @param c1
     */
    constructor(r0, c0, r1, c1) {
        this.r0 = r0;
        this.c0 = c0;
        this.r1 = r1;
        this.c1 = c1;
        /**row/col where the selection started (for white background)*/
        this.anchorRow = r0;
        this.anchorCol = c0;
    }
    isSingle() {
        return this.r0 === this.r1 && this.c0 === this.c1;
    }
    /**
     *
     * @param row
     * @param col
     */
    /**grow the rectangle but KEEP the anchor fixed*/
    extendTo(row, col) {
        this.r0 = Math.min(this.anchorRow, row);
        this.r1 = Math.max(this.anchorRow, row);
        this.c0 = Math.min(this.anchorCol, col);
        this.c1 = Math.max(this.anchorCol, col);
    }
}
/**Full set of contiguous columns (c0‒c1), all rows */
export class ColumnRangeSelection {
    constructor(c0, c1, anchorCol // ← fixed anchor
    ) {
        this.c0 = c0;
        this.c1 = c1;
        this.anchorCol = anchorCol;
    }
    extendTo(col) {
        this.c0 = Math.min(this.anchorCol, col);
        this.c1 = Math.max(this.anchorCol, col);
    }
}
export class RowRangeSelection {
    constructor(r0, r1, anchorRow) {
        this.r0 = r0;
        this.r1 = r1;
        this.anchorRow = anchorRow;
    }
    extendTo(row) {
        this.r0 = Math.min(this.anchorRow, row);
        this.r1 = Math.max(this.anchorRow, row);
    }
}
export class SelectionManager {
    constructor() {
        this.current = null;
    }
    /**replace current selection */
    /**
     *
     * @param sel
     */
    set(sel) {
        this.current = sel;
    }
    /**returns the active selection (or null) */
    get() {
        return this.current;
    }
    /**true if the active selection is exactly one cell */
    isSingleCell() {
        return (this.current instanceof CellSelection ||
            (this.current instanceof RangeSelection && this.current.isSingle()));
    }
    /**row, col of active cell (top‑left of range) – or null */
    getActiveCell() {
        /* single cell */ // (existing code)
        if (this.current instanceof CellSelection)
            return { row: this.current.row, col: this.current.col };
        /* rectangular range */ // (existing code)
        if (this.current instanceof RangeSelection)
            return { row: this.current.r0, col: this.current.c0 };
        /* ─── NEW: single‑header selections ─── */
        if (this.current instanceof ColumnSelection)
            return { row: 0, col: this.current.col }; // anchor is row 0
        if (this.current instanceof RowSelection)
            return { row: this.current.row, col: 0 }; // anchor is col 0
        /* header‑range selections */ // (already present from your edits)
        if (this.current instanceof ColumnRangeSelection)
            return { row: 0, col: this.current.anchorCol };
        if (this.current instanceof RowRangeSelection)
            return { row: this.current.anchorRow, col: 0 };
        return null;
    }
}
