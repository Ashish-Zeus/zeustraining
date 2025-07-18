/**
 * Renderer – draws grid, headers, values & any selection type.
 * ---------------------------------------------------------------------------
 */
import { ColumnSelection, RowSelection, RangeSelection, } from "./Selection.js";
export class Renderer {
    /**
     * @param {CanvasRenderingContext2D} ctx The CanvasRenderingContext2D for drawing.
     * @param {GridConfig} cfg The grid configuration.
     * @param {DataStore} data The data store for cell values.
     * @param {ColWidths} colW Array of column widths.
     * @param {RowHeights} rowH Array of row heights.
     */
    constructor(grid, ctx, cfg, data, colW, rowH) {
        this.grid = grid;
        this.ctx = ctx;
        this.cfg = cfg;
        this.data = data;
        this.colW = colW;
        this.rowH = rowH;
        this.gridColor = "#d4d4d4";
        this.headerBg = "#f4f6f9";
        this.headerActive = "#caead8";
        this.textColor = "#444";
        this.selectionBorder = "#107c41";
        this.selectionFill = "#e8f2ec";
        this.font = "12px system-ui, sans-serif";
        this.headerDivision = "#a0d8b9";
    }
    /**
     *
     * @param {DataStore} newDataStore
     */
    setDataStore(newDataStore) {
        this.data = newDataStore;
    }
    /**
     * Draws the entire grid, including body, headers, and selection.
     * @param {Viewport} vp The current viewport.
     * @param {AnySelection} sel The current active selection.
     */
    draw(vp, sel) {
        // Note: offX and offY are not directly used in drawing due to ctx.translate,
        // but kept for consistency if needed for other calculations.
        const offX = vp.scrollX % this.cfg.defaultColWidth;
        const offY = vp.scrollY % this.cfg.defaultRowHeight;
        this.drawBody(vp, offX, offY, sel);
        this.drawColumnHeaders(vp, offX, sel);
        this.drawRowHeaders(vp, offY, sel);
        this.drawSelectionOutline(vp, sel);
    }
    /* ─────────────────────────  Body  ──────────────────────────────────── */
    /**
     * Draws the main grid body, including cell values and selection backgrounds.
     * @param {Viewport} vp The current viewport.
     * @param {number} offX X-offset for drawing (from scroll).
     * @param {number} offY Y-offset for drawing (from scroll).
     * @param {AnySelection} sel The current active selection.
     */
    drawBody(vp, offX, offY, sel) {
        const { ctx, cfg, colW, rowH } = this;
        const colP = this.grid.getColPrefixSums();
        const rowP = this.grid.getRowPrefixSums();
        ctx.save();
        ctx.beginPath();
        ctx.rect(cfg.headerWidth, cfg.headerHeight, vp.width - cfg.headerWidth, vp.height - cfg.headerHeight);
        ctx.clip();
        // Apply scroll offsets to canvas context
        ctx.translate(cfg.headerWidth - vp.scrollX, cfg.headerHeight - vp.scrollY);
        // Compute visible range of rows and columns
        let accWidth = 0, firstCol = 0;
        for (; firstCol < colW.length && accWidth < vp.scrollX; firstCol++) {
            accWidth += colW[firstCol];
        }
        let accColWidth = accWidth, lastCol = firstCol;
        for (; lastCol < colW.length && accColWidth < vp.scrollX + vp.width; lastCol++) {
            accColWidth += colW[lastCol];
        }
        let accHeight = 0, firstRow = 0;
        for (; firstRow < rowH.length && accHeight < vp.scrollY; firstRow++) {
            accHeight += rowH[firstRow];
        }
        let accRowHeight = accHeight, lastRow = firstRow;
        for (; lastRow < rowH.length && accRowHeight < vp.scrollY + vp.height; lastRow++) {
            accRowHeight += rowH[lastRow];
        }
        /* ================= Selection Backgrounds ================= */
        ctx.fillStyle = this.selectionFill; // Default fill for selections
        if (sel instanceof RangeSelection) {
            // O(1) lookups instead of reduce
            const rangeX = colP[sel.c0 - 1] || 0;
            const rangeY = rowP[sel.r0 - 1] || 0;
            const rangeW = (colP[sel.c1] || 0) - rangeX;
            const rangeH = (rowP[sel.r1] || 0) - rangeY;
            ctx.fillRect(rangeX, rangeY, rangeW, rangeH);
            const anchorX = colP[sel.anchorCol - 1] || 0;
            const anchorY = rowP[sel.anchorRow - 1] || 0;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(anchorX, anchorY, colW[sel.anchorCol], rowH[sel.anchorRow]);
        }
        else if (sel instanceof ColumnSelection) {
            const x = colP[sel.c0 - 1] || 0;
            const w = (colP[sel.c1] || 0) - x;
            ctx.fillRect(x, vp.scrollY, w, (rowP[rowP.length - 1] || 0) - vp.scrollY);
            const anchorX = colP[sel.anchorCol - 1] || 0;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(anchorX, 0, colW[sel.anchorCol], rowH[0]);
        }
        else if (sel instanceof RowSelection) {
            const y = rowP[sel.r0 - 1] || 0;
            const h = (rowP[sel.r1] || 0) - y;
            ctx.fillRect(vp.scrollX, y, (colP[colP.length - 1] || 0) - vp.scrollX, h);
            const anchorY = rowP[sel.anchorRow - 1] || 0;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, anchorY, colW[0], rowH[sel.anchorRow]);
        }
        /* ================= Grid Lines ================= */
        ctx.lineWidth = 1;
        ctx.strokeStyle = this.gridColor;
        ctx.beginPath(); // vertical lines
        let x = 0.5;
        for (let c = 0; c <= lastCol + 1; c++) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, accRowHeight);
            x += colW[c] ?? cfg.defaultColWidth;
        }
        ctx.stroke();
        ctx.beginPath(); // horizontal lines
        let y = 0.5;
        for (let r = 0; r <= lastRow + 1; r++) {
            ctx.moveTo(0, y);
            ctx.lineTo(accColWidth, y);
            y += rowH[r] ?? cfg.defaultRowHeight;
        }
        ctx.stroke();
        /* ================= Cell Values ================= */
        ctx.font = this.font;
        ctx.fillStyle = this.textColor;
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";
        const padX = 4;
        let drawY = rowP[firstRow - 1] || 0;
        for (let r = firstRow; r <= lastRow; r++) {
            let drawX = colP[firstCol - 1] || 0;
            for (let c = firstCol; c <= lastCol; c++) {
                const val = this.data.get(r, c);
                if (val) {
                    ctx.fillText(val, drawX + padX, drawY + rowH[r] / 2);
                }
                drawX += colW[c];
            }
            drawY += rowH[r];
        }
        ctx.restore();
    }
    /* ───────────────────  Column headers  ──────────────────────────────── */
    /**
     * Draws the column headers (A, B, C, ...).
     * @param {Viewport} vp The current viewport.
     * @param {number} _ox X-offset (not directly used in this drawing function).
     * @param {AnySelection} sel The current active selection.
     */
    drawColumnHeaders(vp, _ox, sel) {
        const { ctx, cfg } = this;
        ctx.save();
        ctx.beginPath();
        ctx.rect(cfg.headerWidth, 0, vp.width - cfg.headerWidth, cfg.headerHeight);
        ctx.clip();
        /* background */
        ctx.fillStyle = this.headerBg;
        ctx.fillRect(cfg.headerWidth, 0, vp.width - cfg.headerWidth, cfg.headerHeight);
        ctx.font = this.font;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        /* find first visible column */
        let firstCol = 0, cumX = 0;
        while (firstCol < cfg.cols && cumX + this.colW[firstCol] <= vp.scrollX) {
            cumX += this.colW[firstCol];
            firstCol++;
        }
        let x = cfg.headerWidth - (vp.scrollX - cumX);
        let prevActive = false; // Tracks if the previous column was active for divider logic
        for (let c = firstCol; c < cfg.cols && x < vp.width; c++) {
            const w = this.colW[c];
            /* ── Classification for this column ───────────────────────── */
            const inCellSel = sel instanceof RangeSelection && c >= sel.c0 && c <= sel.c1;
            const inHdrSel = sel instanceof ColumnSelection && c >= sel.c0 && c <= sel.c1;
            /* Look-ahead: is next column in the header selection? */
            const nextHdrSel = sel instanceof ColumnSelection && c + 1 >= sel.c0 && c + 1 <= sel.c1;
            /* Look-back: was previous column in header selection? */
            const prevHdrSel = sel instanceof ColumnSelection && c - 1 >= sel.c0 && c - 1 <= sel.c1;
            /* ── Fill background ─────────────────────────────────────── */
            if (inHdrSel) {
                ctx.fillStyle = this.selectionBorder; // Dark green for selected header
                ctx.fillRect(x, 0, w, cfg.headerHeight);
            }
            else if (inCellSel || (sel instanceof RowSelection)) {
                // Highlight if a cell in this column is selected or if a single row is selected
                ctx.fillStyle = this.headerActive; // Light green for range-highlighted or active cell
                ctx.fillRect(x, 0, w, cfg.headerHeight);
            }
            /* blue bottom border for *any* active header */
            if (inCellSel || inHdrSel || (sel instanceof RowSelection)) {
                ctx.strokeStyle = this.selectionBorder;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x, cfg.headerHeight - 0.5);
                ctx.lineTo(x + w + 1, cfg.headerHeight - 0.5);
                ctx.stroke();
            }
            /* ── Column letter ───────────────────────────────────────── */
            ctx.fillStyle = inHdrSel ? "#ffffff" : this.textColor;
            ctx.fillText(this.columnName(c), x + w / 2, cfg.headerHeight / 2);
            /* ── Left divider (only one per boundary) ───────────────── */
            if (c > firstCol) {
                const leftActive = inHdrSel ||
                    prevHdrSel ||
                    (sel instanceof RangeSelection &&
                        ((c >= sel.c0 && c <= sel.c1) || (c - 1 >= sel.c0 && c - 1 <= sel.c1))) ||
                    (sel instanceof RowSelection); // If a single row is selected, its column headers are active
                ctx.strokeStyle = leftActive ? this.headerDivision : this.gridColor;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x + 0.5, 0);
                ctx.lineTo(x + 0.5, leftActive ? cfg.headerHeight - 2 : cfg.headerHeight); // Stops early if green to keep blue bottom visible
                ctx.stroke();
            }
            /* ── Right divider (drawn by THIS column) ───────────────── */
            const rightActive = inHdrSel ||
                nextHdrSel ||
                (sel instanceof RangeSelection &&
                    ((c >= sel.c0 && c <= sel.c1) || (c + 1 >= sel.c0 && c + 1 <= sel.c1))) ||
                (sel instanceof RowSelection);
            ctx.strokeStyle =
                inHdrSel && nextHdrSel
                    ? "#ffffff" // White divider between selected headers
                    : rightActive
                        ? this.headerDivision
                        : this.gridColor;
            ctx.beginPath();
            ctx.moveTo(x + w + 0.5, 0);
            ctx.lineTo(x + w + 0.5, rightActive ? cfg.headerHeight - 2 : cfg.headerHeight);
            ctx.stroke();
            prevActive = inHdrSel || inCellSel || (sel instanceof RowSelection); // Update prevActive for the next iteration
            x += w;
        }
        /* rightmost boundary of viewport */
        ctx.strokeStyle = prevActive ? this.headerDivision : this.gridColor;
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, prevActive ? cfg.headerHeight - 2 : cfg.headerHeight);
        ctx.stroke();
        ctx.restore();
    }
    /* ───────────────────  Row headers  ─────────────────────────────────── */
    /**
     * Draws the row headers (1, 2, 3, ...).
     * @param {Viewport} vp The current viewport.
     * @param {number} _oy Y-offset (not directly used in this drawing function).
     * @param {AnySelection} sel The current active selection.
     */
    drawRowHeaders(vp, _oy, sel) {
        const { ctx, cfg } = this;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, cfg.headerHeight, cfg.headerWidth, vp.height - cfg.headerHeight);
        ctx.clip();
        ctx.fillStyle = this.headerBg;
        ctx.fillRect(0, cfg.headerHeight, cfg.headerWidth, vp.height - cfg.headerHeight);
        ctx.font = this.font;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        /* first visible row */
        let firstRow = 0, cumY = 0;
        while (firstRow < cfg.rows && cumY + this.rowH[firstRow] <= vp.scrollY) {
            cumY += this.rowH[firstRow];
            firstRow++;
        }
        let y = cfg.headerHeight - (vp.scrollY - cumY);
        let prevActive = false; // Tracks if the previous row was active for divider logic
        for (let r = firstRow; r < cfg.rows && y < vp.height; r++) {
            const h = this.rowH[r];
            /* classification */
            const inCellSel = sel instanceof RangeSelection && r >= sel.r0 && r <= sel.r1;
            const inHdrSel = sel instanceof RowSelection && r >= sel.r0 && r <= sel.r1;
            const nextHdrSel = sel instanceof RowSelection && r + 1 >= sel.r0 && r + 1 <= sel.r1;
            const prevHdrSel = sel instanceof RowSelection && r - 1 >= sel.r0 && r - 1 <= sel.r1;
            /* fills */
            if (inHdrSel) {
                ctx.fillStyle = this.selectionBorder; // dark green for selected header
                ctx.fillRect(0, y, cfg.headerWidth, h);
            }
            else if (inCellSel || (sel instanceof ColumnSelection)) {
                // Highlight if a cell in this row is selected or if a single column is selected
                ctx.fillStyle = this.headerActive; // light green for range-highlighted or active cell
                ctx.fillRect(0, y, cfg.headerWidth, h);
            }
            /* blue right border */
            if (inCellSel || inHdrSel || (sel instanceof ColumnSelection)) {
                ctx.strokeStyle = this.selectionBorder;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(cfg.headerWidth - 1, y);
                ctx.lineTo(cfg.headerWidth - 1, y + h + 1);
                ctx.stroke();
            }
            /* label */
            ctx.fillStyle = inHdrSel ? "#ffffff" : this.textColor;
            ctx.fillText(String(r + 1), cfg.headerWidth / 2, y + h / 2);
            /* top divider */
            if (r > firstRow) {
                const topActive = inHdrSel ||
                    prevHdrSel ||
                    (sel instanceof RangeSelection &&
                        ((r >= sel.r0 && r <= sel.r1) || (r - 1 >= sel.r0 && r - 1 <= sel.r1))) ||
                    (sel instanceof ColumnSelection);
                ctx.strokeStyle =
                    inHdrSel && !prevHdrSel
                        ? this.selectionBorder
                        : topActive
                            ? this.headerDivision
                            : this.gridColor;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0, y + 0.5);
                ctx.lineTo(topActive ? cfg.headerWidth - 2 : cfg.headerWidth, y + 0.5);
                ctx.stroke();
            }
            /* bottom divider */
            const bottomActive = inHdrSel ||
                nextHdrSel ||
                (sel instanceof RangeSelection &&
                    ((r >= sel.r0 && r <= sel.r1) || (r + 1 >= sel.r0 && r + 1 <= sel.r1))) ||
                (sel instanceof ColumnSelection);
            ctx.strokeStyle =
                inHdrSel && nextHdrSel
                    ? "#ffffff" // White divider between selected headers
                    : bottomActive
                        ? this.headerDivision
                        : this.gridColor;
            ctx.beginPath();
            ctx.moveTo(0, y + h + 0.5);
            ctx.lineTo(bottomActive ? cfg.headerWidth - 2 : cfg.headerWidth, y + h + 0.5);
            ctx.stroke();
            prevActive = inHdrSel || inCellSel || (sel instanceof ColumnSelection);
            y += h;
        }
        /* bottommost boundary of viewport */
        ctx.strokeStyle = prevActive ? this.headerDivision : this.gridColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        const by = y + 0.5;
        ctx.moveTo(0, by);
        ctx.lineTo(prevActive ? cfg.headerWidth - 2 : cfg.headerWidth, by);
        ctx.stroke();
        ctx.restore();
    }
    /* ────────────────  Border for any selection  ───────────────────────── */
    /**
     * Draws the outline border for the active selection.
     * @param {Viewport} vp The current viewport.
     * @param {AnySelection} sel The current active selection.
     */
    drawSelectionOutline(vp, sel) {
        if (!sel)
            return;
        const { ctx, cfg } = this;
        const colP = this.grid.getColPrefixSums();
        const rowP = this.grid.getRowPrefixSums();
        let x = 0, y = 0, w = 0, h = 0;
        if (sel instanceof RangeSelection) {
            x = colP[sel.c0 - 1] || 0;
            y = rowP[sel.r0 - 1] || 0;
            w = (colP[sel.c1] || 0) - x;
            h = (rowP[sel.r1] || 0) - y;
        }
        else if (sel instanceof ColumnSelection) {
            x = colP[sel.c0 - 1] || 0;
            w = (colP[sel.c1] || 0) - x;
            y = 0;
            h = rowP[rowP.length - 1] || 0; // Use fast total height
        }
        else if (sel instanceof RowSelection) {
            y = rowP[sel.r0 - 1] || 0;
            h = (rowP[sel.r1] || 0) - y;
            x = 0;
            w = colP[colP.length - 1] || 0; // Use fast total width
        }
        // Adjust coordinates for viewport scroll and header offsets
        x = x - vp.scrollX + cfg.headerWidth;
        y = y - vp.scrollY + cfg.headerHeight;
        ctx.save();
        ctx.beginPath();
        ctx.rect(cfg.headerWidth, cfg.headerHeight, vp.width - cfg.headerWidth, vp.height - cfg.headerHeight);
        ctx.clip(); // Clip to the body area
        ctx.strokeStyle = this.selectionBorder;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, w - 1, h - 1); // Draw the outline
        ctx.restore();
    }
    /* ───────────────────────────  helper  ─────────────────────────────── */
    /**
     * Converts a column index to its Excel-style column name (e.g., 0 -> A, 26 -> AA).
     * @param {number} col The column index.
     * @returns {string} The Excel-style column name.
     */
    columnName(col) {
        let name = "";
        for (let n = col; n >= 0; n = Math.floor(n / 26) - 1) {
            name = String.fromCharCode((n % 26) + 65) + name;
        }
        return name;
    }
}
