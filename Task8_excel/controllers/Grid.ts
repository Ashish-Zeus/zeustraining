// /**
//  * Grid – owns the canvas, scroll state, selection, editing, and renderer.
//  * ---------------------------------------------------------------------------
//  */

// import { Renderer }  from "./Renderer";
// import { DataStore } from "./DataStore";

// export interface GridConfig {
//   rows: number;
//   cols: number;
//   defaultRowHeight: number;
//   defaultColWidth: number;
//   headerHeight: number;
//   headerWidth: number;
// }

// /**Viewport rectangle in CSS‑pixel space */
// export interface Viewport {
//   scrollX: number;
//   scrollY: number;
//   width: number;
//   height: number;
// }

// export class Grid {
//   /* public ---------------------------------------------------------------- */

//   public readonly canvas: HTMLCanvasElement;

//   /* private --------------------------------------------------------------- */

//   private readonly ctx: CanvasRenderingContext2D;
//   private readonly dpr = window.devicePixelRatio || 1;

//   /**Div that owns native scrollbars & receives mouse events */
//   private readonly scroller: HTMLDivElement;
//   /**Dummy spacer that defines the scrollable area’s size */
//   private readonly spacer: HTMLDivElement;

//   private readonly data = new DataStore();
//   private readonly renderer: Renderer;

//   private viewport: Viewport = { scrollX: 0, scrollY: 0, width: 0, height: 0 };

//   /**Current selection (null when nothing picked) */
//   private selectedRow: number | null = null;
//   private selectedCol: number | null = null;

//   /**Active text editor element, if any */
//   private editor?: HTMLInputElement;

//   /* ctor ------------------------------------------------------------------ */

//   constructor(private readonly cfg: GridConfig) {
//     /* Grab #excel-wrapper from DOM */
//     const wrapper = document.getElementById("excel-wrapper") as HTMLDivElement;
//     if (!wrapper) throw new Error("#excel-wrapper div not found");

//     /* Build fixed canvas (pointer-events:none) */
//     this.canvas = document.createElement("canvas");
//     this.canvas.style.pointerEvents = "none";
//     this.ctx = this.canvas.getContext("2d")!;
//     this.ctx.scale(this.dpr, this.dpr);
//     wrapper.appendChild(this.canvas);

//     /* The wrapper itself will act as our scroller */
//     this.scroller = wrapper;
//     this.spacer   = document.createElement("div");
//     this.scroller.appendChild(this.spacer);

//     /* Scroll handling */
//     this.scroller.addEventListener("scroll", () => {
//       this.viewport.scrollX = this.scroller.scrollLeft;
//       this.viewport.scrollY = this.scroller.scrollTop;
//       this.render();
//     });

//     /* Click → selection / editing */
//     this.scroller.addEventListener("click", this.handleClick);

//     /* ResizeObserver keeps bitmap in sync with wrapper size */
//     new ResizeObserver(entries => {
//       const { width, height } = entries[0].contentRect;
//       this.resize(width, height);
//     }).observe(wrapper);

//     /* Renderer */
//     this.renderer = new Renderer(this.ctx, this.cfg, this.data);
//   }

//   /* ---------------------------------------------------------------------- */

//   /**Resize backing‑store bitmap + spacer; called by ResizeObserver */
//   public resize(w: number, h: number): void {
//     this.canvas.width  = Math.floor(w * this.dpr);
//     this.canvas.height = Math.floor(h * this.dpr);

//     this.viewport.width  = w;
//     this.viewport.height = h;

//     /* Update spacer so scrollbars stay correct */
//     this.spacer.style.width  =
//       `${this.cfg.headerWidth  + this.cfg.cols * this.cfg.defaultColWidth }px`;
//     this.spacer.style.height =
//       `${this.cfg.headerHeight + this.cfg.rows * this.cfg.defaultRowHeight}px`;

//     this.render();
//   }

//   /**Single public repaint */
//   private render(): void {
//     this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
//     this.renderer.draw(
//       this.viewport,
//       this.selectedRow,
//       this.selectedCol
//     );
//   }

//   /* ──────────────────────  Mouse interaction  ─────────────────────────── */

//   private handleClick = (e: MouseEvent): void => {
//     const rect = this.scroller.getBoundingClientRect();
//     const x = e.clientX - rect.left;
//     const y = e.clientY - rect.top;

//     /* Ignore clicks inside header strips */
//     if (x < this.cfg.headerWidth || y < this.cfg.headerHeight) return;

//     const col = Math.floor(
//       (x + this.viewport.scrollX - this.cfg.headerWidth) /
//         this.cfg.defaultColWidth
//     );
//     const row = Math.floor(
//       (y + this.viewport.scrollY - this.cfg.headerHeight) /
//         this.cfg.defaultRowHeight
//     );

//     if (
//       col < 0 || col >= this.cfg.cols ||
//       row < 0 || row >= this.cfg.rows
//     ) return;

//     /* Same cell clicked twice → enter edit mode */
//     if (this.selectedRow === row && this.selectedCol === col && !this.editor) {
//       this.openEditor(row, col);
//     } else {
//       this.closeEditor();
//       this.selectedRow = row;
//       this.selectedCol = col;
//       this.render();
//     }
//   };

//   /* ─────────────────────────  Editing helpers  ────────────────────────── */

//   private openEditor(row: number, col: number): void {
//     const existing = this.data.get(row, col) ?? "";

//     const input = document.createElement("input");
//     input.value = existing;
//     input.style.position = "absolute";
//     input.style.font = "12px system-ui, sans-serif";
//     input.style.boxSizing = "border-box";
//     input.style.padding = "0 2px";
//     input.style.border = "1px solid #1a73e8";
//     input.style.outline = "none";
//     input.style.background = "#fff";
//     input.style.zIndex = "10"; // above canvas

//     /* Position over the cell in viewport coordinates */
//     input.style.left =
//       `${this.cfg.headerWidth +
//         col * this.cfg.defaultColWidth -
//         this.viewport.scrollX}px`;
//     input.style.top =
//       `${this.cfg.headerHeight +
//         row * this.cfg.defaultRowHeight -
//         this.viewport.scrollY}px`;
//     input.style.width  = `${this.cfg.defaultColWidth - 1}px`;
//     input.style.height = `${this.cfg.defaultRowHeight - 1}px`;

//     this.scroller.appendChild(input);
//     input.focus();
//     input.select();
//     this.editor = input;

//     const commit = () => {
//       this.data.set(row, col, input.value.trim());
//       this.closeEditor();
//       this.render();
//     };

//     input.addEventListener("keydown", ev => {
//       if (ev.key === "Enter") commit();
//       if (ev.key === "Escape") {
//         this.closeEditor();
//         this.render();
//       }
//     });
//     input.addEventListener("blur", commit);
//   }

//   private closeEditor(): void {
//     if (this.editor) {
//       this.editor.remove();
//       this.editor = undefined;
//     }
//   }
// }

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
} from "./Selection";

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
  private readonly dpr = window.devicePixelRatio || 1;

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

  private navigator!: KeyNavigator
  private auto!: AutoScroller;                            // field
  private pointer = { x: 0, y: 0 };                       // tracks mouse pos

  /**Tracks pointer even outside wrapper during drag */
  // private onGlobalMove = (e: MouseEvent): void => {
  //   this.pointer.x = e.clientX;
  //   this.pointer.y = e.clientY;
  // };
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

    /* 🔑  Arrow‑key navigation */
    this.navigator = new KeyNavigator(
      this.cfg,
      this.sel,
      this.scroller,
      () => this.editing,          // tell navigator when editing is active
      () => this.render()          // let it trigger a repaint
    );

    this.auto = new AutoScroller(
      this.scroller,
      () => this.pointer
    );

    window.addEventListener("mouseup", this.onMouseUp);
    /* global move keeps pointer + selection live even off‑wrapper */
    window.addEventListener("mousemove", this.onGlobalMove);


    new ResizeObserver(ent => {
      const { width, height } = ent[0].contentRect;
      this.resize(width, height);
    }).observe(wrap);

    this.rend = new Renderer(this.ctx, this.cfg, this.data);
  }

  /* ───────────────────────────────  Resizing  ────────────────────────── */

  public resize(w: number, h: number): void {
    this.canvas.width = Math.floor(w * this.dpr);
    this.canvas.height = Math.floor(h * this.dpr);

    this.viewport.width = w;
    this.viewport.height = h;

    this.spacer.style.width =
      `${this.cfg.headerWidth + this.cfg.cols * this.cfg.defaultColWidth}px`;
    this.spacer.style.height =
      `${this.cfg.headerHeight + this.cfg.rows * this.cfg.defaultRowHeight}px`;

    this.render();
  }

  /* ─────────────────────────────  Rendering  ─────────────────────────── */

  private render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.rend.draw(this.viewport, this.sel.get());
  }

  /* ─────────────────────────  Mouse interaction  ─────────────────────── */

  private onMouseDown = (e: MouseEvent): void => {
    if (this.editing) return;
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
      this.sel.set(new RowSelection(row));
      this.render();
      return;
    }
    /* column header click */
    if (region === "colHeader" && col !== null) {
      this.commitEdit();
      this.sel.set(new ColumnSelection(col));
      this.render();
      return;
    }
    /* sheet body click */
    if (region === "body" && row !== null && col !== null) {
      // const active = this.sel.getActiveCell();
      this.commitEdit();                      // close any editor
      this.sel.set(new CellSelection(row, col));   // ⬅️  select the cell
      this.dragAnchor = { row, col };         // start possible drag
      this.render();                          // ⬅️  paint blue outline
      // if (active && active.row === row && active.col === col) {
      //   /* second click -> edit */
      //   this.openEditor(row, col);
      // } else {
      //   this.commitEdit();
      //   this.sel.set(new CellSelection(row, col));
      //   this.dragAnchor = { row, col };     // start possible drag
      //   this.render();
      // }
    }
    if (this.dragAnchor) {                    // start of a drag
      window.addEventListener("mousemove", this.onGlobalMove);
    }
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (this.editing) return;
    if (!this.dragAnchor) return;
    this.updatePointer(e);                      // NEW – update coords
    this.auto.start();                       // NEW – begin auto‑scroll
    const { row, col, region } = this.hitTest(e);
    if (region !== "body" || row === null || col === null) return;

    const r0 = Math.min(this.dragAnchor.row, row);
    const c0 = Math.min(this.dragAnchor.col, col);
    const r1 = Math.max(this.dragAnchor.row, row);
    const c1 = Math.max(this.dragAnchor.col, col);

    this.sel.set(new RangeSelection(r0, c0, r1, c1));
    this.render();
  };

  private onMouseUp = (): void => {
    if (this.editing) return;
    this.dragAnchor = null;
    this.auto.stop();
    window.removeEventListener("mousemove", this.onGlobalMove); // ← clean up
  };

  private onDoubleClick = (e: MouseEvent): void => {
    if (this.editing) return;                       // already editing? ignore
    const { row, col, region } = this.hitTest(e);
    if (region === "body" && row !== null && col !== null) {
      this.openEditor(row, col);                    // ✨ start editing
    }
  };


  /**Select a single cell and scroll it fully into view */
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
  private updatePointer(e: MouseEvent): void {
    this.pointer.x = e.clientX;
    this.pointer.y = e.clientY;
  }

  private onGlobalMove = (e: MouseEvent): void => {
    if (!this.dragAnchor) return;          // only during drag‑selection
    this.updatePointer(e);

    /* --- recompute row/col from *global* pointer --- */
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
    const r = this.clamp(row, 0, this.cfg.rows - 1);
    const c = this.clamp(col, 0, this.cfg.cols - 1);

    /* Update selection shape */
    this.sel.set(
      new RangeSelection(
        Math.min(this.dragAnchor.row, r),
        Math.min(this.dragAnchor.col, c),
        Math.max(this.dragAnchor.row, r),
        Math.max(this.dragAnchor.col, c)
      )
    );
    this.render();
  };

  private clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
  }



  /* ─────────────────────────────  Hit‑testing  ───────────────────────── */

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

  private openEditor(row: number, col: number): void {
    if (this.editor) return;

    const initVal = this.data.get(row, col) ?? "";
    this.editing = true;
    const input = document.createElement("input");
    input.value = initVal;
    input.style.position = "absolute";
    input.style.font = "12px system-ui, sans-serif";
    input.style.padding = "0 2px";
    input.style.border = "1px solid #1a73e8";
    input.style.outline = "none";
    input.style.background = "#fff";
    input.style.zIndex = "10";


    input.addEventListener("mousedown", ev => ev.stopPropagation(), true);
    // input.addEventListener("click", ev => ev.stopPropagation(), true);

    /* locate over cell */
    input.style.left =
      `${this.cfg.headerWidth +
      col * this.cfg.defaultColWidth -
      this.viewport.scrollX}px`;
    input.style.top =
      `${this.cfg.headerHeight +
      row * this.cfg.defaultRowHeight -
      this.viewport.scrollY}px`;
    input.style.width = `${this.cfg.defaultColWidth - 1}px`;
    input.style.height = `${this.cfg.defaultRowHeight - 1}px`;


    this.scroller.appendChild(input);
    input.focus();
    input.select();
    this.editor = input;

    //   const commit = () => {
    //     this.data.set(row, col, input.value.trim());
    //     this.commitEdit();
    //     this.render();
    //   };

    //   input.addEventListener("keydown", ev => {
    //     if (ev.key === "Enter") commit();
    //     if (ev.key === "Escape") {
    //       this.commitEdit();
    //       this.render();
    //     }
    //   });
    //   input.addEventListener("blur", commit);
    // }

    // private commitEdit(): void {
    //   if (this.editor) {
    //     this.editor.remove();
    //     this.editor = undefined;
    //   }
    // }
    const commit = (save: boolean) => {
      if (save) this.data.set(row, col, input.value.trim());
      this.commitEdit();   // tears down
    };

    input.addEventListener("keydown", ev => {
      if (ev.key === "Enter") {
        /* 1️⃣  save the value */
        this.data.set(row, col, input.value.trim());

        /* 2️⃣  close editor (also repaints) */
        this.commitEdit();

        /* 3️⃣  select cell one row below and scroll into view */
        const nextRow = Math.min(row + 1, this.cfg.rows - 1);
        this.selectCellAndReveal(nextRow, col);

        /* 4️⃣  final repaint with the new selection */
        this.render();

        ev.preventDefault();   // stop the newline the browser would insert
      }
      else if (ev.key === "Tab") {
        this.data.set(row, col, input.value.trim());
        this.commitEdit();                       // closes editor & repaint
        const nextCol = ev.shiftKey
          ? Math.max(col, 0)                 // Shift+Tab ⇦
          : Math.min(col, this.cfg.cols - 1);// Tab      ⇒
        this.selectCellAndReveal(row, nextCol);  // jump ⇦ / ⇒
        this.render();
        ev.preventDefault();                     // keep focus on grid
      }
      else if (ev.key === "Escape") {
        this.commitEdit();     // cancel edit
      }
      // if (ev.key === "Tab") { commit(true); ev.preventDefault(); }
      // if (ev.key === "Escape") { commit(false); }
    });
    input.addEventListener("blur", () => {
      this.data.set(row, col, input.value.trim());
      this.commitEdit();
      this.render();
    });
  }

  private commitEdit(): void {
    // if (!this.editor) return;
    // // this.editor.remove();
    // /* remove only if still in the DOM – avoids NotFoundError */
    // if (this.editor.isConnected) this.editor.remove();
    // this.editor = undefined;
    // this.editing = false;   // ⬅️ back to normal mode
    // this.render();
    const el = this.editor;
    if (!el) return;                     // already handled once

    this.editor = undefined;
    this.editing = false;

    // Remove from DOM only if still attached — avoids NotFoundError.
    if (el.parentNode) el.parentNode.removeChild(el);

    this.render();
  }
}
