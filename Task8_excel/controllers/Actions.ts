// actions.ts

import { DataStore } from "./DataStore.js";
import { Grid } from "./Grid.js";

/**
 * A blueprint for any action that can be undone and redone.
 */
export interface GridAction {
  /**
   * Performs the action for the first time, or when redoing.
   */
  execute(grid: Grid): void;

  /**
   * Reverses the action.
   */
  undo(grid: Grid): void;
}

/**
 * Command for a single cell edit.
 */
export class EditCellCommand implements GridAction {
  private readonly oldValue: string | undefined;
  constructor(
    private readonly row: number,
    private readonly col: number,
    private readonly newValue: string,
    grid: Grid // A tool to capture the "before" state
  ) {
    // Capture the state of the cell *before* the edit is finalized.
    this.oldValue = grid.getDataStore().get(row, col);
  }

  /**
   *
   * @param {Grid} grid
   */
  public execute(grid: Grid): void {
    grid.setCellValue(this.row, this.col, this.newValue);
    grid.rerenderGridAndStatusBar();
  }

  /**
   *
   * @param {Grid} grid
   */
  public undo(grid: Grid): void {
    grid.setCellValue(this.row, this.col, this.oldValue ?? "");
    grid.rerenderGridAndStatusBar();
  }
}

/**
 * Command for resizing a column. Captures the start and end widths.
 */
export class ResizeColumnCommand implements GridAction {
  // We pass old/new widths directly to avoid timing issues with the grid state.
  constructor(
    private readonly col: number,
    private readonly newWidth: number,
    private readonly oldWidth: number
  ) {}

  /**
   *
   * @param {Grid} grid
   */
  public execute(grid: Grid): void {
    grid.setColWidth(this.col, this.newWidth);
    grid.rerenderGridAndStatusBar();
  }

  /**
   *
   * @param {Grid} grid
   */
  public undo(grid: Grid): void {
    grid.setColWidth(this.col, this.oldWidth);
    grid.rerenderGridAndStatusBar();
  }
}

/**
 * Command for resizing a row. Captures the start and end heights.
 */
export class ResizeRowCommand implements GridAction {
  constructor(
    private readonly row: number,
    private readonly newHeight: number,
    private readonly oldHeight: number
  ) {}

  /**
   *
   * @param {Grid} grid
   */
  public execute(grid: Grid): void {
    grid.setRowHeight(this.row, this.newHeight);
    grid.rerenderGridAndStatusBar();
  }

  /**
   *
   * @param {Grid} grid
   */
  public undo(grid: Grid): void {
    grid.setRowHeight(this.row, this.oldHeight);
    grid.rerenderGridAndStatusBar();
  }
}

/**
 * Command for bulk data load operation.
 */
export class LoadDataCommand implements GridAction {
  private readonly oldDataStore: DataStore;

  /**
   *
   * @param {any []} newData
   * @param {Grid} grid
   */
  constructor(private readonly newData: any[], grid: Grid) {
    this.oldDataStore = grid.getDataStore().clone();
  }

  /**
   *
   * @param {Grid} grid
   */
  public execute(grid: Grid): void {
    grid.clearData();

    if (!Array.isArray(this.newData) || this.newData.length === 0) {
      console.warn("LoadDataCommand executed with invalid data");
      return;
    }

    const headers = Object.keys(this.newData[0]);

    headers.forEach((header, index) => {
      grid.setCellValue(0, index, header);
    });

    this.newData.forEach((row, rowIndex) => {
      headers.forEach((header, colIndex) => {
        const value = row[header];
        grid.setCellValue(rowIndex + 1, colIndex, String(value ?? ""));
      });
    });

    grid.rerenderGridAndStatusBar();
  }

  /**
   *
   * @param {Grid} grid
   */
  public undo(grid: Grid): void {
    grid.setDataStore(this.oldDataStore.clone());
    grid.rerenderGridAndStatusBar();
  }
}

/**
 * Command for inserting a row by shifting data down.
 */

export class InsertRowCommand implements GridAction {
  constructor(
    private readonly rowIndex: number,
    private readonly heightToInsert: number
  ) {}

  public execute(grid: Grid): void {
    grid.insertRow(this.rowIndex,this.heightToInsert);
  }

  public undo(grid: Grid): void {
    grid.deleteRow(this.rowIndex);
  }
}

/**
 * Command for deleting a row by shifting data up.
 */
export class DeleteRowCommand implements GridAction {
  private readonly deletedData = new Map<number, string>();
  private readonly deletedHeight:number;
  constructor(private readonly rowIndex: number,grid:Grid) {
    this.deletedHeight = grid.getRowHeight(this.rowIndex);
  }

  public execute(grid: Grid): void {
    for (let c = 0; c < grid.getConfig().cols; c++) {
      const val = grid.getDataStore().get(this.rowIndex, c);
      if (val) {
        this.deletedData.set(c, val);
      }
    }
    grid.deleteRow(this.rowIndex);
  }

  public undo(grid: Grid): void {
    grid.insertRow(this.rowIndex,this.deletedHeight);
    this.deletedData.forEach((value, colIndex) => {
      grid.setCellValue(this.rowIndex, colIndex, value);
    });
    grid.rerenderGridAndStatusBar();
  }
}

/**
 * Command for inserting a column by shifting data right.
 */
export class InsertColumnCommand implements GridAction {
  /**
   * 
   * @param {number} colIndex 
   * @param {number} widthToInsert 
   */
  constructor(
    private readonly colIndex: number,
    private readonly widthToInsert: number
  ) {}

  /**
   * 
   * @param {Grid} grid 
   */
  public execute(grid: Grid): void {
    grid.insertColumn(this.colIndex,this.widthToInsert);
  }

  /**
   * 
   * @param {Grid} grid 
   */
  public undo(grid: Grid): void {
    grid.deleteColumn(this.colIndex);
  }
}

/**
 * Command for deleting a column by shifting data left.
 */
export class DeleteColumnCommand implements GridAction {
  private readonly deletedData = new Map<number, string>();
  private readonly deletedWidth: number;

  /**
   * 
   * @param {number} colIndex 
   * @param {Grid} grid 
   */
  constructor(private readonly colIndex: number,grid:Grid) {
    this.deletedWidth = grid.getColWidth(colIndex);
  }

  /**
   * 
   * @param {Grid} grid 
   */
  public execute(grid: Grid): void {
    for (let r = 0; r < grid.getConfig().rows; r++) {
      const val = grid.getDataStore().get(r, this.colIndex);
      if (val) {
        this.deletedData.set(r, val);
      }
    }
    grid.deleteColumn(this.colIndex);
  }

  /**
   * 
   * @param {Grid} grid 
   */
  public undo(grid: Grid): void {
    grid.insertColumn(this.colIndex,this.deletedWidth);
    this.deletedData.forEach((value, rowIndex) => {
      grid.setCellValue(rowIndex, this.colIndex, value);
    });
    grid.rerenderGridAndStatusBar();
  }
}
