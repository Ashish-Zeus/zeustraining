/**
 * KeyNavigator – Arrow / Tab navigation + Shift‑Arrow range extension.
 */
import {
  SelectionManager,
  CellSelection,
  RangeSelection,
} from "./Selection";
import type { GridConfig } from "./Grid";

export class KeyNavigator {
  private anchor: { row: number; col: number } | null = null;

  /**
   * 
   * @param cfg 
   * @param sel 
   * @param wrapper 
   * @param isEditing 
   * @param requestRender 
   */
  constructor(
    private readonly cfg: GridConfig,
    private readonly sel: SelectionManager,
    private readonly wrapper: HTMLDivElement,
    private readonly isEditing: () => boolean,
    private readonly requestRender: () => void
  ) {
    window.addEventListener("keydown", this.onKey, { passive: false });
  }

  /* ── key handler ──────────────────────────────────────────────────── */
  /**
   * 
   * @param e 
   * @returns 
   */
  private onKey = (e: KeyboardEvent): void => {
    if (this.isEditing()) return;

    /* plain Tab  /  (no Shift = right, Shift = left) */
    if (e.key === "Tab") {
      this.move(0, e.shiftKey ? -1 : 1, e.shiftKey);
      e.preventDefault();
      return;
    }

    const { dr, dc } = this.delta(e.key);
    if (dr === 0 && dc === 0) return;

    this.move(dr, dc, e.shiftKey);
    e.preventDefault();
  };

  /* ── move or extend ──────────────────────────────────────────────── */
  /**
   * 
   * @param dr 
   * @param dc 
   * @param extend 
   * @returns 
   */
  private move(dr: number, dc: number, extend: boolean): void {
    const focus = this.sel.getActiveCell();
    if (!focus) return;

    const row = this.clamp(focus.row + dr, 0, this.cfg.rows - 1);
    const col = this.clamp(focus.col + dc, 0, this.cfg.cols - 1);

    if (!extend) {
      this.anchor = { row, col };
      this.sel.set(new CellSelection(row, col));
    } else {
      if (!this.anchor) this.anchor = { ...focus };
      this.sel.set(
        new RangeSelection(
          Math.min(this.anchor.row, row),
          Math.min(this.anchor.col, col),
          Math.max(this.anchor.row, row),
          Math.max(this.anchor.col, col)
        )
      );
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
  private delta(key: string): { dr: number; dc: number } {
    return key === "ArrowUp"    ? { dr: -1, dc:  0 } :
           key === "ArrowDown"  ? { dr:  1, dc:  0 } :
           key === "ArrowLeft"  ? { dr:  0, dc: -1 } :
           key === "ArrowRight" ? { dr:  0, dc:  1 } :
           { dr: 0, dc: 0 };
  }

  /**
   * 
   * @param r 
   * @param c 
   */
  private scrollIntoView(r: number, c: number): void {
    const offX = this.cfg.headerWidth;
    const offY = this.cfg.headerHeight;

    const cellX = c * this.cfg.defaultColWidth;
    const cellY = r * this.cfg.defaultRowHeight;

    const viewL = this.wrapper.scrollLeft;
    const viewT = this.wrapper.scrollTop;
    const viewR = viewL + this.wrapper.clientWidth  - offX;
    const viewB = viewT + this.wrapper.clientHeight - offY;

    let newL = viewL;
    let newT = viewT;

    if (cellX < viewL) newL = cellX;
    else if (cellX + this.cfg.defaultColWidth > viewR)
      newL = cellX + this.cfg.defaultColWidth - (viewR - viewL);

    if (cellY < viewT) newT = cellY;
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
  private clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
  }
}
