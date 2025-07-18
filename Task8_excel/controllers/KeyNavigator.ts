/**
 * KeyNavigator – Arrow / Tab navigation + Shift‑Arrow range extension.
 */
import {
  SelectionManager,
  RangeSelection, // Now handles single cell and range
  RowSelection, // Now handles single row and row range
  ColumnSelection, // Now handles single column and column range
} from "./Selection.js";
import type { GridConfig } from "./Grid.js";
import { ColWidths, RowHeights } from "./types.js"; // Import types for colW and rowH

export class KeyNavigator {
  private anchor: { row: number; col: number } | null = null;
  private cursor: { row: number; col: number } | null = null;
  private readonly colW: ColWidths; // Add colW as a property
  private readonly rowH: RowHeights; // Add rowH as a property

  /**
   * @param {GridConfig} cfg The grid configuration.
   * @param {SelectionManager} sel The selection manager instance.
   * @param {HTMLDivElement} wrapper The HTMLDivElement that acts as the scroller.
   * @param isEditing A function that returns true if the grid is currently in editing mode.
   * @param requestRender A function to request a re-render of the grid.
   * @param {ColWidths} colW The array of column widths.
   * @param {RowHeights} rowH The array of row heights.
   */
  constructor(
    private readonly cfg: GridConfig,
    private readonly sel: SelectionManager,
    private readonly wrapper: HTMLDivElement,
    private readonly isEditing: () => boolean,
    private readonly requestRender: () => void,
    colW: ColWidths, // Accept colW in constructor
    rowH: RowHeights // Accept rowH in constructor
  ) {
    this.colW = colW; // Initialize colW
    this.rowH = rowH; // Initialize rowH
    window.addEventListener("keydown", this.onKey, { passive: false });
  }

  /* ── key handler ──────────────────────────────────────────────────── */
  /**
   * Handles keyboard keydown events for navigation.
   * @param {KeyboardEvent} e The KeyboardEvent.
   * @returns
   */
  private onKey = (e: KeyboardEvent): void => {
    if (this.isEditing()) return;

    /* plain Tab / (no Shift = right, Shift = left) */
    if(e.key === "Enter") {
      this.move(e.shiftKey ? -1 : 1,0,e.shiftKey)
      e.preventDefault();
      return;
    }
    if (e.key === "Tab") {
      this.move(0, e.shiftKey ? -1 : 1, e.shiftKey);
      e.preventDefault();
      return;
    }

    const { dr, dc } = this.delta(e.key);
    if (dr === 0 && dc === 0) return; // Not an arrow key

    this.move(dr, dc, e.shiftKey);
    e.preventDefault();
  };

  /* ── move or extend ──────────────────────────────────────────────── */
  /**
   * Moves the selection cursor or extends the selection.
   * @param {number} dr Delta for row movement.
   * @param {number} dc Delta for column movement.
   * @param {boolean} extend True if Shift key is held to extend the selection.
   * @returns
   */
  private move(dr: number, dc: number, extend: boolean): void {
    // /* ------------- SYNC anchor & cursor with current selection ------------- */
    const curSel = this.sel.get();

    if (curSel instanceof RangeSelection) {
      // If it's a single cell selection (which is now a RangeSelection where r0=r1 and c0=c1)
      // or a full range selection.
      this.anchor = { row: curSel.anchorRow, col: curSel.anchorCol };
      // Cursor should be the 'active' corner of the selection, which is the one that moves.
      // This logic determines which corner is the 'moving' one based on anchor.
      const endRow = curSel.anchorRow === curSel.r0 ? curSel.r1 : curSel.r0;
      const endCol = curSel.anchorCol === curSel.c0 ? curSel.c1 : curSel.c0;
      // this.cursor = { row: endRow, col: endCol };
      this.cursor = { row: curSel.anchorRow, col: curSel.anchorCol };
    } else if (curSel instanceof ColumnSelection) {
      // For column selections (single or range)
      this.anchor = { row: 0, col: curSel.anchorCol };
      this.cursor = { row: 0, col: curSel.anchorCol }; // Far end of the range
    } else if (curSel instanceof RowSelection) {
      // For row selections (single or range)
      this.anchor = { row: curSel.anchorRow, col: 0 };
      this.cursor = { row: curSel.anchorRow, col: 0 }; // Far end of the range
    } else {
      // If no selection or an unhandled type, initialize anchor/cursor to (0,0)
      this.anchor = { row: 0, col: 0 };
      this.cursor = { row: 0, col: 0 };
    }
    /* ----------------------------------------------------------------------- */

    if (!this.cursor || !this.anchor) return; // sheet might be empty or initialization failed

    /* ---------- calculate new cursor position ---------- */
    const newRow = this.clamp(this.cursor.row + dr, 0, this.cfg.rows - 1);
    const newCol = this.clamp(this.cursor.col + dc, 0, this.cfg.cols - 1);

    /* ---------- NO Shift : collapse to anchor then move one cell ---------- */
    if (!extend) {
      const row = newRow; // New position is the cursor position after movement
      const col = newCol;
      this.anchor = { row, col }; // Anchor and cursor are the same for single cell selection
      this.cursor = { row, col };
      // Create a new RangeSelection for a single cell
      this.sel.set(new RangeSelection(row, col, row, col, row, col));
      this.scrollIntoView(row, col);
      this.requestRender();
      return;
    }

    /* ---------- Shift held : extend around fixed anchor ---------- */
    this.cursor = { row: newRow, col: newCol };

    // Determine the type of selection based on the anchor's position (header vs body)
    // and apply extension.
    if (this.anchor.row === 0 && this.anchor.col === 0 && (curSel instanceof ColumnSelection || curSel instanceof RowSelection)) {
        // This case handles extending from a header selection
        if (curSel instanceof ColumnSelection) {
            const newSel = new ColumnSelection(
                Math.min(this.anchor.col, newCol),
                Math.max(this.anchor.col, newCol),
                this.anchor.col
            );
            this.sel.set(newSel);
        } else if (curSel instanceof RowSelection) {
            const newSel = new RowSelection(
                Math.min(this.anchor.row, newRow),
                Math.max(this.anchor.row, newRow),
                this.anchor.row
            );
            this.sel.set(newSel);
        }
    } else {
        // Default to RangeSelection for body cells
        const rng = new RangeSelection(
            this.anchor.row,
            this.anchor.col,
            this.anchor.row, // Initial r1
            this.anchor.col, // Initial c1
            this.anchor.row, // anchorRow
            this.anchor.col  // anchorCol
        );
        rng.extendTo(this.cursor.row, this.cursor.col); // extends around fixed anchor
        this.sel.set(rng);
    }


    this.scrollIntoView(newRow, newCol);
    this.requestRender();
  }

  /* ── helpers ─────────────────────────────────────────────────────── */
  /**
   * Calculates the row and column delta based on the pressed arrow key.
   * @param {string} key The key pressed (e.g., "ArrowUp", "ArrowDown").
   * @returns { dr: number; dc: number } An object with `dr` (delta row) and `dc` (delta column).
   */
  private delta(key: string): { dr: number; dc: number } {
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
   * Scrolls the grid to ensure the specified cell is visible.
   * @param {number} r The row index of the cell to scroll into view.
   * @param {number} c The column index of the cell to scroll into view.
   */
  private scrollIntoView(r: number, c: number): void {
    const offX = this.cfg.headerWidth;
    const offY = this.cfg.headerHeight;

    // Calculate the pixel position of the target cell's top-left corner
    // considering custom row heights and column widths
    const cellX = this.colW.slice(0, c).reduce((sum, width) => sum + width, 0);
    const cellY = this.rowH.slice(0, r).reduce((sum, height) => sum + height, 0);

    const cellW = this.colW[c];
    const cellH = this.rowH[r];

    const viewL = this.wrapper.scrollLeft;
    const viewT = this.wrapper.scrollTop;
    // Calculate the right and bottom boundaries of the scrollable *body* area
    const viewR = viewL + this.wrapper.clientWidth - offX;
    const viewB = viewT + this.wrapper.clientHeight - offY;

    let newL = viewL;
    let newT = viewT;

    // Adjust horizontal scroll if cell is out of view
    if (cellX < viewL) {
      newL = cellX;
    } else if (cellX + cellW > viewR) {
      newL = cellX + cellW - (viewR - viewL);
    }

    // Adjust vertical scroll if cell is out of view
    if (cellY < viewT) {
      newT = cellY;
    } else if (cellY + cellH > viewB) {
      newT = cellY + cellH - (viewB - viewT);
    }

    if (newL !== viewL || newT !== viewT) {
      this.wrapper.scrollTo({ left: newL, top: newT, behavior: "auto" });
    }
  }

  /**
   * Clamps a value between a minimum and maximum.
   * @param {number} v The value to clamp.
   * @param {number} min The minimum allowed value.
   * @param {number} max The maximum allowed value.
   * @returns {number} The clamped value.
   */
  private clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
  }
}
