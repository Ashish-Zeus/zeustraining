// /**
//  * Renderer – draws sheet body, headers, selection & cell values.
//  * ---------------------------------------------------------------------------
//  */
import { CellSelection, ColumnSelection, RowSelection, RangeSelection, } from "./Selection.js";
export class Renderer {
    constructor(ctx, cfg, data) {
        this.ctx = ctx;
        this.cfg = cfg;
        this.data = data;
        this.gridColor = "#d4d4d4";
        this.headerBg = "#f4f6f9";
        this.headerActive = "#d0e4fd";
        this.textColor = "#444";
        this.selectionBorder = "#1a73e8";
        this.selectionFill = "rgba(66,133,244,0.15)";
        this.font = "12px system-ui, sans-serif";
    }
    draw(vp, sel) {
        const offX = vp.scrollX % this.cfg.defaultColWidth;
        const offY = vp.scrollY % this.cfg.defaultRowHeight;
        this.drawBody(vp, offX, offY, sel);
        this.drawColumnHeaders(vp, offX, sel);
        this.drawRowHeaders(vp, offY, sel);
        this.drawSelectionOutline(vp, sel);
    }
    /* ─────────────────────────  Body  ──────────────────────────────────── */
    drawBody(vp, offX, offY, sel) {
        const { ctx, cfg } = this;
        ctx.save();
        ctx.beginPath();
        ctx.rect(cfg.headerWidth, cfg.headerHeight, vp.width - cfg.headerWidth, vp.height - cfg.headerHeight);
        ctx.clip();
        ctx.translate(cfg.headerWidth - vp.scrollX, cfg.headerHeight - vp.scrollY);
        const firstCol = Math.floor(vp.scrollX / cfg.defaultColWidth);
        const lastCol = Math.min(cfg.cols - 1, firstCol + Math.ceil(vp.width / cfg.defaultColWidth) + 1);
        const firstRow = Math.floor(vp.scrollY / cfg.defaultRowHeight);
        const lastRow = Math.min(cfg.rows - 1, firstRow + Math.ceil(vp.height / cfg.defaultRowHeight) + 1);
        /* Fill selection range (light blue) */
        if (sel instanceof RangeSelection && !sel.isSingle()) {
            ctx.fillStyle = this.selectionFill;
            const x = sel.c0 * cfg.defaultColWidth;
            const y = sel.r0 * cfg.defaultRowHeight;
            ctx.fillRect(x, y, (sel.c1 - sel.c0 + 1) * cfg.defaultColWidth, (sel.r1 - sel.r0 + 1) * cfg.defaultRowHeight);
        }
        else if (sel instanceof ColumnSelection) {
            ctx.fillStyle = this.selectionFill;
            const x = sel.col * cfg.defaultColWidth;
            ctx.fillRect(x, firstRow * cfg.defaultRowHeight, cfg.defaultColWidth, (lastRow - firstRow + 1) * cfg.defaultRowHeight);
        }
        else if (sel instanceof RowSelection) {
            ctx.fillStyle = this.selectionFill;
            const y = sel.row * cfg.defaultRowHeight;
            ctx.fillRect(firstCol * cfg.defaultColWidth, y, (lastCol - firstCol + 1) * cfg.defaultColWidth, cfg.defaultRowHeight);
        }
        /* Grid lines */
        ctx.lineWidth = 1;
        ctx.strokeStyle = this.gridColor;
        ctx.beginPath(); // vertical
        for (let c = firstCol; c <= lastCol + 1; c++) {
            const x = c * cfg.defaultColWidth + 0.5;
            ctx.moveTo(x, firstRow * cfg.defaultRowHeight);
            ctx.lineTo(x, (lastRow + 1) * cfg.defaultRowHeight);
        }
        ctx.stroke();
        ctx.beginPath(); // horizontal
        for (let r = firstRow; r <= lastRow + 1; r++) {
            const y = r * cfg.defaultRowHeight + 0.5;
            ctx.moveTo(firstCol * cfg.defaultColWidth, y);
            ctx.lineTo((lastCol + 1) * cfg.defaultColWidth, y);
        }
        ctx.stroke();
        /* Values */
        ctx.font = this.font;
        ctx.fillStyle = this.textColor;
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";
        const padX = 4;
        for (let r = firstRow; r <= lastRow; r++) {
            for (let c = firstCol; c <= lastCol; c++) {
                const val = this.data.get(r, c);
                if (!val)
                    continue;
                const x = c * cfg.defaultColWidth + padX;
                const y = r * cfg.defaultRowHeight + cfg.defaultRowHeight / 2;
                ctx.fillText(val, x, y);
            }
        }
        ctx.restore();
    }
    /* ───────────────────  Column headers  ──────────────────────────────── */
    drawColumnHeaders(vp, offX, sel) {
        const { ctx, cfg } = this;
        ctx.save();
        ctx.beginPath();
        ctx.rect(cfg.headerWidth, 0, vp.width - cfg.headerWidth, cfg.headerHeight);
        ctx.clip();
        ctx.fillStyle = this.headerBg;
        ctx.fillRect(cfg.headerWidth, 0, vp.width - cfg.headerWidth, cfg.headerHeight);
        ctx.font = this.font;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.lineWidth = 1;
        ctx.strokeStyle = this.gridColor;
        ctx.beginPath();
        ctx.moveTo(cfg.headerWidth + 0.5, cfg.headerHeight + 0.5);
        ctx.lineTo(vp.width + 0.5, cfg.headerHeight + 0.5);
        ctx.stroke();
        const firstCol = Math.floor(vp.scrollX / cfg.defaultColWidth);
        const visible = Math.ceil((vp.width - cfg.headerWidth) /
            cfg.defaultColWidth) + 1;
        const lastCol = Math.min(cfg.cols - 1, firstCol + visible);
        const activeCol = sel instanceof ColumnSelection
            ? sel.col
            : sel instanceof CellSelection
                ? sel.col
                : sel instanceof RangeSelection
                    ? null
                    : null;
        for (let c = firstCol; c <= lastCol; c++) {
            const x = cfg.headerWidth +
                (c - firstCol) * cfg.defaultColWidth -
                offX;
            if (activeCol === c ||
                (sel instanceof RangeSelection &&
                    c >= sel.c0 && c <= sel.c1)) {
                ctx.fillStyle = this.headerActive;
                ctx.fillRect(x, 0, cfg.defaultColWidth, cfg.headerHeight);
            }
            ctx.strokeStyle = this.gridColor;
            ctx.beginPath();
            ctx.moveTo(x + cfg.defaultColWidth + 0.5, 0);
            ctx.lineTo(x + cfg.defaultColWidth + 0.5, cfg.headerHeight);
            ctx.stroke();
            ctx.fillStyle = this.textColor;
            ctx.fillText(this.columnName(c), x + cfg.defaultColWidth / 2, cfg.headerHeight / 2);
        }
        ctx.restore();
    }
    /* ───────────────────  Row headers  ─────────────────────────────────── */
    drawRowHeaders(vp, offY, sel) {
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
        ctx.lineWidth = 1;
        ctx.strokeStyle = this.gridColor;
        ctx.beginPath();
        ctx.moveTo(cfg.headerWidth + 0.5, cfg.headerHeight + 0.5);
        ctx.lineTo(cfg.headerWidth + 0.5, vp.height + 0.5);
        ctx.stroke();
        const firstRow = Math.floor(vp.scrollY / cfg.defaultRowHeight);
        const visible = Math.ceil((vp.height - cfg.headerHeight) /
            cfg.defaultRowHeight) + 1;
        const lastRow = Math.min(cfg.rows - 1, firstRow + visible);
        const activeRow = sel instanceof RowSelection
            ? sel.row
            : sel instanceof CellSelection
                ? sel.row
                : sel instanceof RangeSelection
                    ? null
                    : null;
        for (let r = firstRow; r <= lastRow; r++) {
            const y = cfg.headerHeight +
                (r - firstRow) * cfg.defaultRowHeight -
                offY;
            if (activeRow === r ||
                (sel instanceof RangeSelection &&
                    r >= sel.r0 && r <= sel.r1)) {
                ctx.fillStyle = this.headerActive;
                ctx.fillRect(0, y, cfg.headerWidth, cfg.defaultRowHeight);
            }
            ctx.strokeStyle = this.gridColor;
            ctx.beginPath();
            ctx.moveTo(0, y + cfg.defaultRowHeight + 0.5);
            ctx.lineTo(cfg.headerWidth, y + cfg.defaultRowHeight + 0.5);
            ctx.stroke();
            ctx.fillStyle = this.textColor;
            ctx.fillText(String(r + 1), cfg.headerWidth / 2, y + cfg.defaultRowHeight / 2);
        }
        ctx.restore();
    }
    /* ────────────────  Border for any selection  ───────────────────────── */
    drawSelectionOutline(vp, sel) {
        if (!sel)
            return;
        const { ctx, cfg } = this;
        let x = 0, y = 0, w = 0, h = 0;
        if (sel instanceof CellSelection) {
            x = cfg.headerWidth +
                sel.col * cfg.defaultColWidth -
                vp.scrollX;
            y = cfg.headerHeight +
                sel.row * cfg.defaultRowHeight -
                vp.scrollY;
            w = cfg.defaultColWidth;
            h = cfg.defaultRowHeight;
        }
        else if (sel instanceof ColumnSelection) {
            x = cfg.headerWidth +
                sel.col * cfg.defaultColWidth -
                vp.scrollX;
            y = cfg.headerHeight;
            w = cfg.defaultColWidth;
            h = vp.height - cfg.headerHeight;
        }
        else if (sel instanceof RowSelection) {
            x = cfg.headerWidth;
            y = cfg.headerHeight +
                sel.row * cfg.defaultRowHeight -
                vp.scrollY;
            w = vp.width - cfg.headerWidth;
            h = cfg.defaultRowHeight;
        }
        else if (sel instanceof RangeSelection) {
            x = cfg.headerWidth +
                sel.c0 * cfg.defaultColWidth -
                vp.scrollX;
            y = cfg.headerHeight +
                sel.r0 * cfg.defaultRowHeight -
                vp.scrollY;
            w = (sel.c1 - sel.c0 + 1) * cfg.defaultColWidth;
            h = (sel.r1 - sel.r0 + 1) * cfg.defaultRowHeight;
        }
        ctx.save();
        ctx.beginPath();
        ctx.rect(cfg.headerWidth, cfg.headerHeight, vp.width - cfg.headerWidth, vp.height - cfg.headerHeight);
        ctx.clip();
        ctx.strokeStyle = this.selectionBorder;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
        ctx.restore();
    }
    /* ───────────────────────────  helper  ─────────────────────────────── */
    columnName(col) {
        let name = "";
        for (let n = col; n >= 0; n = Math.floor(n / 26) - 1) {
            name = String.fromCharCode((n % 26) + 65) + name;
        }
        return name;
    }
}
