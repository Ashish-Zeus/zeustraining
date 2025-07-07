/**
 * Renderer – draws grid, headers, values & any selection type.
 * ---------------------------------------------------------------------------
 */
import { CellSelection, ColumnSelection, RowSelection, RangeSelection, ColumnRangeSelection, RowRangeSelection } from "./Selection.js";
export class Renderer {
    /**
     *
     * @param ctx
     * @param cfg
     * @param data
     */
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
    /**
     *
     * @param vp
     * @param sel
     */
    draw(vp, sel) {
        const offX = vp.scrollX % this.cfg.defaultColWidth;
        const offY = vp.scrollY % this.cfg.defaultRowHeight;
        this.drawBody(vp, offX, offY, sel);
        this.drawColumnHeaders(vp, offX, sel);
        this.drawRowHeaders(vp, offY, sel);
        this.drawSelectionOutline(vp, sel);
    }
    /* ─────────────────────────  Body  ──────────────────────────────────── */
    /**
     *
     * @param vp
     * @param offX
     * @param offY
     * @param sel
     */
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
            // 2‑D coords of the whole blue area
            const rangeX = sel.c0 * cfg.defaultColWidth;
            const rangeY = sel.r0 * cfg.defaultRowHeight;
            const rangeW = (sel.c1 - sel.c0 + 1) * cfg.defaultColWidth;
            const rangeH = (sel.r1 - sel.r0 + 1) * cfg.defaultRowHeight;
            /*  Fill everything blue */
            ctx.fillStyle = this.selectionFill; // blue rgba(…)
            ctx.fillRect(rangeX, rangeY, rangeW, rangeH);
            /* Overpaint anchor cell white so it stands out */
            const anchorX = sel.anchorCol * cfg.defaultColWidth;
            const anchorY = sel.anchorRow * cfg.defaultRowHeight;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(anchorX, anchorY, cfg.defaultColWidth, cfg.defaultRowHeight);
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
        else if (sel instanceof ColumnRangeSelection) {
            ctx.fillStyle = this.selectionFill;
            const x = sel.c0 * cfg.defaultColWidth;
            const w = (sel.c1 - sel.c0 + 1) * cfg.defaultColWidth;
            ctx.fillRect(x, firstRow * cfg.defaultRowHeight, w, (lastRow - firstRow + 1) * cfg.defaultRowHeight);
        }
        /* --- RowRangeSelection fill --- */
        else if (sel instanceof RowRangeSelection) {
            ctx.fillStyle = this.selectionFill;
            const y = sel.r0 * cfg.defaultRowHeight;
            const h = (sel.r1 - sel.r0 + 1) * cfg.defaultRowHeight;
            ctx.fillRect(firstCol * cfg.defaultColWidth, y, (lastCol - firstCol + 1) * cfg.defaultColWidth, h);
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
    /**
     *
     * @param vp
     * @param offX
     * @param sel
     */
    // private drawColumnHeaders(
    //   vp: Viewport,
    //   offX: number,
    //   sel: AnySelection
    // ): void {
    //   const { ctx, cfg } = this;
    //   ctx.save();
    //   ctx.beginPath();
    //   ctx.rect(cfg.headerWidth, 0,
    //     vp.width - cfg.headerWidth,
    //     cfg.headerHeight);
    //   ctx.clip();
    //   ctx.fillStyle = this.headerBg;
    //   ctx.fillRect(cfg.headerWidth, 0,
    //     vp.width - cfg.headerWidth, cfg.headerHeight);
    //   ctx.font = this.font;
    //   ctx.textBaseline = "middle";
    //   ctx.textAlign = "center";
    //   ctx.lineWidth = 1;
    //   ctx.strokeStyle = this.gridColor;
    //   ctx.beginPath();
    //   ctx.moveTo(cfg.headerWidth + 0.5, cfg.headerHeight + 0.5);
    //   ctx.lineTo(vp.width + 0.5, cfg.headerHeight + 0.5);
    //   ctx.stroke();
    //   const firstCol = Math.floor(vp.scrollX / cfg.defaultColWidth);
    //   const visible = Math.ceil((vp.width - cfg.headerWidth) /
    //     cfg.defaultColWidth) + 1;
    //   const lastCol = Math.min(cfg.cols - 1, firstCol + visible);
    //   const activeCol =
    //     sel instanceof ColumnSelection
    //       ? sel.col
    //       : sel instanceof CellSelection
    //         ? sel.col
    //         : sel instanceof RangeSelection
    //           ? null
    //           : null;
    //   for (let c = firstCol; c <= lastCol; c++) {
    //     const x = cfg.headerWidth +
    //       (c - firstCol) * cfg.defaultColWidth -
    //       offX;
    //     if (activeCol === c ||
    //       (sel instanceof RangeSelection &&
    //         c >= sel.c0 && c <= sel.c1)) {
    //       ctx.fillStyle = this.headerActive;
    //       ctx.fillRect(x, 0, cfg.defaultColWidth, cfg.headerHeight);
    //     }
    //     ctx.strokeStyle = this.gridColor;
    //     ctx.beginPath();
    //     ctx.moveTo(x + cfg.defaultColWidth + 0.5, 0);
    //     ctx.lineTo(x + cfg.defaultColWidth + 0.5, cfg.headerHeight);
    //     ctx.stroke();
    //     ctx.fillStyle = this.textColor;
    //     ctx.fillText(
    //       this.columnName(c),
    //       x + cfg.defaultColWidth / 2,
    //       cfg.headerHeight / 2
    //     );
    //   }
    //   ctx.restore();
    // }
    /* ───────────────── Column header strip (A,B,…) ─────────────────── */
    drawColumnHeaders(vp, offX, sel) {
        const { ctx, cfg } = this;
        /* Clip to top header strip */
        ctx.save();
        ctx.beginPath();
        ctx.rect(cfg.headerWidth, 0, vp.width - cfg.headerWidth, cfg.headerHeight);
        ctx.clip();
        /* Background */
        ctx.fillStyle = this.headerBg;
        ctx.fillRect(cfg.headerWidth, 0, vp.width - cfg.headerWidth, cfg.headerHeight);
        /* Baseline styles */
        ctx.font = this.font;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.lineWidth = 1;
        /* Bottom divider */
        ctx.strokeStyle = this.gridColor;
        ctx.beginPath();
        ctx.moveTo(cfg.headerWidth + 0.5, cfg.headerHeight + 0.5);
        ctx.lineTo(vp.width + 0.5, cfg.headerHeight + 0.5);
        ctx.stroke();
        /* Visible col range */
        const firstCol = Math.floor(vp.scrollX / cfg.defaultColWidth);
        const visible = Math.ceil((vp.width - cfg.headerWidth) /
            cfg.defaultColWidth) + 1;
        const lastCol = Math.min(cfg.cols - 1, firstCol + visible);
        /* ---- iterate visible headers ---- */
        for (let c = firstCol; c <= lastCol; c++) {
            const x = cfg.headerWidth +
                (c - firstCol) * cfg.defaultColWidth -
                offX;
            /* Highlight logic */
            const inHeaderRange = (sel instanceof ColumnSelection && sel.col === c) ||
                (sel instanceof CellSelection && sel.col === c) ||
                (sel instanceof RangeSelection && c >= sel.c0 && c <= sel.c1) ||
                (sel instanceof ColumnRangeSelection &&
                    c >= sel.c0 && c <= sel.c1);
            if (inHeaderRange) {
                ctx.fillStyle = this.headerActive; // blue background
                ctx.fillRect(x, 0, cfg.defaultColWidth, cfg.headerHeight);
            }
            /* Right divider */
            ctx.strokeStyle = this.gridColor;
            ctx.beginPath();
            ctx.moveTo(x + cfg.defaultColWidth + 0.5, 0);
            ctx.lineTo(x + cfg.defaultColWidth + 0.5, cfg.headerHeight);
            ctx.stroke();
            /* Letter */
            ctx.fillStyle = this.textColor;
            ctx.fillText(this.columnName(c), x + cfg.defaultColWidth / 2, cfg.headerHeight / 2);
        }
        ctx.restore();
    }
    /* ───────────────────  Row headers  ─────────────────────────────────── */
    /**
     *
     * @param vp
     * @param offY
     * @param sel
     */
    // private drawRowHeaders(
    //   vp: Viewport,
    //   offY: number,
    //   sel: AnySelection
    // ): void {
    //   const { ctx, cfg } = this;
    //   ctx.save();
    //   ctx.beginPath();
    //   ctx.rect(0, cfg.headerHeight,
    //     cfg.headerWidth,
    //     vp.height - cfg.headerHeight);
    //   ctx.clip();
    //   ctx.fillStyle = this.headerBg;
    //   ctx.fillRect(0, cfg.headerHeight,
    //     cfg.headerWidth, vp.height - cfg.headerHeight);
    //   ctx.font = this.font;
    //   ctx.textBaseline = "middle";
    //   ctx.textAlign = "center";
    //   ctx.lineWidth = 1;
    //   ctx.strokeStyle = this.gridColor;
    //   ctx.beginPath();
    //   ctx.moveTo(cfg.headerWidth + 0.5, cfg.headerHeight + 0.5);
    //   ctx.lineTo(cfg.headerWidth + 0.5, vp.height + 0.5);
    //   ctx.stroke();
    //   const firstRow = Math.floor(vp.scrollY / cfg.defaultRowHeight);
    //   const visible = Math.ceil((vp.height - cfg.headerHeight) /
    //     cfg.defaultRowHeight) + 1;
    //   const lastRow = Math.min(cfg.rows - 1, firstRow + visible);
    //   const activeRow =
    //     sel instanceof RowSelection
    //       ? sel.row
    //       : sel instanceof CellSelection
    //         ? sel.row
    //         : sel instanceof RangeSelection
    //           ? null
    //           : null;
    //   for (let r = firstRow; r <= lastRow; r++) {
    //     const y = cfg.headerHeight +
    //       (r - firstRow) * cfg.defaultRowHeight -
    //       offY;
    //     if (activeRow === r ||
    //       (sel instanceof RangeSelection &&
    //         r >= sel.r0 && r <= sel.r1)) {
    //       ctx.fillStyle = this.headerActive;
    //       ctx.fillRect(0, y, cfg.headerWidth, cfg.defaultRowHeight);
    //     }
    //     ctx.strokeStyle = this.gridColor;
    //     ctx.beginPath();
    //     ctx.moveTo(0, y + cfg.defaultRowHeight + 0.5);
    //     ctx.lineTo(cfg.headerWidth, y + cfg.defaultRowHeight + 0.5);
    //     ctx.stroke();
    //     ctx.fillStyle = this.textColor;
    //     ctx.fillText(
    //       String(r + 1),
    //       cfg.headerWidth / 2,
    //       y + cfg.defaultRowHeight / 2
    //     );
    //   }
    //   ctx.restore();
    // }
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
        /* Right divider */
        ctx.strokeStyle = this.gridColor;
        ctx.beginPath();
        ctx.moveTo(cfg.headerWidth + 0.5, cfg.headerHeight + 0.5);
        ctx.lineTo(cfg.headerWidth + 0.5, vp.height + 0.5);
        ctx.stroke();
        const firstRow = Math.floor(vp.scrollY / cfg.defaultRowHeight);
        const visible = Math.ceil((vp.height - cfg.headerHeight) / cfg.defaultRowHeight) + 1;
        const lastRow = Math.min(cfg.rows - 1, firstRow + visible);
        for (let r = firstRow; r <= lastRow; r++) {
            const y = cfg.headerHeight +
                (r - firstRow) * cfg.defaultRowHeight -
                offY;
            /* ✅ Highlight for any kind of row selection */
            const inHeaderRange = (sel instanceof RowSelection && sel.row === r) ||
                (sel instanceof CellSelection && sel.row === r) ||
                (sel instanceof RangeSelection && r >= sel.r0 && r <= sel.r1) ||
                (sel instanceof RowRangeSelection && r >= sel.r0 && r <= sel.r1);
            if (inHeaderRange) {
                ctx.fillStyle = this.headerActive;
                ctx.fillRect(0, y, cfg.headerWidth, cfg.defaultRowHeight);
            }
            /* Bottom border */
            ctx.strokeStyle = this.gridColor;
            ctx.beginPath();
            ctx.moveTo(0, y + cfg.defaultRowHeight + 0.5);
            ctx.lineTo(cfg.headerWidth, y + cfg.defaultRowHeight + 0.5);
            ctx.stroke();
            /* Row label (number) */
            ctx.fillStyle = this.textColor;
            ctx.fillText(String(r + 1), cfg.headerWidth / 2, y + cfg.defaultRowHeight / 2);
        }
        ctx.restore();
    }
    /* ────────────────  Border for any selection  ───────────────────────── */
    /**
     *
     * @param vp
     * @param sel
     * @returns
     */
    drawSelectionOutline(vp, sel) {
        if (!sel)
            return;
        const { ctx, cfg } = this;
        /* Visible row/col span in the current viewport */
        const firstVisibleRow = Math.floor(vp.scrollY / cfg.defaultRowHeight);
        const visibleRows = Math.ceil((vp.height - cfg.headerHeight) / cfg.defaultRowHeight);
        const firstVisibleCol = Math.floor(vp.scrollX / cfg.defaultColWidth);
        const visibleCols = Math.ceil((vp.width - cfg.headerWidth) / cfg.defaultColWidth);
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
            y = cfg.headerHeight +
                firstVisibleRow * cfg.defaultRowHeight -
                vp.scrollY;
            w = cfg.defaultColWidth;
            h = visibleRows * cfg.defaultRowHeight; // stop at last visible row
        }
        else if (sel instanceof RowSelection) {
            x = cfg.headerWidth +
                firstVisibleCol * cfg.defaultColWidth -
                vp.scrollX;
            y = cfg.headerHeight +
                sel.row * cfg.defaultRowHeight -
                vp.scrollY;
            w = visibleCols * cfg.defaultColWidth; // stop at last visible col
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
        /* Column‑range border */
        else if (sel instanceof ColumnRangeSelection) {
            x = cfg.headerWidth +
                sel.c0 * cfg.defaultColWidth -
                vp.scrollX;
            y = cfg.headerHeight;
            w = (sel.c1 - sel.c0 + 1) * cfg.defaultColWidth;
            h = vp.height - cfg.headerHeight;
        }
        /* Row‑range border */
        else if (sel instanceof RowRangeSelection) {
            x = cfg.headerWidth;
            y = cfg.headerHeight +
                sel.r0 * cfg.defaultRowHeight -
                vp.scrollY;
            w = vp.width - cfg.headerWidth;
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
    /**
     *
     * @param col
     * @returns
     */
    columnName(col) {
        let name = "";
        for (let n = col; n >= 0; n = Math.floor(n / 26) - 1) {
            name = String.fromCharCode((n % 26) + 65) + name;
        }
        return name;
    }
}
