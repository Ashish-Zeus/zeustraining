// RowResizeHandler.ts
import { Grid } from "../Grid.js";
import { PointerHandler } from "./TouchHandler.js";
import { ResizeRowCommand } from "../Actions.js";

export class RowResizeHandler implements PointerHandler {
  private grid: Grid | null = null;
  private isResizingRow = false;
  private resizingRowIndex = -1;
  private startY = 0;
  private initialHeight = 0;

  /**
   *
   * @param {Grid} grid
   */
  setGrid(grid: Grid): void {
    this.grid = grid;
  }

  /**
   *
   * @param {MouseEvent} e
   * @returns {boolean}
   */
  hitTest(e: MouseEvent): boolean {
    if (!this.grid || e.button!==0) return false;
    const rect = this.grid.getScroller().getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const scrollY = this.grid.getViewport().scrollY;
    const inRowHeader = x < this.grid.getConfig().headerWidth;

    if (inRowHeader) {
      let cumHeight = this.grid.getConfig().headerHeight;
      for (let r = 0; r < this.grid.getConfig().rows; r++) {
        cumHeight += this.grid.getRowHeight(r);
        if (Math.abs(y + scrollY - cumHeight) < this.grid.getResizeMargin()) {
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
  onPointerDown(e: MouseEvent): void {
    if (!this.grid) return;
    const rect = this.grid.getScroller().getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const scrollY = this.grid.getViewport().scrollY;
    const inRowHeader = x < this.grid.getConfig().headerWidth;

    if (inRowHeader) {
      let cumHeight = this.grid.getConfig().headerHeight;
      for (let r = 0; r < this.grid.getConfig().rows; r++) {
        cumHeight += this.grid.getRowHeight(r);
        if (Math.abs(y + scrollY - cumHeight) < this.grid.getResizeMargin()) {
          this.isResizingRow = true;
          this.resizingRowIndex = r;
          this.startY = y;
          this.initialHeight = this.grid.getRowHeight(r);
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
  onPointerMove(e: MouseEvent): void {
    if (!this.grid) return;

    if (this.isResizingRow) {
      const dy =
        e.clientY -
        this.grid.getScroller().getBoundingClientRect().top -
        this.startY;
      this.grid.setRowHeight(
        this.resizingRowIndex,
        Math.max(20, this.initialHeight + dy)
      );
      this.grid.render();
    }
  }

  /**
   *
   * @returns {void}
   */
  onPointerUp(): void {
    if (!this.grid || !this.isResizingRow) return;
    const finalHeight = this.grid.getRowHeight(this.resizingRowIndex);
    if (finalHeight !== this.initialHeight) {
      const command = new ResizeRowCommand(
        this.resizingRowIndex,
        finalHeight,
        this.initialHeight
      );

      this.grid.getHistoryManager().addAndExecute(command);
    }
    this.isResizingRow = false;
    this.resizingRowIndex = -1;
  }

  /**
   *
   * @param {MouseEvent} e
   * @returns {void}
   */
  setCursor(e: MouseEvent): void {
    if (this.grid) {
      this.grid.getScroller().style.cursor = "row-resize";
    }
  }
}
