/**
 * Grid – canvas host + scroll, selection, editing.
 * ---------------------------------------------------------------------------
 */
import { Renderer } from "./Renderer.js";
import { DataStore } from "./DataStore.js";
import { KeyNavigator } from "./KeyNavigator.js";
import { AutoScroller } from "./AutoScroller.js";
import { SelectionManager, RangeSelection, ColumnSelection, RowSelection, } from "./Selection.js";
import TouchHandler from "./touch_handlers/TouchHandler.js";
import { CellRangeSelectionHandler } from "./touch_handlers/CellRangeSelectionHandler.js";
import { ColumnSelectionHandler } from "./touch_handlers/ColumnSelectionHandler.js";
import { RowSelectionHandler } from "./touch_handlers/RowSelectionHandler.js";
import { ColumnResizeHandler } from "./touch_handlers/ColumnResizeHandler.js";
import { RowResizeHandler } from "./touch_handlers/RowResizeHandler.js";
import { RowContextMenuHandler } from "./touch_handlers/RowContextMenuHandler.js";
import { ColumnContextMenuHandler } from "./touch_handlers/ColumnContextMenuHandler.js";
import { StatusBar } from "./StatusBar.js";
import { EditCellCommand, LoadDataCommand } from "./Actions.js";
import { HistoryManager } from "./HistoryManager.js";
export class Grid {
    // private isDragSelecting: Boolean = false;
    /**
     *
     * @param {GridConfig} cfg
     */
    constructor(cfg) {
        this.cfg = cfg;
        this.dpr = window.devicePixelRatio || 1;
        this.data = new DataStore();
        this.sel = new SelectionManager();
        this.viewport = { scrollX: 0, scrollY: 0, width: 0, height: 0 };
        this.editingCell = null; // Add this
        this.isDragSelecting = false;
        /**true while a text box is on screen */
        this.editing = false;
        this.pointer = { x: 0, y: 0 }; // tracks mouse pos
        this.RESIZE_MARGIN = 5;
        this.colPrefixSums = [];
        this.rowPrefixSums = [];
        /**
         *
         * @param {KeyboardEvent} e
         */
        this.handleUndoRedo = (e) => {
            if (e.ctrlKey) {
                if (e.key.toLowerCase() === "z") {
                    e.preventDefault();
                    this.history.undo();
                }
                else if (e.key.toLowerCase() === "y") {
                    e.preventDefault();
                    this.history.redo();
                }
            }
        };
        /**
         * Handles the file selection from the <input type="file"> element.
         * Reads the file content and passes it to loadData.
         * @param {Event} event
         */
        this.handleFileSelect = (event) => {
            const input = event.target;
            if (!input.files || input.files.length === 0) {
                return;
            }
            const file = input.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target?.result;
                    if (typeof text !== "string")
                        throw new Error("File could not be read as text.");
                    const data = JSON.parse(text);
                    // this.loadData(data);
                    const command = new LoadDataCommand(data, this);
                    this.history.addAndExecute(command);
                }
                catch (error) {
                    console.error("Error parsing JSON file:", error);
                    alert("Failed to parse JSON file. Ensure the file is correctly formatted.");
                }
            };
            reader.onerror = () => {
                console.error("Error reading file:", reader.error);
                alert("Failed to read the selected file.");
            };
            reader.readAsText(file);
            // Reset the input value to allow selecting the same file again
            input.value = "";
        };
        /**
         * Adds a new method to clear all data from the grid.
         */
        this.clearData = () => {
            // 1. Create a new, empty DataStore to wipe everything.
            this.data = new DataStore();
            // 2. Tell the renderer to use this new empty store.
            this.rend.setDataStore(this.data);
            // 3. Clear any active selection.
            this.sel.set(null);
            // 4. Redraw the empty grid and clear the status bar.
            this.rerenderGridAndStatusBar();
            console.log("Grid data cleared.");
        };
        /* ─────────────────────────  Mouse interaction (delegated to TouchHandler)  ─────────────────────── */
        /**
         * Handles double-click events to open the cell editor.
         * @param {MouseEvent} e The MouseEvent.
         * @returns
         */
        this.onDoubleClick = (e) => {
            if (this.editing)
                return; // already editing? ignore
            const rect = this.scroller.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            // Determine region locally for double-click
            // This is a simplified hit-test for the purpose of opening the editor.
            // Full hit-testing for selection/resize is handled by individual handlers.
            let isBodyRegion = false;
            if (x >= this.cfg.headerWidth && y >= this.cfg.headerHeight) {
                isBodyRegion = true;
            }
            if (isBodyRegion) {
                const { row, col } = this.bodyCoordsFromEvent(e);
                if (row !== null && col !== null) {
                    this.openEditor(row, col); // ✨ start editing
                }
            }
        };
        /* ─────────────────────────  Global mouse‑move (drag)  ─────────────────── */
        /**
         *
         * @param {MouseEvent} e
         */
        this.onGlobalMove = (e) => {
            this.updatePointer(e);
            if (this.isDragSelecting) {
                this.auto.start(this.isDragSelecting);
            }
            else {
                this.auto.stop(); // Ensure it doesn’t keep running after drag
            }
        };
        /* ──────────────────────── Typing when not editing ─────────────────────── */
        /**
         *
         * @param {KeyboardEvent} e
         * @returns
         */
        this.onTypeStart = (e) => {
            /* ignore if already in edit mode */
            if (this.editing || this.isDragSelecting)
                return;
            /* printable single character only, no Ctrl/Cmd/Alt */
            if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey)
                return;
            const sel = this.sel.get();
            let targetRow = null;
            let targetCol = null;
            if (sel instanceof RangeSelection) {
                targetRow = sel.anchorRow;
                targetCol = sel.anchorCol;
            }
            else if (sel instanceof RowSelection) {
                targetRow = sel.anchorRow;
                targetCol = 0; // Default to column 0 for row selection
            }
            else if (sel instanceof ColumnSelection) {
                targetRow = 0; // Default to row 0 for column selection
                targetCol = sel.anchorCol;
            }
            if (targetRow === null || targetCol === null)
                return;
            /* begin overwrite edit with the typed char (caret hidden) */
            this.openEditor(targetRow, targetCol, e.key, /*overwrite=*/ true);
            e.preventDefault(); // block browser hotkeys (e.g. space scroll)
        };
        const wrap = document.getElementById("excel-wrapper");
        if (!wrap)
            throw new Error("#excel-wrapper not found");
        this.canvas = document.createElement("canvas");
        this.canvas.style.pointerEvents = "none";
        this.ctx = this.canvas.getContext("2d");
        this.ctx.scale(this.dpr, this.dpr);
        wrap.appendChild(this.canvas);
        this.history = new HistoryManager(this);
        // Create a clipped container for the editor
        this.editorContainer = document.createElement("div");
        this.editorContainer.style.position = "fixed";
        const scrollerRect = wrap.getBoundingClientRect();
        this.editorContainer.style.top = `${scrollerRect.top}px`;
        this.editorContainer.style.left = `${scrollerRect.left}px`;
        this.editorContainer.style.width = `${scrollerRect.width}px`;
        this.editorContainer.style.height = `${scrollerRect.height}px`;
        this.editorContainer.style.pointerEvents = "none"; // Let clicks pass through to grid
        // Clip the container to hide the editor when it goes under the headers.
        this.editorContainer.style.clipPath = `inset(${this.cfg.headerHeight}px 0 0 ${this.cfg.headerWidth}px)`;
        document.body.appendChild(this.editorContainer); // Append to body for reliable fixed positioning
        this.scroller = wrap;
        this.spacer = document.createElement("div");
        this.scroller.appendChild(this.spacer);
        /* scroll */
        this.scroller.addEventListener("scroll", () => {
            this.viewport.scrollX = this.scroller.scrollLeft;
            this.viewport.scrollY = this.scroller.scrollTop;
            // When auto-scrolling during a drag-select, the selection must be extended
            // even if the mouse is stationary. We use the last known pointer coordinates.
            if (this.isDragSelecting) {
                const pseudoEvent = {
                    clientX: this.pointer.x,
                    clientY: this.pointer.y,
                };
                const { row, col } = this.bodyCoordsFromEvent(pseudoEvent);
                const curSel = this.sel.get();
                if (curSel instanceof RangeSelection) {
                    curSel.extendTo(row, col);
                }
                else if (curSel instanceof ColumnSelection) {
                    curSel.extendTo(col);
                }
                else if (curSel instanceof RowSelection) {
                    curSel.extendTo(row);
                }
            }
            if (this.editing && this.editor && this.editingCell) {
                const { row, col } = this.editingCell;
                const x = this.cfg.headerWidth +
                    this.colW.slice(0, col).reduce((a, b) => a + b, 0);
                const y = this.cfg.headerHeight +
                    this.rowH.slice(0, row).reduce((a, b) => a + b, 0);
                // Calculate position relative to the container, accounting for scroll
                this.editor.style.left = `${x - this.viewport.scrollX}px`;
                this.editor.style.top = `${y - this.viewport.scrollY}px`;
            }
            this.rerenderGridAndStatusBar();
        });
        this.rowH = Array(this.cfg.rows).fill(this.cfg.defaultRowHeight);
        this.colW = Array(this.cfg.cols).fill(this.cfg.defaultColWidth);
        // Initial creation of the prefix sums
        this.updatePrefixSums();
        // Initialize TouchHandler and register handlers
        this.touchHandler = new TouchHandler(this); // Pass grid instance
        this.touchHandler.registerHandler(new CellRangeSelectionHandler());
        this.touchHandler.registerHandler(new ColumnSelectionHandler());
        this.touchHandler.registerHandler(new RowSelectionHandler());
        this.touchHandler.registerHandler(new ColumnResizeHandler());
        this.touchHandler.registerHandler(new RowResizeHandler());
        this.touchHandler.registerHandler(new RowContextMenuHandler());
        this.touchHandler.registerHandler(new ColumnContextMenuHandler());
        // this.scroller.addEventListener("dblclick", this.onDoubleClick);
        this.scroller.addEventListener("mousedown", (e) => this.touchHandler.onMouseDown(e));
        this.scroller.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            this.touchHandler.onContextMenu(e);
        });
        this.scroller.addEventListener("mousemove", (e) => {
            this.touchHandler.onMouseMove(e);
            // Also update pointer for autoscroller when moving within scroller
            this.updatePointer(e);
        });
        this.scroller.addEventListener("mouseup", (e) => this.touchHandler.onMouseUp(e));
        // CRITICAL: Global mouse tracking for full-window drag capability
        window.addEventListener("mouseup", (e) => {
            this.touchHandler.onMouseUp(e);
            // Stop autoscroll when mouse is released anywhere
            this.auto.stop();
            this.setIsDragSelecting(false);
        });
        window.addEventListener("mousemove", this.onGlobalMove);
        // Also delegate global mouse moves to TouchHandler for continuous drag selection
        window.addEventListener("mousemove", (e) => {
            this.touchHandler.onMouseMove(e);
        });
        this.scroller.addEventListener("dblclick", this.onDoubleClick);
        window.addEventListener("mousemove", this.onGlobalMove);
        window.addEventListener("mousemove", (e) => this.touchHandler.onMouseMove(e));
        /* Handle undo redo */
        window.addEventListener("keydown", this.handleUndoRedo, true);
        /* typing starts overwrite-edit */
        window.addEventListener("keydown", this.onTypeStart, { passive: false });
        /* Arrow-key navigation */
        this.navigator = new KeyNavigator(this.cfg, this.sel, this.scroller, () => this.editing, // tell navigator when editing is active
        () => this.rerenderGridAndStatusBar(), // let it trigger a repaint
        this.colW, // Pass colW
        this.rowH // Pass rowH
        );
        // this.auto = new AutoScroller(this.scroller, () => this.pointer);
        this.auto = new AutoScroller(this.scroller, () => this.pointer, () => {
            const canvasRect = this.canvas.getBoundingClientRect();
            const scrollerRect = this.scroller.getBoundingClientRect();
            return {
                left: scrollerRect.left,
                top: scrollerRect.top,
                right: canvasRect.right,
                bottom: canvasRect.bottom,
            };
        }, () => ({
            colW: this.getColWidth(0),
            rowH: this.getRowHeight(0),
        }));
        window.addEventListener("mousemove", this.onGlobalMove); // Keep global move for pointer tracking needed by auto-scroller
        new ResizeObserver((ent) => {
            const { width, height } = ent[0].contentRect;
            this.resize(width, height);
        }).observe(wrap);
        this.rend = new Renderer(this, this.ctx, this.cfg, this.data, this.colW, this.rowH);
        const fileInput = document.getElementById("file-input");
        if (fileInput) {
            fileInput.addEventListener("change", this.handleFileSelect);
        }
        // ADD listener for the new clear data button
        const clearDataBtn = document.getElementById("clear-data-btn");
        if (clearDataBtn) {
            clearDataBtn.addEventListener("click", this.clearData);
        }
        this.statusBar = new StatusBar();
    }
    // Public getters for handlers to access Grid's private members
    getScroller() {
        return this.scroller;
    }
    getViewport() {
        return this.viewport;
    }
    getConfig() {
        return this.cfg;
    }
    /**
     *
     * @param {number} col
     * @returns {number}
     */
    getColWidth(col) {
        return this.colW[col];
    }
    /**
     *
     * @param {number} col
     * @param {number} width
     */
    setColWidth(col, width) {
        this.colW[col] = width;
        this.updatePrefixSums(); // Regenerate cache
        this.updateSpacerSize();
    }
    /**
     *
     * @returns {string | undefined}
     */
    getDataStore() {
        return this.data;
    }
    /**
     *
     * @param {DataStore} newDataStore
     */
    setDataStore(newDataStore) {
        this.data = newDataStore;
        this.rend.setDataStore(newDataStore);
    }
    /**
     *
     * @param {number} row
     * @param {number} col
     * @param {string} value
     */
    setCellValue(row, col, value) {
        this.data.set(row, col, value);
    }
    /**
     *
     * @param {number} row
     * @returns {number}
     */
    getRowHeight(row) {
        return this.rowH[row];
    }
    /**
     *
     * @param {number} row
     * @param {number} height
     */
    setRowHeight(row, height) {
        this.rowH[row] = height;
        this.updatePrefixSums(); // Regenerate cache
        this.updateSpacerSize();
    }
    /**
     *
     * @returns {number}
     */
    getResizeMargin() {
        return this.RESIZE_MARGIN;
    }
    /**
     *
     * @returns {SelectionManager}
     */
    getSelectionManager() {
        return this.sel;
    }
    /**
     *
     * @returns {boolean}
     */
    isEditing() {
        return this.editing;
    }
    /**
     *
     * @returns {HTMLInputElement | undefined}
     */
    getEditor() {
        return this.editor;
    }
    /**
     *
     * @returns {AutoScroller}
     */
    getAutoScroller() {
        return this.auto;
    }
    /**
     *
     * @returns {ColWidths}
     */
    getColWidths() {
        return this.colW;
    }
    /**
     *
     * @returns {RowHeights}
     */
    getRowHeights() {
        return this.rowH;
    }
    rerenderGridAndStatusBar() {
        this.render();
        this.statusBar.update(this.data, this.sel.get(), this.cfg);
    }
    /**
     *
     * @returns {number[]}
     */
    getColPrefixSums() {
        return this.colPrefixSums;
    }
    /**
     *
     * @returns {number[]}
     */
    getRowPrefixSums() {
        return this.rowPrefixSums;
    }
    updatePrefixSums() {
        let currentSum = 0;
        this.colPrefixSums = this.colW.map((width) => (currentSum += width));
        currentSum = 0;
        this.rowPrefixSums = this.rowH.map((height) => (currentSum += height));
    }
    /**
     *
     * @param {string} value
     */
    setIsDragSelecting(value) {
        this.isDragSelecting = value;
        if (!value) {
            this.auto.stop();
        }
    }
    /**
     *
     * @returns {HistoryManager}
     */
    getHistoryManager() {
        return this.history;
    }
    /**
     * Clears the grid and populates it with data from an array of objects.
     * @param {any[]} data
     */
    loadData(data) {
        if (!Array.isArray(data) || data.length === 0) {
            alert("Invalid data format. Expected an array of objects.");
            return;
        }
        // Clear existing data first
        this.clearData();
        // Now, load the new data
        const headers = Object.keys(data[0]);
        headers.forEach((header, index) => {
            this.data.set(0, index, header);
        });
        data.forEach((row, rowIndex) => {
            headers.forEach((header, colIndex) => {
                const value = row[header];
                this.data.set(rowIndex + 1, colIndex, String(value ?? ""));
            });
        });
        this.rerenderGridAndStatusBar();
        console.log(`Successfully loaded ${data.length} records.`);
    }
    /**
     *
     * @param {number} rowIndex
     * @returns {boolean}
     */
    insertRow(rowIndex, height) {
        const lastRow = this.cfg.rows - 1;
        if (this.data.hasDataInRow(lastRow)) {
            alert("Cannot insert row: Last row contains data and will be shifted outside of sheet!!!");
            return false;
        }
        this.rowH.splice(rowIndex, 0, height);
        this.rowH.pop();
        this.updatePrefixSums();
        const entriesToMove = Array.from(this.data.getEntries())
            .map(([key, value]) => {
            const [r, c] = key.split(",").map(Number);
            return { r, c, value };
        })
            .filter((entry) => entry.r >= rowIndex);
        entriesToMove.sort((a, b) => b.r - a.r);
        for (const entry of entriesToMove) {
            this.setCellValue(entry.r + 1, entry.c, entry.value);
            this.setCellValue(entry.r, entry.c, "");
        }
        this.getSelectionManager().set(new RowSelection(rowIndex, rowIndex, rowIndex));
        this.rerenderGridAndStatusBar();
        return true;
    }
    /**
     *
     * @param {number} rowIndex
     */
    deleteRow(rowIndex) {
        this.rowH.splice(rowIndex, 1);
        this.rowH.push(this.cfg.defaultRowHeight);
        this.updatePrefixSums();
        const entriesToShift = Array.from(this.data.getEntries())
            .map(([key, value]) => {
            const [r, c] = key.split(",").map(Number);
            return { r, c, value };
        })
            .filter((entry) => entry.r >= rowIndex);
        entriesToShift.sort((a, b) => {
            if (a.r !== b.r)
                return a.r - b.r;
            return a.c - b.c;
        });
        for (const entry of entriesToShift) {
            const currentValue = entry.value;
            this.setCellValue(entry.r, entry.c, "");
            if (entry.r > rowIndex) {
                this.setCellValue(entry.r - 1, entry.c, currentValue);
            }
        }
        this.rerenderGridAndStatusBar();
    }
    /**
     *
     * @param {number} colIndex
     * @returns {boolean}
     */
    insertColumn(colIndex, width) {
        const lastCol = this.cfg.cols - 1;
        if (this.data.hasDataInCol(lastCol)) {
            alert("Cannot insert column...");
            return false;
        }
        this.colW.splice(colIndex, 0, width);
        this.colW.pop();
        this.updatePrefixSums();
        const entriesToMove = Array.from(this.data.getEntries())
            .map(([key, value]) => {
            const [r, c] = key.split(",").map(Number);
            return { r, c, value };
        })
            .filter((entry) => entry.c >= colIndex);
        entriesToMove.sort((a, b) => b.c - a.c);
        for (const entry of entriesToMove) {
            this.setCellValue(entry.r, entry.c + 1, entry.value);
            this.setCellValue(entry.r, entry.c, "");
        }
        this.getSelectionManager().set(new ColumnSelection(colIndex, colIndex, colIndex));
        this.rerenderGridAndStatusBar();
        return true;
    }
    /**
     *
     * @param {number} colIndex
     */
    deleteColumn(colIndex) {
        this.colW.splice(colIndex, 1);
        this.colW.push(this.cfg.defaultColWidth);
        this.updatePrefixSums();
        const entriesToShift = Array.from(this.data.getEntries())
            .map(([key, value]) => {
            const [r, c] = key.split(",").map(Number);
            return { r, c, value };
        })
            .filter((entry) => entry.c >= colIndex);
        entriesToShift.sort((a, b) => {
            if (a.c !== b.c)
                return a.c - b.c;
            return a.r - b.r;
        });
        for (const entry of entriesToShift) {
            const currentValue = entry.value;
            this.setCellValue(entry.r, entry.c, "");
            if (entry.c > colIndex) {
                this.setCellValue(entry.r, entry.c - 1, currentValue);
            }
        }
        this.rerenderGridAndStatusBar();
    }
    /* ───────────────────────────────  Resizing  ────────────────────────── */
    /**
     *
     * @param {number} w
     * @param {number} h
     */
    resize(w, h) {
        const newDpr = window.devicePixelRatio || 1;
        if (newDpr !== this.dpr) {
            this.dpr = newDpr;
            this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        }
        this.canvas.width = Math.floor(w * this.dpr);
        this.canvas.height = Math.floor(h * this.dpr);
        this.viewport.width = w;
        this.viewport.height = h;
        this.updateSpacerSize();
        this.render();
    }
    updateSpacerSize() {
        // Use the fast, cached total from the prefix sum array
        const totalColWidth = this.colPrefixSums[this.colPrefixSums.length - 1] || 0;
        const totalRowHeight = this.rowPrefixSums[this.rowPrefixSums.length - 1] || 0;
        this.spacer.style.width = `${this.cfg.headerWidth + totalColWidth}px`;
        this.spacer.style.height = `${this.cfg.headerHeight + totalRowHeight}px`;
    }
    /* ─────────────────────────────  Rendering  ─────────────────────────── */
    render() {
        /*draw at correct dpr */
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        /* Clear entire Hi‑DPI backing store */
        this.ctx.clearRect(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr);
        this.rend.draw(this.viewport, this.sel.get());
    }
    /**Select a single cell and scroll it fully into view */
    /**
     *
     * @param {number} row
     * @param {number} col
     */
    selectCellAndReveal(row, col) {
        this.sel.set(new RangeSelection(row, col, row, col, row, col)); // Use RangeSelection for single cell
        /* ---------- Auto-scroll ---------- */
        const bodyX = this.colPrefixSums[col - 1] || 0;
        const bodyY = this.rowPrefixSums[row - 1] || 0;
        const cellW = this.colW[col];
        const cellH = this.rowH[row];
        const viewL = this.scroller.scrollLeft;
        const viewT = this.scroller.scrollTop;
        const viewR = viewL + (this.scroller.clientWidth - this.cfg.headerWidth);
        const viewB = viewT + (this.scroller.clientHeight - this.cfg.headerHeight);
        let newL = viewL;
        let newT = viewT;
        // Adjust horizontal scroll if cell is out of view
        if (bodyX < viewL) {
            newL = bodyX;
        }
        else if (bodyX + cellW > viewR) {
            newL = bodyX + cellW - (viewR - viewL);
        }
        // Adjust vertical scroll if cell is out of view
        if (bodyY < viewT) {
            newT = bodyY;
        }
        else if (bodyY + cellH > viewB) {
            newT = bodyY + cellH - (viewB - viewT);
        }
        if (newL !== viewL || newT !== viewT) {
            this.scroller.scrollTo({ left: newL, top: newT, behavior: "auto" });
        }
    }
    /**Pointer updates *inside* the wrapper only*/
    /**
     *
     * @param {MouseEvent} e
     */
    updatePointer(e) {
        this.pointer.x = e.clientX;
        this.pointer.y = e.clientY;
    }
    /**
     *
     * @param {number} v
     * @param {number} min
     * @param {number} max
     * @returns {number}
     */
    clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }
    /**
     * Converts mouse event coordinates to grid body (row, col) coordinates.
     * This method is public so handlers can use it.
     * @param {MouseEvent} e The MouseEvent.
     * @returns { row: number; col: number }   An object with `row` and `col` coordinates within the grid body.
     */
    bodyCoordsFromEvent(e) {
        const rect = this.scroller.getBoundingClientRect();
        const localX = e.clientX - rect.left;
        const localY = e.clientY - rect.top;
        let colX = this.cfg.headerWidth;
        let col = 0;
        let xOffset = localX + this.viewport.scrollX;
        for (; col < this.cfg.cols; col++) {
            colX += this.colW[col];
            if (xOffset < colX)
                break;
        }
        let rowY = this.cfg.headerHeight;
        let row = 0;
        let yOffset = localY + this.viewport.scrollY;
        for (; row < this.cfg.rows; row++) {
            rowY += this.rowH[row];
            if (yOffset < rowY)
                break;
        }
        /* clamp to sheet edges */
        return {
            row: this.clamp(row, 0, this.cfg.rows - 1),
            col: this.clamp(col, 0, this.cfg.cols - 1),
        };
    }
    /* ──────────────────────── Editing a cell ─────────────────────── */
    /**
     *
     * @param {number} row
     * @param {number} col
     * @param {string} initialChar
     * @param {boolean} overwrite
     * @returns
     */
    /* overwrite = true  → start with initialChar only and hide caret */
    openEditor(row, col, initialChar = "", overwrite = false) {
        /* ── If dragging don't open editor ───────────────── */
        // Logic for dragAnchor and dragHeaderMode removed, as these are now in handlers
        // You might need to add a check here if any handler is currently "active" in a drag operation
        // For simplicity, let's assume if editing, we shouldn't open another editor.
        this.selectCellAndReveal(row, col);
        if (this.editor || this.isDragSelecting)
            return;
        const initVal = overwrite ? initialChar : this.data.get(row, col) ?? "";
        this.editing = true;
        this.editingCell = { row, col };
        const input = document.createElement("input");
        input.value = initVal;
        input.className = "cell-editor";
        input.style.position = "absolute";
        input.style.font = "12px system-ui, sans-serif";
        input.style.border = "2px solid #107c41";
        input.style.outline = "none";
        input.style.boxSizing = "border-box";
        input.style.background = "#fff";
        input.style.zIndex = "10";
        /* stop clicks bubbling out of the editor */
        input.addEventListener("mousedown", (ev) => ev.stopPropagation(), true);
        const x = this.colPrefixSums[col - 1] || 0;
        const y = this.rowPrefixSums[row - 1] || 0;
        const width = this.colW[col];
        const height = this.rowH[row];
        // Position relative to the viewport (accounting for scroll)
        input.style.left = `${this.cfg.headerWidth + x - this.viewport.scrollX}px`;
        input.style.top = `${this.cfg.headerHeight + y - this.viewport.scrollY}px`;
        input.style.width = `${width + 0.5}px`;
        input.style.height = `${height + 0.5}px`;
        this.editorContainer.appendChild(input); // Append to the new clipped container
        input.focus();
        if (overwrite) {
            /* place caret after the seeded char but DON’T select it */
            const len = input.value.length;
            input.setSelectionRange(len, len);
        }
        else {
            /* double‑click / F2 edit keeps Excel behaviour (full select) */
            input.select();
        }
        this.editor = input;
        input.addEventListener("keydown", (ev) => {
            if (ev.key === "Enter") {
                /* save the value */
                // this.data.set(row, col, input.value.trim());
                /* close editor (also repaints) */
                this.commitEdit();
                /* select cell one row below and scroll into view */
                // const nextRow = Math.min(row , this.cfg.rows - 1);
                const nextRow = ev.shiftKey
                    ? Math.max(row, 0)
                    : Math.min(row, this.cfg.rows - 1);
                this.selectCellAndReveal(nextRow, col);
                /* final repaint with the new selection */
                // this.render();
                ev.preventDefault(); // stop the newline the browser would insert
            }
            else if (ev.key === "Tab") {
                // this.data.set(row, col, input.value.trim());
                // closes editor & repaint
                const nextCol = ev.shiftKey
                    ? Math.max(col, 0) // Shift+Tab ⇦
                    : Math.min(col, this.cfg.cols - 1); // Tab      ⇒
                this.selectCellAndReveal(row, nextCol); // jump ⇦ / ⇒
                // this.render();
                this.commitEdit();
                ev.preventDefault(); // keep focus on grid
            }
            else if (ev.key === "ArrowDown" ||
                ev.key === "ArrowUp" ||
                ev.key === "ArrowLeft" ||
                ev.key === "ArrowRight") {
                /* save current value */
                // this.data.set(row, col, input.value.trim());
                // closes editor & repaint
                /* compute next cell */
                let nextRow = row;
                let nextCol = col;
                if (ev.key === "ArrowDown")
                    nextRow = Math.min(row, this.cfg.rows - 1);
                if (ev.key === "ArrowUp")
                    nextRow = Math.max(row, 0);
                if (ev.key === "ArrowRight")
                    nextCol = Math.min(col, this.cfg.cols - 1);
                if (ev.key === "ArrowLeft")
                    nextCol = Math.max(col, 0);
                /* move blue outline there */
                this.selectCellAndReveal(nextRow, nextCol);
                // this.render();
                this.commitEdit();
                ev.preventDefault(); // stop caret movement in input
            }
            else if (ev.key === "Escape") {
                this.commitEdit(); // cancel edit
            }
        });
        input.addEventListener("blur", () => {
            // this.data.set(row, col, input.value.trim());
            this.commitEdit();
            // this.render();
        });
    }
    commitEdit() {
        const el = this.editor;
        if (!el)
            return;
        const { row, col } = this.editingCell;
        const newValue = el.value.trim();
        // Create the command. Its constructor still captures the old value correctly.
        const command = new EditCellCommand(row, col, newValue, this);
        // Let the history manager handle both executing and recording the command.
        // This single line replaces the manual `this.data.set()` call.
        this.history.addAndExecute(command);
        // --- The rest of the method is for cleaning up the UI ---
        this.editor = undefined;
        this.editing = false;
        this.editingCell = null;
        if (el.parentNode)
            el.parentNode.removeChild(el);
    }
}
