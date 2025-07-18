import { ColumnSelection } from "../Selection.js";
export class ColumnSelectionHandler {
    constructor() {
        this.grid = null;
        this.headerAnchor = null;
        this.autoScroller = null;
    }
    /**
     *
     * @param {Grid} grid
     * @returns {void}
     */
    setGrid(grid) {
        this.grid = grid;
        if (this.grid) {
            this.autoScroller = this.grid.getAutoScroller();
        }
    }
    /**
     * Determines if the mouse event is within a column header and not a resize area.
     * @param {MouseEvent} e The MouseEvent.
     * @returns {boolean} True if the event is within a selectable column header, false otherwise.
     */
    hitTest(e) {
        if (!this.grid || e.button !== 0)
            return false;
        const rect = this.grid.getScroller().getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cfg = this.grid.getConfig();
        const colW = this.grid.getColWidths();
        const scrollX = this.grid.getViewport().scrollX;
        const resizeMargin = this.grid.getResizeMargin();
        // Check if within column header region
        if (x >= cfg.headerWidth && y < cfg.headerHeight) {
            // Check if it's a resize area
            let cumWidth = cfg.headerWidth;
            for (let c = 0; c < cfg.cols; c++) {
                cumWidth += colW[c];
                if (Math.abs(x + scrollX - cumWidth) < resizeMargin) {
                    return false; // It's a resize area, not a selection area
                }
            }
            return true; // It's a column header and not a resize area
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
        const scrollX = this.grid.getViewport().scrollX;
        const cfg = this.grid.getConfig();
        const colW = this.grid.getColWidths();
        let col = null;
        let acc = cfg.headerWidth;
        for (let c = 0; c < cfg.cols; c++) {
            acc += colW[c];
            if (x + scrollX < acc) {
                col = c;
                break;
            }
        }
        if (col !== null) {
            this.grid.commitEdit();
            this.headerAnchor = col;
            this.grid.getSelectionManager().set(new ColumnSelection(col, col, col));
            this.grid.setIsDragSelecting("x");
            // this.grid.render();
            this.grid.rerenderGridAndStatusBar();
        }
    }
    /**
     *
     * @param {MouseEvent} e
     * @returns {void}
     */
    onPointerMove(e) {
        if (!this.grid || this.grid.isEditing() || this.headerAnchor === null)
            return;
        // this.grid.getScroller().style.cursor = 'default';
        const rect = this.grid.getScroller().getBoundingClientRect();
        const x = e.clientX - rect.left;
        const scrollX = this.grid.getViewport().scrollX;
        const cfg = this.grid.getConfig();
        const colW = this.grid.getColWidths();
        let col = null;
        let acc = cfg.headerWidth;
        for (let c = 0; c < cfg.cols; c++) {
            acc += colW[c];
            if (x + scrollX < acc) {
                col = c;
                break;
            }
        }
        if (col !== null) {
            const cur = this.grid.getSelectionManager().get();
            if (cur instanceof ColumnSelection) {
                cur.extendTo(col);
                this.grid.getSelectionManager().set(cur);
            }
            else {
                this.grid.getSelectionManager().set(new ColumnSelection(Math.min(this.headerAnchor, col), Math.max(this.headerAnchor, col), this.headerAnchor));
            }
            this.grid.rerenderGridAndStatusBar();
        }
    }
    /**
     *
     * @returns {void}
     */
    onPointerUp() {
        if (!this.grid)
            return;
        this.headerAnchor = null;
        if (this.autoScroller) {
            this.autoScroller.stop();
        }
        this.grid.setIsDragSelecting(false);
        // this.grid.render();
        this.grid.rerenderGridAndStatusBar();
    }
    /**
     *
     * @param {MouseEvent} e
     * @returns {void}
     */
    setCursor(e) {
        if (this.grid) {
            const svg = `<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><polygon points="10,15 4,8 16,8" fill="black"/></svg>`;
            const encodedSvg = encodeURIComponent(svg);
            this.grid.getScroller().style.cursor = `url('data:image/svg+xml;utf8,${encodedSvg}') 10 10, auto`;
        }
    }
}
