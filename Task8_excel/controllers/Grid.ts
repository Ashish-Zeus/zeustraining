/**
 * Grid – canvas host + scroll, selection, editing.
 * ---------------------------------------------------------------------------
 */

import { Renderer } from "./Renderer";
import { DataStore } from "./DataStore";
import { KeyNavigator } from "./KeyNavigator";
import { AutoScroller } from "./AutoScroller";
import {
  SelectionManager,
  CellSelection,
  ColumnSelection,
  RowSelection,
  RangeSelection,
  ColumnRangeSelection,
  RowRangeSelection,
} from "./Selection";
import { RowHeights, ColWidths } from "./types";
export interface GridConfig {
  rows: number;
  cols: number;
  defaultRowHeight: number;
  defaultColWidth: number;
  headerHeight: number;
  headerWidth: number;
}

export interface Viewport {
  scrollX: number;
  scrollY: number;
  width: number;
  height: number;
}

export class Grid {
  public readonly canvas: HTMLCanvasElement;

  private readonly ctx: CanvasRenderingContext2D;
  private dpr = window.devicePixelRatio || 1;

  private readonly scroller: HTMLDivElement;
  private readonly spacer: HTMLDivElement;

  private readonly data = new DataStore();
  private readonly sel = new SelectionManager();
  private readonly rend: Renderer;

  private viewport: Viewport = { scrollX: 0, scrollY: 0, width: 0, height: 0 };

  private editor?: HTMLInputElement;
  /**true while a text box is on screen */
  private editing = false;

  /**anchor for drag‑selection */
  private dragAnchor: { row: number; col: number } | null = null;

  private navigator!: KeyNavigator;
  private auto!: AutoScroller; // field
  private pointer = { x: 0, y: 0 }; // tracks mouse pos

  private dragHeaderMode: "column" | "row" | null = null;
  private headerAnchor: number | null = null; // col index or row index
  private readonly colW: ColWidths;
  private readonly rowH: RowHeights;
  /**
   *
   * @param cfg
   */
  constructor(private readonly cfg: GridConfig) {
    const wrap = document.getElementById("excel-wrapper") as HTMLDivElement;
    if (!wrap) throw new Error("#excel-wrapper not found");

    this.canvas = document.createElement("canvas");
    this.canvas.style.pointerEvents = "none";
    this.ctx = this.canvas.getContext("2d")!;
    this.ctx.scale(this.dpr, this.dpr);
    wrap.appendChild(this.canvas);

    this.scroller = wrap;
    this.spacer = document.createElement("div");
    this.scroller.appendChild(this.spacer);

    /* scroll */
    this.scroller.addEventListener("scroll", () => {
      this.viewport.scrollX = this.scroller.scrollLeft;
      this.viewport.scrollY = this.scroller.scrollTop;
      this.render();
    });

    /* mouse selection & drag range */
    this.scroller.addEventListener("mousedown", this.onMouseDown);
    this.scroller.addEventListener("mousemove", this.onMouseMove);
    this.scroller.addEventListener("dblclick", this.onDoubleClick);

    /* typing starts overwrite‑edit */
    window.addEventListener("keydown", this.onTypeStart, { passive: false });
    /*   Arrow‑key navigation */
    this.navigator = new KeyNavigator(
      this.cfg,
      this.sel,
      this.scroller,
      () => this.editing, // tell navigator when editing is active
      () => this.render() // let it trigger a repaint
    );

    this.auto = new AutoScroller(this.scroller, () => this.pointer);

    window.addEventListener("mouseup", this.onMouseUp);
    /* global move keeps pointer + selection live even off‑wrapper */
    window.addEventListener("mousemove", this.onGlobalMove);

    new ResizeObserver((ent) => {
      const { width, height } = ent[0].contentRect;
      this.resize(width, height);
    }).observe(wrap);

    this.rowH = Array(this.cfg.rows).fill(this.cfg.defaultRowHeight); // initialize with default row heights
    this.colW = Array(this.cfg.cols).fill(this.cfg.defaultColWidth); // initialize with default col widths
    this.rend = new Renderer(
      this.ctx,
      this.cfg,
      this.data,
      this.colW,
      this.rowH
    );
  }

  /* ───────────────────────────────  Resizing  ────────────────────────── */
  /**
   *
   * @param w
   * @param h
   */
  public resize(w: number, h: number): void {
    /* 1. Detect DPR — this changes when you zoom the page */
    const newDpr = window.devicePixelRatio || 1;
    if (newDpr !== this.dpr) {
      this.dpr = newDpr;
      /* reset all transforms then scale to new DPR */
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    /* 2. Give the canvas enough backing pixels for the new DPR */
    this.canvas.width = Math.floor(w * this.dpr);
    this.canvas.height = Math.floor(h * this.dpr);

    /* 3. DO NOT touch canvas.style.width/height — let CSS keep it 100 % */
    /*    (explicit pixel sizes caused the “canvas got smaller” problem)  */

    /* 4. Logical viewport size */
    this.viewport.width = w;
    this.viewport.height = h;

    /* 5. Scrollable spacer stays the same logic */
    this.spacer.style.width = `${
      this.cfg.headerWidth + this.cfg.cols * this.cfg.defaultColWidth
    }px`;
    this.spacer.style.height = `${
      this.cfg.headerHeight + this.cfg.rows * this.cfg.defaultRowHeight
    }px`;

    this.render();
  }

  /* ─────────────────────────────  Rendering  ─────────────────────────── */

  private render(): void {
    // this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // this.rend.draw(this.viewport, this.sel.get());
    /* Always draw at correct device‑pixel ratio */
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    /* Clear entire Hi‑DPI backing store */
    this.ctx.clearRect(
      0,
      0,
      this.canvas.width / this.dpr,
      this.canvas.height / this.dpr
    );

    this.rend.draw(this.viewport, this.sel.get());
  }

  /* ─────────────────────────  Mouse interaction  ─────────────────────── */
  /**
   *
   * @param e
   * @returns
   */
  private onMouseDown = (e: MouseEvent): void => {
    /* ── Abort if the click is on a scrollbar ─────────────────────────── */
    const rect = this.scroller.getBoundingClientRect();

    const onVScroll = e.clientX > rect.left + this.scroller.clientWidth;
    const onHScroll = e.clientY > rect.top + this.scroller.clientHeight;
    if (onVScroll || onHScroll) return; // ←  nothing else, just ignore
    /* ------------------------------------------------------------------- */
    // if (this.editing) return;
    this.updatePointer(e);
    if (this.editor) {
      if (e.target === this.editor) {
        /* Click is inside the editor – let the user type */
        return;
      }
      /* Clicked elsewhere → commit current edit first */
      this.commitEdit();
    }
    const { row, col, region } = this.hitTest(e);
    if (region === "corner") return; // ignore A1 corner

    /* row header click */
    if (region === "rowHeader" && row !== null) {
      this.commitEdit();
      this.dragHeaderMode = "row";
      this.headerAnchor = row;
      this.sel.set(new RowRangeSelection(row, row, row));
      this.render();
      return;
    }

    /* column header click */
    if (region === "colHeader" && col !== null) {
      this.commitEdit();
      this.dragHeaderMode = "column";
      this.headerAnchor = col;
      this.sel.set(new ColumnRangeSelection(col, col, col));
      this.render();
      return;
    }
    
    /* sheet body click */
    if (region === "body" && row !== null && col !== null) {
      // const active = this.sel.getActiveCell();
      this.commitEdit(); // close any editor
      this.sel.set(new CellSelection(row, col)); //  select the cell
      this.dragAnchor = { row, col }; // start possible drag
      this.render(); // paint blue outline
    }
    if (this.dragAnchor) {
      // start of a drag
      window.addEventListener("mousemove", this.onGlobalMove);
    }
  };

  /**
   *
   * @param e
   * @returns
   */

  /* ─────────────────────────  Mouse‑move  ───────────────────────────── */
  private onMouseMove = (e: MouseEvent): void => {
    if (this.editing) return; // ignore while editing

    /* Always keep global pointer fresh (needed for AutoScroller) */
    this.updatePointer(e);

    /* ======================================================== */
    /* A.  COLUMN‑HEADER drag  (multi‑column selection)         */
    /* ======================================================== */
    if (this.dragHeaderMode === "column" && this.headerAnchor !== null) {
      const { col } = this.hitTest(e);
      if (col !== null) {
        const cur = this.sel.get();
        if (cur instanceof ColumnRangeSelection) {
          cur.extendTo(col); // keep anchorCol fixed
          this.sel.set(cur);
        } else {
          this.sel.set(
            new ColumnRangeSelection(
              Math.min(this.headerAnchor!, col),
              Math.max(this.headerAnchor!, col),
              this.headerAnchor! // ← anchor
            )
          );
        }
        this.auto.start();
        this.render();
      }
      return; // done for this event
    }

    /* ======================================================== */
    /* B.  ROW‑HEADER drag  (multi‑row selection)               */
    /* ======================================================== */
    if (this.dragHeaderMode === "row" && this.headerAnchor !== null) {
      const { row } = this.hitTest(e);
      if (row !== null) {
        const cur = this.sel.get();
        if (cur instanceof RowRangeSelection) {
          cur.extendTo(row);
          this.sel.set(cur);
        } else {
          this.sel.set(
            new RowRangeSelection(
              Math.min(this.headerAnchor!, row),
              Math.max(this.headerAnchor!, row),
              this.headerAnchor!
            )
          );
        }
        this.auto.start();
        this.render();
      }
      return; // done for this event
    }

    /* ======================================================== */
    /* C.  BODY drag  (cell range selection)                    */
    /* ======================================================== */
    if (!this.dragAnchor) return;

    this.auto.start(); // keep auto‑scroll running

    /* Convert pointer to current row / col */
    const { row, col } = this.bodyCoordsFromEvent(e);

    /* ----- Ensure we have a RangeSelection and keep the anchor fixed ----- */
    let range: RangeSelection;

    const curSel = this.sel.get();
    if (curSel instanceof RangeSelection) {
      range = curSel; // reuse existing
    } else {
      range = new RangeSelection( // start new range
        this.dragAnchor.row,
        this.dragAnchor.col,
        this.dragAnchor.row,
        this.dragAnchor.col
      );
    }

    range.extendTo(row, col); // now compiler knows range is RangeSelection
    this.sel.set(range);

    this.render();
  };

  private onMouseUp = (): void => {
    if (this.editing) return;
    this.dragAnchor = null;
    this.dragHeaderMode = null;
    this.headerAnchor = null;
    this.auto.stop();
    window.removeEventListener("mousemove", this.onGlobalMove); // ← clean up
  };

  /**
   *
   * @param e
   * @returns
   */
  private onDoubleClick = (e: MouseEvent): void => {
    if (this.editing) return; // already editing? ignore
    const { row, col, region } = this.hitTest(e);
    if (region === "body" && row !== null && col !== null) {
      this.openEditor(row, col); // ✨ start editing
    }
  };

  /**Select a single cell and scroll it fully into view */
  /**
   *
   * @param row
   * @param col
   */
  private selectCellAndReveal(row: number, col: number): void {
    this.sel.set(new CellSelection(row, col));

    /* ---------- Auto‑scroll ---------- */
    const bodyX = col * this.cfg.defaultColWidth;
    const bodyY = row * this.cfg.defaultRowHeight;
    const cellW = this.cfg.defaultColWidth;
    const cellH = this.cfg.defaultRowHeight;

    const viewL = this.scroller.scrollLeft;
    const viewT = this.scroller.scrollTop;
    const viewR = viewL + (this.scroller.clientWidth - this.cfg.headerWidth);
    const viewB = viewT + (this.scroller.clientHeight - this.cfg.headerHeight);

    let newL = viewL;
    let newT = viewT;

    if (bodyX < viewL) newL = bodyX;
    else if (bodyX + cellW > viewR) newL = bodyX + cellW - (viewR - viewL);

    if (bodyY < viewT) newT = bodyY;
    else if (bodyY + cellH > viewB) newT = bodyY + cellH - (viewB - viewT);

    if (newL !== viewL || newT !== viewT) {
      this.scroller.scrollTo({ left: newL, top: newT, behavior: "auto" });
    }
  }

  /**Pointer updates *inside* the wrapper only*/
  /**
   *
   * @param e
   */
  private updatePointer(e: MouseEvent): void {
    this.pointer.x = e.clientX;
    this.pointer.y = e.clientY;
  }

  /**
   *
   * @param e
   * @returns
   */

  /* ─────────────────────────  Global mouse‑move (drag)  ─────────────────── */
  private onGlobalMove = (e: MouseEvent): void => {
    if (this.editing) return; // ignore while editing

    /* Always update pointer */
    this.pointer.x = e.clientX;
    this.pointer.y = e.clientY;

    /* ==================== COLUMN‑HEADER drag ==================== */
    if (this.dragHeaderMode === "column" && this.headerAnchor !== null) {
      const { col } = this.hitTest(e);
      if (col !== null) {
        const cur = this.sel.get();
        if (cur instanceof ColumnRangeSelection) {
          cur.extendTo(col); // keep anchor fixed
          this.sel.set(cur);
        } else {
          this.sel.set(
            new ColumnRangeSelection(
              Math.min(this.headerAnchor, col),
              Math.max(this.headerAnchor, col),
              this.headerAnchor // anchor stays constant
            )
          );
        }
        this.auto.start();
        this.render();
      }
      return;
    }

    /* ==================== ROW‑HEADER drag ======================= */
    if (this.dragHeaderMode === "row" && this.headerAnchor !== null) {
      const { row } = this.hitTest(e);
      if (row !== null) {
        const cur = this.sel.get();
        if (cur instanceof RowRangeSelection) {
          cur.extendTo(row);
          this.sel.set(cur);
        } else {
          this.sel.set(
            new RowRangeSelection(
              Math.min(this.headerAnchor, row),
              Math.max(this.headerAnchor, row),
              this.headerAnchor
            )
          );
        }
        this.auto.start();
        this.render();
      }
      return;
    }

    /* ==================== BODY drag (RangeSelection) ============ */
    if (!this.dragAnchor) return; // not dragging in body

    this.auto.start(); // ensure auto‑scroll keeps running

    const { row, col } = this.bodyCoordsFromEvent(e);

    /* --- Ensure we have a RangeSelection and preserve original anchor --- */
    let range: RangeSelection;
    const curSel = this.sel.get();
    if (curSel instanceof RangeSelection) {
      range = curSel;
    } else {
      range = new RangeSelection(
        this.dragAnchor.row,
        this.dragAnchor.col,
        this.dragAnchor.row,
        this.dragAnchor.col
      );
    }

    range.extendTo(row, col);
    this.sel.set(range);

    this.render();
  };

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

  private bodyCoordsFromEvent(e: MouseEvent): { row: number; col: number } {
    const rect = this.scroller.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;

    const col = Math.floor(
      (localX + this.viewport.scrollX - this.cfg.headerWidth) /
        this.cfg.defaultColWidth
    );
    const row = Math.floor(
      (localY + this.viewport.scrollY - this.cfg.headerHeight) /
        this.cfg.defaultRowHeight
    );

    /* clamp to sheet edges */
    return {
      row: this.clamp(row, 0, this.cfg.rows - 1),
      col: this.clamp(col, 0, this.cfg.cols - 1),
    };
  }

  /* ─────────────────────────────  Hit‑testing  ───────────────────────── */

  /**
   *
   * @param e
   * @returns
   */
  private hitTest(e: MouseEvent): {
    row: number | null;
    col: number | null;
    region: "body" | "rowHeader" | "colHeader" | "corner";
  } {
    const rect = this.scroller.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x < this.cfg.headerWidth && y < this.cfg.headerHeight) {
      return { row: null, col: null, region: "corner" };
    }
    if (x < this.cfg.headerWidth) {
      const row = Math.floor(
        (y + this.viewport.scrollY - this.cfg.headerHeight) /
          this.cfg.defaultRowHeight
      );
      return { row, col: null, region: "rowHeader" };
    }
    if (y < this.cfg.headerHeight) {
      const col = Math.floor(
        (x + this.viewport.scrollX - this.cfg.headerWidth) /
          this.cfg.defaultColWidth
      );
      return { row: null, col, region: "colHeader" };
    }
    const col = Math.floor(
      (x + this.viewport.scrollX - this.cfg.headerWidth) /
        this.cfg.defaultColWidth
    );
    const row = Math.floor(
      (y + this.viewport.scrollY - this.cfg.headerHeight) /
        this.cfg.defaultRowHeight
    );
    return { row, col, region: "body" };
  }

  /* ────────────────────────────  Editing  ────────────────────────────── */

  /* ──────────────────────── Typing when not editing ─────────────────────── */
  /**
   *
   * @param e
   * @returns
   */
  private onTypeStart = (e: KeyboardEvent): void => {
    /* ignore if already in edit mode */
    if (this.editing) return;

    /* printable single character only, no Ctrl/Cmd/Alt */
    if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;

    const active = this.sel.getActiveCell();
    if (!active) return;

    /* begin overwrite edit with the typed char (caret hidden) */
    this.openEditor(active.row, active.col, e.key, /*overwrite=*/ true);
    e.preventDefault(); // block browser hotkeys (e.g. space scroll)
  };

  /* ──────────────────────── Editing a cell ─────────────────────── */
  /**
   *
   * @param row
   * @param col
   * @returns
   */
  /* overwrite = true  → start with initialChar only and hide caret */
  private openEditor(
    row: number,
    col: number,
    initialChar: string = "",
    overwrite = false
  ): void {
    /* ── If dragging don't open editor ───────────────── */

    if (this.dragAnchor || this.dragHeaderMode) return;
    /* ───────────────────────────────────────────────────────────── */
    if (this.editor) return;

    const initVal = overwrite ? initialChar : this.data.get(row, col) ?? "";
    this.editing = true;

    const input = document.createElement("input");
    input.value = initVal;
    input.className = "cell-editor";
    input.style.position = "absolute";
    input.style.font = "12px system-ui, sans-serif";
    // input.style.padding = "0 2px";
    input.style.border = "2px solid #107c41";
    input.style.outline = "none";
    input.style.boxSizing = "border-box";
    input.style.background = "#fff";
    input.style.zIndex = "10";
    /* hide caret for overwrite mode */
    // input.style.caretColor = overwrite ? "transparent" : "";

    /* stop clicks bubbling out of the editor */
    input.addEventListener("mousedown", (ev) => ev.stopPropagation(), true);

    /* locate over cell */

    input.style.left = `${
      this.cfg.headerWidth + col * this.cfg.defaultColWidth
    }px`;
    input.style.top = `${
      this.cfg.headerHeight + row * this.cfg.defaultRowHeight
    }px`;
    /* width/height stay the same */
    input.style.width = `${this.cfg.defaultColWidth + 0.5}px`;
    input.style.height = `${this.cfg.defaultRowHeight + 0.5}px`;

    this.scroller.appendChild(input);
    input.focus();

    if (overwrite) {
      /* place caret after the seeded char but DON’T select it */
      const len = input.value.length;
      input.setSelectionRange(len, len);
    } else {
      /* double‑click / F2 edit keeps Excel behaviour (full select) */
      input.select();
    }

    this.editor = input;

    /**
     *
     * @param save
     */
    const commit = (save: boolean) => {
      if (save) this.data.set(row, col, input.value.trim());
      this.commitEdit(); // tears down
    };

    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        /*  save the value */
        this.data.set(row, col, input.value.trim());

        /*  close editor (also repaints) */
        this.commitEdit();

        /*  select cell one row below and scroll into view */
        const nextRow = Math.min(row + 1, this.cfg.rows - 1);
        this.selectCellAndReveal(nextRow, col);

        /*  final repaint with the new selection */
        this.render();

        ev.preventDefault(); // stop the newline the browser would insert
      } else if (ev.key === "Tab") {
        this.data.set(row, col, input.value.trim());
        this.commitEdit(); // closes editor & repaint
        const nextCol = ev.shiftKey
          ? Math.max(col, 0) // Shift+Tab ⇦
          : Math.min(col, this.cfg.cols - 1); // Tab      ⇒
        this.selectCellAndReveal(row, nextCol); // jump ⇦ / ⇒
        this.render();
        ev.preventDefault(); // keep focus on grid
      } else if (
        ev.key === "ArrowDown" ||
        ev.key === "ArrowUp" ||
        ev.key === "ArrowLeft" ||
        ev.key === "ArrowRight"
      ) {
        /* save current value */
        this.data.set(row, col, input.value.trim());
        this.commitEdit(); // closes editor & repaint

        /*  compute next cell */
        let nextRow = row;
        let nextCol = col;
        if (ev.key === "ArrowDown") nextRow = Math.min(row, this.cfg.rows - 1);
        if (ev.key === "ArrowUp") nextRow = Math.max(row, 0);
        if (ev.key === "ArrowRight") nextCol = Math.min(col, this.cfg.cols - 1);
        if (ev.key === "ArrowLeft") nextCol = Math.max(col, 0);

        /*  move blue outline there */
        this.selectCellAndReveal(nextRow, nextCol);
        this.render();

        ev.preventDefault(); // stop caret movement in input
      } else if (ev.key === "Escape") {
        this.commitEdit(); // cancel edit
      }
    });
    input.addEventListener("blur", () => {
      this.data.set(row, col, input.value.trim());
      this.commitEdit();
      this.render();
    });
  }

  private commitEdit(): void {
    const el = this.editor;
    if (!el) return; // already handled once

    this.editor = undefined;
    this.editing = false;

    // Remove from DOM only if still attached — avoids NotFoundError.
    if (el.parentNode) el.parentNode.removeChild(el);
    if (el) el.style.caretColor = ""; // restore caret for next edit session

    this.render();
  }
}
