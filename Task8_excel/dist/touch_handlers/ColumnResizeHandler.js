// ColumnResizeHandler.ts
import { ResizeColumnCommand } from "../Actions.js";
export class ColumnResizeHandler {
    constructor() {
        this.grid = null;
        this.isResizingCol = false;
        this.resizingColIndex = -1;
        this.startX = 0;
        this.initialWidth = 0;
    }
    /**
     *
     * @param {Grid} grid
     */
    setGrid(grid) {
        this.grid = grid;
    }
    /**
     *
     * @param {MouseEvent} e
     * @returns {boolean}
     */
    hitTest(e) {
        if (!this.grid || e.button !== 0)
            return false;
        const rect = this.grid.getScroller().getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const scrollX = this.grid.getViewport().scrollX;
        const inColHeader = y < this.grid.getConfig().headerHeight;
        if (inColHeader) {
            let cumWidth = this.grid.getConfig().headerWidth;
            for (let c = 0; c < this.grid.getConfig().cols; c++) {
                cumWidth += this.grid.getColWidth(c);
                if (Math.abs(x + scrollX - cumWidth) < this.grid.getResizeMargin()) {
                    return true;
                }
            }
        }
        return false;
    }
    /**
     *
     * @param {MouseEvent} e
     * @returns {void}
     */
    onPointerDown(e) {
        if (!this.grid)
            return;
        const rect = this.grid.getScroller().getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const scrollX = this.grid.getViewport().scrollX;
        const inColHeader = y < this.grid.getConfig().headerHeight;
        if (inColHeader) {
            let cumWidth = this.grid.getConfig().headerWidth;
            for (let c = 0; c < this.grid.getConfig().cols; c++) {
                cumWidth += this.grid.getColWidth(c);
                if (Math.abs(x + scrollX - cumWidth) < this.grid.getResizeMargin()) {
                    this.isResizingCol = true;
                    this.resizingColIndex = c;
                    this.startX = x;
                    this.initialWidth = this.grid.getColWidth(c);
                    break;
                }
            }
        }
    }
    /**
     *
     * @param {MouseEvent} e
     * @returns {void}
     */
    onPointerMove(e) {
        if (!this.grid)
            return;
        if (this.isResizingCol) {
            const dx = e.clientX -
                this.grid.getScroller().getBoundingClientRect().left -
                this.startX;
            this.grid.setColWidth(this.resizingColIndex, Math.max(20, this.initialWidth + dx));
            this.grid.render();
        }
    }
    /**
     *
     * @returns {void}
     */
    onPointerUp() {
        if (!this.grid || !this.isResizingCol)
            return;
        const finalWidth = this.grid.getColWidth(this.resizingColIndex);
        if (finalWidth !== this.initialWidth) {
            // Create the command, but don't execute it here.
            const command = new ResizeColumnCommand(this.resizingColIndex, finalWidth, this.initialWidth);
            // Tell the history manager to execute and record it.
            this.grid.getHistoryManager().addAndExecute(command);
        }
        this.isResizingCol = false;
        this.resizingColIndex = -1;
        // this.grid.render(); // Ensure final render
    }
    /**
     *
     * @param {MouseEvent} e
     */
    setCursor(e) {
        if (this.grid) {
            this.grid.getScroller().style.cursor = "col-resize";
        }
    }
}
