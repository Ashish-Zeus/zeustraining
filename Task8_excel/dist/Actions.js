// actions.ts
/**
 * Command for a single cell edit.
 */
export class EditCellCommand {
    constructor(row, col, newValue, grid // A tool to capture the "before" state
    ) {
        this.row = row;
        this.col = col;
        this.newValue = newValue;
        // Capture the state of the cell *before* the edit is finalized.
        this.oldValue = grid.getDataStore().get(row, col);
    }
    /**
     *
     * @param {Grid} grid
     */
    execute(grid) {
        grid.setCellValue(this.row, this.col, this.newValue);
        grid.rerenderGridAndStatusBar();
    }
    /**
     *
     * @param {Grid} grid
     */
    undo(grid) {
        grid.setCellValue(this.row, this.col, this.oldValue ?? "");
        grid.rerenderGridAndStatusBar();
    }
}
/**
 * Command for resizing a column. Captures the start and end widths.
 */
export class ResizeColumnCommand {
    // We pass old/new widths directly to avoid timing issues with the grid state.
    constructor(col, newWidth, oldWidth) {
        this.col = col;
        this.newWidth = newWidth;
        this.oldWidth = oldWidth;
    }
    /**
     *
     * @param {Grid} grid
     */
    execute(grid) {
        grid.setColWidth(this.col, this.newWidth);
        grid.rerenderGridAndStatusBar();
    }
    /**
     *
     * @param {Grid} grid
     */
    undo(grid) {
        grid.setColWidth(this.col, this.oldWidth);
        grid.rerenderGridAndStatusBar();
    }
}
/**
 * Command for resizing a row. Captures the start and end heights.
 */
export class ResizeRowCommand {
    constructor(row, newHeight, oldHeight) {
        this.row = row;
        this.newHeight = newHeight;
        this.oldHeight = oldHeight;
    }
    /**
     *
     * @param {Grid} grid
     */
    execute(grid) {
        grid.setRowHeight(this.row, this.newHeight);
        grid.rerenderGridAndStatusBar();
    }
    /**
     *
     * @param {Grid} grid
     */
    undo(grid) {
        grid.setRowHeight(this.row, this.oldHeight);
        grid.rerenderGridAndStatusBar();
    }
}
/**
 * Command for bulk data load operation.
 */
export class LoadDataCommand {
    /**
     *
     * @param {any []} newData
     * @param {Grid} grid
     */
    constructor(newData, grid) {
        this.newData = newData;
        this.oldDataStore = grid.getDataStore().clone();
    }
    /**
     *
     * @param {Grid} grid
     */
    execute(grid) {
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
    undo(grid) {
        grid.setDataStore(this.oldDataStore.clone());
        grid.rerenderGridAndStatusBar();
    }
}
/**
 * Command for inserting a row by shifting data down.
 */
export class InsertRowCommand {
    constructor(rowIndex, heightToInsert) {
        this.rowIndex = rowIndex;
        this.heightToInsert = heightToInsert;
    }
    execute(grid) {
        grid.insertRow(this.rowIndex, this.heightToInsert);
    }
    undo(grid) {
        grid.deleteRow(this.rowIndex);
    }
}
/**
 * Command for deleting a row by shifting data up.
 */
export class DeleteRowCommand {
    constructor(rowIndex, grid) {
        this.rowIndex = rowIndex;
        this.deletedData = new Map();
        this.deletedHeight = grid.getRowHeight(this.rowIndex);
    }
    execute(grid) {
        for (let c = 0; c < grid.getConfig().cols; c++) {
            const val = grid.getDataStore().get(this.rowIndex, c);
            if (val) {
                this.deletedData.set(c, val);
            }
        }
        grid.deleteRow(this.rowIndex);
    }
    undo(grid) {
        grid.insertRow(this.rowIndex, this.deletedHeight);
        this.deletedData.forEach((value, colIndex) => {
            grid.setCellValue(this.rowIndex, colIndex, value);
        });
        grid.rerenderGridAndStatusBar();
    }
}
/**
 * Command for inserting a column by shifting data right.
 */
export class InsertColumnCommand {
    /**
     *
     * @param {number} colIndex
     * @param {number} widthToInsert
     */
    constructor(colIndex, widthToInsert) {
        this.colIndex = colIndex;
        this.widthToInsert = widthToInsert;
    }
    /**
     *
     * @param {Grid} grid
     */
    execute(grid) {
        grid.insertColumn(this.colIndex, this.widthToInsert);
    }
    /**
     *
     * @param {Grid} grid
     */
    undo(grid) {
        grid.deleteColumn(this.colIndex);
    }
}
/**
 * Command for deleting a column by shifting data left.
 */
export class DeleteColumnCommand {
    /**
     *
     * @param {number} colIndex
     * @param {Grid} grid
     */
    constructor(colIndex, grid) {
        this.colIndex = colIndex;
        this.deletedData = new Map();
        this.deletedWidth = grid.getColWidth(colIndex);
    }
    /**
     *
     * @param {Grid} grid
     */
    execute(grid) {
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
    undo(grid) {
        grid.insertColumn(this.colIndex, this.deletedWidth);
        this.deletedData.forEach((value, rowIndex) => {
            grid.setCellValue(rowIndex, this.colIndex, value);
        });
        grid.rerenderGridAndStatusBar();
    }
}
