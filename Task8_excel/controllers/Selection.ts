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

export class CellSelection {
  /**
   *
   * @param row
   * @param col
   */
  constructor(public row: number, public col: number) {}
}

/**Entire column (all rows) */
export class ColumnSelection {
  /**
   *
   * @param col
   */
  constructor(public col: number) {}
}

/**Entire row (all cols) */
export class RowSelection {
  /**
   *
   * @param row
   */
  constructor(public row: number) {}
}

/**Rectangular range */
export class RangeSelection implements Rect {
  /**
   *
   * @param r0
   * @param c0
   * @param r1
   * @param c1
   */
  constructor(
    public r0: number,
    public c0: number,
    public r1: number,
    public c1: number
  ) {
    /**row/col where the selection started (for white background)*/
    this.anchorRow = r0;
    this.anchorCol = c0;
  }

  /** The fixed cell where selection started */
  public anchorRow: number;
  public anchorCol: number;
  isSingle(): boolean {
    return this.r0 === this.r1 && this.c0 === this.c1;
  }
  /**
   *
   * @param row
   * @param col
   */
  /**grow the rectangle but KEEP the anchor fixed*/
  extendTo(row: number, col: number): void {
    this.r0 = Math.min(this.anchorRow, row);
    this.r1 = Math.max(this.anchorRow, row);
    this.c0 = Math.min(this.anchorCol, col);
    this.c1 = Math.max(this.anchorCol, col);
  }
}

/**Full set of contiguous columns (c0‒c1), all rows */
export class ColumnRangeSelection {
  constructor(
    public c0: number,
    public c1: number,
    public anchorCol: number // ← fixed anchor
  ) {}
  extendTo(col: number): void {
    this.c0 = Math.min(this.anchorCol, col);
    this.c1 = Math.max(this.anchorCol, col);
  }
}

export class RowRangeSelection {
  constructor(public r0: number, public r1: number, public anchorRow: number) {}
  extendTo(row: number): void {
    this.r0 = Math.min(this.anchorRow, row);
    this.r1 = Math.max(this.anchorRow, row);
  }
}

/* ───────────────────  Selection manager (facade)  ────────────────────── */

export type AnySelection =
  | CellSelection
  | ColumnSelection
  | RowSelection
  | RangeSelection
  | ColumnRangeSelection
  | RowRangeSelection
  | null;

export class SelectionManager {
  private current: AnySelection = null;

  /**replace current selection */
  /**
   *
   * @param sel
   */
  set(sel: AnySelection): void {
    this.current = sel;
  }

  /**returns the active selection (or null) */
  get(): AnySelection {
    return this.current;
  }

  /**true if the active selection is exactly one cell */
  isSingleCell(): boolean {
    return (
      this.current instanceof CellSelection ||
      (this.current instanceof RangeSelection && this.current.isSingle())
    );
  }

  /**row, col of active cell (top‑left of range) – or null */
  getActiveCell(): { row: number; col: number } | null {
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
