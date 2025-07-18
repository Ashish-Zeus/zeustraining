import { RangeSelection } from "../Selection.js";
export class CellRangeSelectionHandler {
    constructor() {
        this.grid = null;
        this.dragAnchor = null;
    }
    /**
     *
     * @param {Grid} grid
     * @returns {void}
     */
    setGrid(grid) {
        this.grid = grid;
    }
    /**
     * Determines if the mouse event is within the grid body (cell area).
     * @param {MouseEvent} e
     * @returns {boolean}
     */
    hitTest(e) {
        if (!this.grid || e.button !== 0)
            return false;
        const rect = this.grid.getScroller().getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cfg = this.grid.getConfig();
        // Check if the coordinates are within the body region
        return x >= cfg.headerWidth && y >= cfg.headerHeight;
    }
    /**
     *
     * @param {MouseEvent} e
     * @returns {void}
     */
    onPointerDown(e) {
        if (!this.grid)
            return;
        // Abort if the click is on a scrollbar
        const rect = this.grid.getScroller().getBoundingClientRect();
        const onVScroll = e.clientX > rect.left + this.grid.getScroller().clientWidth;
        const onHScroll = e.clientY > rect.top + this.grid.getScroller().clientHeight;
        if (onVScroll || onHScroll)
            return;
        if (this.grid.isEditing()) {
            if (e.target === this.grid.getEditor()) {
                return; // Click is inside the editor – let the user type
            }
            this.grid.commitEdit(); // Clicked elsewhere → commit current edit first
        }
        const { row, col } = this.grid.bodyCoordsFromEvent(e);
        if (row !== null && col !== null) {
            this.grid.getSelectionManager().set(new RangeSelection(row, col, row, col, row, col));
            this.dragAnchor = { row, col };
            this.grid.setIsDragSelecting("both");
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
        if (!this.grid || this.grid.isEditing())
            return;
        if (this.dragAnchor) {
            // The autoscroller is automatically started by the global mouse move handler
            // when isDragSelecting is true, so we don't need to manually start it here
            const { row, col } = this.grid.bodyCoordsFromEvent(e);
            const curSel = this.grid.getSelectionManager().get();
            if (curSel instanceof RangeSelection) {
                curSel.extendTo(row, col);
                this.grid.getSelectionManager().set(curSel);
            }
            else {
                // This case should ideally not happen if dragAnchor is set and selection is already a RangeSelection
                // but as a fallback, create a new one.
                this.grid.getSelectionManager().set(new RangeSelection(this.dragAnchor.row, this.dragAnchor.col, row, col, this.dragAnchor.row, this.dragAnchor.col));
            }
            // this.grid.render();
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
        this.dragAnchor = null;
        this.grid.setIsDragSelecting(false); // This will stop autoscroll
        // this.grid.render(); // Ensure final render
        this.grid.rerenderGridAndStatusBar();
    }
    /**
     *
     * @param {MouseEvent} e
     */
    setCursor(e) {
        if (this.grid) {
            this.grid.getScroller().style.cursor = 'cell';
        }
    }
}
