/**
 * Typed selection models – each in its own class so behaviour can diverge.
 * --------------------------------------------------------------------------
 */
/* ───────────────────  Concrete selection types  ──────────────────────── */
export class CellSelection {
    constructor(row, col) {
        this.row = row;
        this.col = col;
    }
}
/**Entire column (all rows) */
export class ColumnSelection {
    constructor(col) {
        this.col = col;
    }
}
/**Entire row (all cols) */
export class RowSelection {
    constructor(row) {
        this.row = row;
    }
}
/**Rectangular range */
export class RangeSelection {
    constructor(r0, c0, r1, c1) {
        this.r0 = r0;
        this.c0 = c0;
        this.r1 = r1;
        this.c1 = c1;
    }
    isSingle() {
        return this.r0 === this.r1 && this.c0 === this.c1;
    }
    extendTo(row, col) {
        this.r0 = Math.min(this.r0, row);
        this.c0 = Math.min(this.c0, col);
        this.r1 = Math.max(this.r1, row);
        this.c1 = Math.max(this.c1, col);
    }
}
export class SelectionManager {
    constructor() {
        this.current = null;
    }
    /**replace current selection */
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
