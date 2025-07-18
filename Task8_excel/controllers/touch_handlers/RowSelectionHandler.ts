// RowSelectionHandler.ts
import { Grid } from "../Grid.js";
import { PointerHandler } from "./TouchHandler.js";
import { RowSelection } from "../Selection.js";
import { AutoScroller } from "../AutoScroller.js";

export class RowSelectionHandler implements PointerHandler {
  private grid: Grid | null = null;
  private headerAnchor: number | null = null;
  private autoScroller: AutoScroller | null = null;

  /**
   * 
   * @param {Grid} grid 
   * @returns {void}
   */
  setGrid(grid: Grid): void {
    this.grid = grid;
    if (this.grid) {
      this.autoScroller = this.grid.getAutoScroller();
    }
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

    const cfg = this.grid.getConfig();
    const rowH = this.grid.getRowHeights();
    const scrollY = this.grid.getViewport().scrollY;
    const resizeMargin = this.grid.getResizeMargin();

    // Check if within row header region
    if (x < cfg.headerWidth && y >= cfg.headerHeight) {
      // Check if it's a resize area
      let cumHeight = cfg.headerHeight;
      for (let r = 0; r < cfg.rows; r++) {
        cumHeight += rowH[r];
        if (Math.abs(y + scrollY - cumHeight) < resizeMargin) {
          return false;
        }
      }
      return true; 
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
    const y = e.clientY - rect.top;
    const scrollY = this.grid.getViewport().scrollY;
    const cfg = this.grid.getConfig();
    const rowH = this.grid.getRowHeights();

    let row = null;
    let acc = cfg.headerHeight;
    for (let r = 0; r < cfg.rows; r++) {
      acc += rowH[r];
      if (y + scrollY < acc) {
        row = r;
        break;
      }
    }

    if (row !== null) {
      this.grid.commitEdit();
      this.headerAnchor = row;
      this.grid.getSelectionManager().set(new RowSelection(row, row, row));
      this.grid.setIsDragSelecting("y");
      // this.grid.render();
      this.grid.rerenderGridAndStatusBar()
    }
  }

  /**
   * 
   * @param {MouseEvent} e 
   * @returns {void}
   */
  onPointerMove(e: MouseEvent): void {
    if (!this.grid || this.grid.isEditing() || this.headerAnchor === null) return;

    const rect = this.grid.getScroller().getBoundingClientRect();
    const y = e.clientY - rect.top;
    const scrollY = this.grid.getViewport().scrollY;
    const cfg = this.grid.getConfig();
    const rowH = this.grid.getRowHeights();

    let row = null;
    let acc = cfg.headerHeight;
    for (let r = 0; r < cfg.rows; r++) {
      acc += rowH[r];
      if (y + scrollY < acc) {
        row = r;
        break;
      }
    }

    if (row !== null) {
      const cur = this.grid.getSelectionManager().get();
      if (cur instanceof RowSelection) {
        cur.extendTo(row);
        this.grid.getSelectionManager().set(cur);
      } else {
        this.grid.getSelectionManager().set(
          new RowSelection(
            Math.min(this.headerAnchor, row),
            Math.max(this.headerAnchor, row),
            this.headerAnchor
          )
        );
      }
      
      this.grid.rerenderGridAndStatusBar();
    }
  }

  /**
   * 
   * @returns {void}
   */
  onPointerUp(): void {
    if (!this.grid) return;
    this.headerAnchor = null;
    if (this.autoScroller) {
      this.autoScroller.stop();
    }
    this.grid.setIsDragSelecting(false);
    this.grid.rerenderGridAndStatusBar()
  }

  /**
   * 
   * @param {MouseEvent} e 
   * @returns {void}
   */
  setCursor(e: MouseEvent): void {
      if(this.grid ) {
        const svg = `<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><polygon points="15,10 8,4 8,16" fill="black"/></svg>`;
      const encodedSvg = encodeURIComponent(svg);
      this.grid.getScroller().style.cursor = `url('data:image/svg+xml;utf8,${encodedSvg}') 10 10, auto`;
      }
  }
}
