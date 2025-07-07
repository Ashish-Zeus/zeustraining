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
    constructor(c0, c1) {
        this.c0 = c0;
        this.c1 = c1;
    }
}
/**Full set of contiguous rows (r0‒r1), all columns */
export class RowRangeSelection {
    constructor(r0, r1) {
        this.r0 = r0;
        this.r1 = r1;
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
        return this.current instanceof CellSelection ||
            (this.current instanceof RangeSelection && this.current.isSingle());
    }
    /**row, col of active cell (top‑left of range) – or null */
    getActiveCell() {
        if (this.current instanceof CellSelection) {
            return { row: this.current.row, col: this.current.col };
        }
        if (this.current instanceof RangeSelection) {
            return { row: this.current.r0, col: this.current.c0 };
        }
        return null;
    }
}
