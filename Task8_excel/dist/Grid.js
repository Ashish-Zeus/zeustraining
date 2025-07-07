/**
 * Grid – canvas host + scroll, selection, editing.
 * ---------------------------------------------------------------------------
 */
import { Renderer } from "./Renderer.js";
import { DataStore } from "./DataStore.js";
import { KeyNavigator } from "./KeyNavigator.js";
import { AutoScroller } from "./AutoScroller.js";
import { SelectionManager, CellSelection, RangeSelection, ColumnRangeSelection, RowRangeSelection } from "./Selection.js";
export class Grid {
    /**
     *
     * @param cfg
     */
    constructor(cfg) {
        this.cfg = cfg;
        this.dpr = window.devicePixelRatio || 1;
        this.data = new DataStore();
        this.sel = new SelectionManager();
        this.viewport = { scrollX: 0, scrollY: 0, width: 0, height: 0 };
        /**true while a text box is on screen */
        this.editing = false;
        /**anchor for drag‑selection */
        this.dragAnchor = null;
        this.pointer = { x: 0, y: 0 }; // tracks mouse pos
        this.dragHeaderMode = null;
        this.headerAnchor = null; // col index or row index
        /* ─────────────────────────  Mouse interaction  ─────────────────────── */
        /**
         *
         * @param e
         * @returns
         */
        this.onMouseDown = (e) => {
            if (this.editing)
                return;
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
            if (region === "corner")
                return; // ignore A1 corner
            /* row header click */
            if (region === "rowHeader" && row !== null) {
                this.commitEdit();
                this.dragHeaderMode = "row";
                this.headerAnchor = row;
                this.sel.set(new RowRangeSelection(row, row));
                this.render();
                return;
            }
            /* column header click */
            if (region === "colHeader" && col !== null) {
                this.commitEdit();
                this.dragHeaderMode = "column";
                this.headerAnchor = col;
                this.sel.set(new ColumnRangeSelection(col, col));
                this.render();
                return;
            }
            /* sheet body click */
            if (region === "body" && row !== null && col !== null) {
                // const active = this.sel.getActiveCell();
                this.commitEdit(); // close any editor
                this.sel.set(new CellSelection(row, col)); // ⬅️  select the cell
                this.dragAnchor = { row, col }; // start possible drag
                this.render(); // ⬅️  paint blue outline
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
            if (this.dragAnchor) { // start of a drag
                window.addEventListener("mousemove", this.onGlobalMove);
            }
        };
        /**
         *
         * @param e
         * @returns
         */
        // private onMouseMove = (e: MouseEvent): void => {
        //   if (this.editing || !this.dragAnchor) return;
        //   this.updatePointer(e);           // keep pointer fresh
        //   this.auto.start();                   // auto‑scroll
        //   /* convert pointer → sheet row/col */
        //   const { row, col } = this.bodyCoordsFromEvent(e);
        //   /* NEW  —— create OR update the RangeSelection —— */
        //   let range = this.sel.get();
        //   if (!(range instanceof RangeSelection)) {
        //     range = new RangeSelection(
        //       this.dragAnchor.row,
        //       this.dragAnchor.col,
        //       this.dragAnchor.row,
        //       this.dragAnchor.col
        //     );
        //   }
        //   range.extendTo(row, col);            // keeps anchor fixed
        //   this.sel.set(range);
        //   this.render();
        // };
        /* ─────────────────────────  Mouse‑move  ───────────────────────────── */
        this.onMouseMove = (e) => {
            if (this.editing)
                return; // ignore while editing
            /* Always keep global pointer fresh (needed for AutoScroller) */
            this.updatePointer(e);
            /* ======================================================== */
            /* A.  COLUMN‑HEADER drag  (multi‑column selection)         */
            /* ======================================================== */
            if (this.dragHeaderMode === "column" && this.headerAnchor !== null) {
                const { col } = this.hitTest(e);
                if (col !== null) {
                    const c0 = Math.min(this.headerAnchor, col);
                    const c1 = Math.max(this.headerAnchor, col);
                    this.sel.set(new ColumnRangeSelection(c0, c1));
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
                    const r0 = Math.min(this.headerAnchor, row);
                    const r1 = Math.max(this.headerAnchor, row);
                    this.sel.set(new RowRangeSelection(r0, r1));
                    this.auto.start();
                    this.render();
                }
                return; // done for this event
            }
            /* ======================================================== */
            /* C.  BODY drag  (cell range selection)                    */
            /* ======================================================== */
            if (!this.dragAnchor)
                return;
            this.auto.start(); // keep auto‑scroll running
            /* Convert pointer to current row / col */
            const { row, col } = this.bodyCoordsFromEvent(e);
            /* ----- Ensure we have a RangeSelection and keep the anchor fixed ----- */
            let range;
            const curSel = this.sel.get();
            if (curSel instanceof RangeSelection) {
                range = curSel; // reuse existing
            }
            else {
                range = new RangeSelection(// start new range
                this.dragAnchor.row, this.dragAnchor.col, this.dragAnchor.row, this.dragAnchor.col);
            }
            range.extendTo(row, col); // now compiler knows range is RangeSelection
            this.sel.set(range);
            this.render();
        };
        this.onMouseUp = () => {
            if (this.editing)
                return;
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
        this.onDoubleClick = (e) => {
            if (this.editing)
                return; // already editing? ignore
            const { row, col, region } = this.hitTest(e);
            if (region === "body" && row !== null && col !== null) {
                this.openEditor(row, col); // ✨ start editing
            }
        };
        /**
         *
         * @param e
         * @returns
         */
        // private onGlobalMove = (e: MouseEvent): void => {
        //   if (!this.dragAnchor) return;          // only during drag‑selection
        //   this.updatePointer(e);
        //   /* --- recompute row/col from *global* pointer --- */
        //   const rect = this.scroller.getBoundingClientRect();
        //   const localX = e.clientX - rect.left;
        //   const localY = e.clientY - rect.top;
        //   const col = Math.floor(
        //     (localX + this.viewport.scrollX - this.cfg.headerWidth) /
        //     this.cfg.defaultColWidth
        //   );
        //   const row = Math.floor(
        //     (localY + this.viewport.scrollY - this.cfg.headerHeight) /
        //     this.cfg.defaultRowHeight
        //   );
        //   /* clamp to sheet edges */
        //   const r = this.clamp(row, 0, this.cfg.rows - 1);
        //   const c = this.clamp(col, 0, this.cfg.cols - 1);
        //   /* Update selection shape */
        //   this.sel.set(
        //     new RangeSelection(
        //       Math.min(this.dragAnchor.row, r),
        //       Math.min(this.dragAnchor.col, c),
        //       Math.max(this.dragAnchor.row, r),
        //       Math.max(this.dragAnchor.col, c)
        //     )
        //   );
        //   this.render();
        // };
        /* ─────────────────────────  Global mouse‑move (drag)  ─────────────────── */
        this.onGlobalMove = (e) => {
            if (this.editing)
                return; // ignore while editing
            /* Always update pointer */
            this.pointer.x = e.clientX;
            this.pointer.y = e.clientY;
            /* ==================== COLUMN‑HEADER drag ==================== */
            if (this.dragHeaderMode === "column" && this.headerAnchor !== null) {
                const { col } = this.hitTest(e);
                if (col !== null) {
                    const c0 = Math.min(this.headerAnchor, col);
                    const c1 = Math.max(this.headerAnchor, col);
                    this.sel.set(new ColumnRangeSelection(c0, c1));
                    this.auto.start();
                    this.render();
                }
                return;
            }
            /* ==================== ROW‑HEADER drag ======================= */
            if (this.dragHeaderMode === "row" && this.headerAnchor !== null) {
                const { row } = this.hitTest(e);
                if (row !== null) {
                    const r0 = Math.min(this.headerAnchor, row);
                    const r1 = Math.max(this.headerAnchor, row);
                    this.sel.set(new RowRangeSelection(r0, r1));
                    this.auto.start();
                    this.render();
                }
                return;
            }
            /* ==================== BODY drag (RangeSelection) ============ */
            if (!this.dragAnchor)
                return; // not dragging in body
            this.auto.start(); // ensure auto‑scroll keeps running
            const { row, col } = this.bodyCoordsFromEvent(e);
            /* --- Ensure we have a RangeSelection and preserve original anchor --- */
            let range;
            const curSel = this.sel.get();
            if (curSel instanceof RangeSelection) {
                range = curSel;
            }
            else {
                range = new RangeSelection(this.dragAnchor.row, this.dragAnchor.col, this.dragAnchor.row, this.dragAnchor.col);
            }
            range.extendTo(row, col);
            this.sel.set(range);
            this.render();
        };
        const wrap = document.getElementById("excel-wrapper");
        if (!wrap)
            throw new Error("#excel-wrapper not found");
        this.canvas = document.createElement("canvas");
        this.canvas.style.pointerEvents = "none";
        this.ctx = this.canvas.getContext("2d");
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
        this.navigator = new KeyNavigator(this.cfg, this.sel, this.scroller, () => this.editing, // tell navigator when editing is active
        () => this.render() // let it trigger a repaint
        );
        this.auto = new AutoScroller(this.scroller, () => this.pointer);
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
    /**
     *
     * @param w
     * @param h
     */
    resize(w, h) {
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
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.rend.draw(this.viewport, this.sel.get());
    }
    /**Select a single cell and scroll it fully into view */
    /**
     *
     * @param row
     * @param col
     */
    selectCellAndReveal(row, col) {
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
        if (bodyX < viewL)
            newL = bodyX;
        else if (bodyX + cellW > viewR)
            newL = bodyX + cellW - (viewR - viewL);
        if (bodyY < viewT)
            newT = bodyY;
        else if (bodyY + cellH > viewB)
            newT = bodyY + cellH - (viewB - viewT);
        if (newL !== viewL || newT !== viewT) {
            this.scroller.scrollTo({ left: newL, top: newT, behavior: "auto" });
        }
    }
    /**Pointer updates *inside* the wrapper only*/
    /**
     *
     * @param e
     */
    updatePointer(e) {
        this.pointer.x = e.clientX;
        this.pointer.y = e.clientY;
    }
    /**
     *
     * @param v
     * @param min
     * @param max
     * @returns
     */
    clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }
    bodyCoordsFromEvent(e) {
        const rect = this.scroller.getBoundingClientRect();
        const localX = e.clientX - rect.left;
        const localY = e.clientY - rect.top;
        const col = Math.floor((localX + this.viewport.scrollX - this.cfg.headerWidth) /
            this.cfg.defaultColWidth);
        const row = Math.floor((localY + this.viewport.scrollY - this.cfg.headerHeight) /
            this.cfg.defaultRowHeight);
        /* clamp to sheet edges */
        return {
            row: this.clamp(row, 0, this.cfg.rows - 1),
            col: this.clamp(col, 0, this.cfg.cols - 1)
        };
    }
    /* ─────────────────────────────  Hit‑testing  ───────────────────────── */
    /**
     *
     * @param e
     * @returns
     */
    hitTest(e) {
        const rect = this.scroller.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        if (x < this.cfg.headerWidth && y < this.cfg.headerHeight) {
            return { row: null, col: null, region: "corner" };
        }
        if (x < this.cfg.headerWidth) {
            const row = Math.floor((y + this.viewport.scrollY - this.cfg.headerHeight) /
                this.cfg.defaultRowHeight);
            return { row, col: null, region: "rowHeader" };
        }
        if (y < this.cfg.headerHeight) {
            const col = Math.floor((x + this.viewport.scrollX - this.cfg.headerWidth) /
                this.cfg.defaultColWidth);
            return { row: null, col, region: "colHeader" };
        }
        const col = Math.floor((x + this.viewport.scrollX - this.cfg.headerWidth) /
            this.cfg.defaultColWidth);
        const row = Math.floor((y + this.viewport.scrollY - this.cfg.headerHeight) /
            this.cfg.defaultRowHeight);
        return { row, col, region: "body" };
    }
    /* ────────────────────────────  Editing  ────────────────────────────── */
    /**
     *
     * @param row
     * @param col
     * @returns
     */
    openEditor(row, col) {
        if (this.editor)
            return;
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
        /**
         *
         * @param save
         */
        const commit = (save) => {
            if (save)
                this.data.set(row, col, input.value.trim());
            this.commitEdit(); // tears down
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
                ev.preventDefault(); // stop the newline the browser would insert
            }
            else if (ev.key === "Tab") {
                this.data.set(row, col, input.value.trim());
                this.commitEdit(); // closes editor & repaint
                const nextCol = ev.shiftKey
                    ? Math.max(col, 0) // Shift+Tab ⇦
                    : Math.min(col, this.cfg.cols - 1); // Tab      ⇒
                this.selectCellAndReveal(row, nextCol); // jump ⇦ / ⇒
                this.render();
                ev.preventDefault(); // keep focus on grid
            }
            else if (ev.key === "Escape") {
                this.commitEdit(); // cancel edit
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
    commitEdit() {
        // if (!this.editor) return;
        // // this.editor.remove();
        // /* remove only if still in the DOM – avoids NotFoundError */
        // if (this.editor.isConnected) this.editor.remove();
        // this.editor = undefined;
        // this.editing = false;   // ⬅️ back to normal mode
        // this.render();
        const el = this.editor;
        if (!el)
            return; // already handled once
        this.editor = undefined;
        this.editing = false;
        // Remove from DOM only if still attached — avoids NotFoundError.
        if (el.parentNode)
            el.parentNode.removeChild(el);
        this.render();
    }
}
