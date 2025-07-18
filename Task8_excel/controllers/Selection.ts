/**
 * Typed selection models – each in its own class so behaviour can diverge.
 * --------------------------------------------------------------------------
 */

export interface Rect {
  r0: number;
  c0: number;
  r1: number;
  c1: number;
  /**true if exactly one cell */
  isSingle(): boolean;
}

/* ───────────────────  Concrete selection types  ──────────────────────── */

/**Rectangular range (includes single cell selection) */
export class RangeSelection implements Rect {
  /**
   * @param {number} r0 The starting row of the selection.
   * @param {number} c0 The starting column of the selection.
   * @param {number} r1 The ending row of the selection.
   * @param {number} c1 The ending column of the selection.
   * @param {number} anchorRow The row where the selection started.
   * @param {number} anchorCol The column where the selection started.
   */
  constructor(
    public r0: number,
    public c0: number,
    public r1: number,
    public c1: number,
    public anchorRow: number,
    public anchorCol: number
  ) {
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
  isSingle(): boolean {
    return this.r0 === this.r1 && this.c0 === this.c1;
  }
  /**
   * Grow the rectangle but KEEP the anchor fixed.
   * @param {number} row The current row of the pointer.
   * @param {number} col The current column of the pointer.
   */
  extendTo(row: number, col: number): void {
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
  constructor(public r0: number, public r1: number, public anchorRow: number) {}

  /**
   * 
   * @returns {boolean}
   */
  isSingle(): boolean {
    return this.r0 === this.r1;
  }

  /**
   * 
   * @param {number} row 
   */
  extendTo(row: number): void {
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
  constructor(public c0: number, public c1: number, public anchorCol: number) {}

  /**
   * 
   * @returns {boolean}
   */
  isSingle(): boolean {
    return this.c0 === this.c1;
  }

  /**
   * 
   * @param {number} col 
   */
  extendTo(col: number): void {
    this.c0 = Math.min(this.anchorCol, col);
    this.c1 = Math.max(this.anchorCol, col);
  }
}

/* ───────────────────  Selection manager (facade)  ────────────────────── */

export type AnySelection =
  | RangeSelection
  | ColumnSelection
  | RowSelection
  | null;

export class SelectionManager {
  private current: AnySelection = null;

  /**replace current selection */
  /**
   * 
   * @param {AnySelection} sel 
   */
  set(sel: AnySelection): void {
    this.current = sel;
  }

  /**returns the active selection (or null) */
  /**
   * 
   * @returns {AnySelection}
   */
  get(): AnySelection {
    return this.current;
  }

  /**true if the active selection is exactly one cell */
  /**
   * 
   * @returns {boolean}
   */
  isSingleCell(): boolean {
    return this.current instanceof RangeSelection && this.current.isSingle();
  }

  /**row, col of active cell (top-left of range) – or null */
  /**
   * 
   * @returns {{number,number} | null}
   */
  getActiveCell(): { row: number; col: number } | null {
    if (this.current instanceof RangeSelection)
      return { row: this.current.anchorRow, col: this.current.anchorCol };
    if (this.current instanceof ColumnSelection)
      return { row: 0, col: this.current.anchorCol }; // anchor is row 0
    if (this.current instanceof RowSelection)
      return { row: this.current.anchorRow, col: 0 }; // anchor is col 0

    return null;
  }
}