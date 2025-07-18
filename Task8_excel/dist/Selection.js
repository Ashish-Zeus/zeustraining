/**
 * Typed selection models – each in its own class so behaviour can diverge.
 * --------------------------------------------------------------------------
 */
/* ───────────────────  Concrete selection types  ──────────────────────── */
/**Rectangular range (includes single cell selection) */
export class RangeSelection {
    /**
     * @param {number} r0 The starting row of the selection.
     * @param {number} c0 The starting column of the selection.
     * @param {number} r1 The ending row of the selection.
     * @param {number} c1 The ending column of the selection.
     * @param {number} anchorRow The row where the selection started.
     * @param {number} anchorCol The column where the selection started.
     */
    constructor(r0, c0, r1, c1, anchorRow, anchorCol) {
        this.r0 = r0;
        this.c0 = c0;
        this.r1 = r1;
        this.c1 = c1;
        this.anchorRow = anchorRow;
        this.anchorCol = anchorCol;
        // If it's initially a single cell, set anchor to that cell
        if (r0 === r1 && c0 === c1) {
            this.anchorRow = r0;
            this.anchorCol = c0;
        }
    }
    /**
     *
     * @returns {boolean}
     */
    isSingle() {
        return this.r0 === this.r1 && this.c0 === this.c1;
    }
    /**
     * Grow the rectangle but KEEP the anchor fixed.
     * @param {number} row The current row of the pointer.
     * @param {number} col The current column of the pointer.
     */
    extendTo(row, col) {
        this.r0 = Math.min(this.anchorRow, row);
        this.r1 = Math.max(this.anchorRow, row);
        this.c0 = Math.min(this.anchorCol, col);
        this.c1 = Math.max(this.anchorCol, col);
    }
}
/**Entire row or a range of rows (all cols) */
export class RowSelection {
    /**
     * @param {number} r0 The starting row of the selection.
     * @param {number} r1 The ending row of the selection.
     * @param {number} anchorRow The row where the selection started.
     */
    constructor(r0, r1, anchorRow) {
        this.r0 = r0;
        this.r1 = r1;
        this.anchorRow = anchorRow;
    }
    /**
     *
     * @returns {boolean}
     */
    isSingle() {
        return this.r0 === this.r1;
    }
    /**
     *
     * @param {number} row
     */
    extendTo(row) {
        this.r0 = Math.min(this.anchorRow, row);
        this.r1 = Math.max(this.anchorRow, row);
    }
}
/**Entire column or a range of columns (all rows) */
export class ColumnSelection {
    /**
     * @param {number} c0 The starting column of the selection.
     * @param {number} c1 The ending column of the selection.
     * @param {number} anchorCol The column where the selection started.
     */
    constructor(c0, c1, anchorCol) {
        this.c0 = c0;
        this.c1 = c1;
        this.anchorCol = anchorCol;
    }
    /**
     *
     * @returns {boolean}
     */
    isSingle() {
        return this.c0 === this.c1;
    }
    /**
     *
     * @param {number} col
     */
    extendTo(col) {
        this.c0 = Math.min(this.anchorCol, col);
        this.c1 = Math.max(this.anchorCol, col);
    }
}
export class SelectionManager {
    constructor() {
        this.current = null;
    }
    /**replace current selection */
    /**
     *
     * @param {AnySelection} sel
     */
    set(sel) {
        this.current = sel;
    }
    /**returns the active selection (or null) */
    /**
     *
     * @returns {AnySelection}
     */
    get() {
        return this.current;
    }
    /**true if the active selection is exactly one cell */
    /**
     *
     * @returns {boolean}
     */
    isSingleCell() {
        return this.current instanceof RangeSelection && this.current.isSingle();
    }
    /**row, col of active cell (top-left of range) – or null */
    /**
     *
     * @returns {{number,number} | null}
     */
    getActiveCell() {
        if (this.current instanceof RangeSelection)
            return { row: this.current.anchorRow, col: this.current.anchorCol };
        if (this.current instanceof ColumnSelection)
            return { row: 0, col: this.current.anchorCol }; // anchor is row 0
        if (this.current instanceof RowSelection)
            return { row: this.current.anchorRow, col: 0 }; // anchor is col 0
        return null;
    }
}
