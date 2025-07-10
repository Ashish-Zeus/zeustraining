/**
 * Renderer – draws grid, headers, values & any selection type.
 * ---------------------------------------------------------------------------
 */

import type { GridConfig, Viewport } from "./Grid";
import { DataStore } from "./DataStore";
import {
  AnySelection,
  CellSelection,
  ColumnSelection,
  RowSelection,
  RangeSelection,
  ColumnRangeSelection,
  RowRangeSelection,
} from "./Selection";
import { ColWidths, RowHeights } from "./types";
export class Renderer {
  private readonly gridColor = "#d4d4d4";
  private readonly headerBg = "#f4f6f9";
  private readonly headerActive = "#caead8";
  private readonly textColor = "#444";
  private readonly selectionBorder = "#107c41";
  private readonly selectionFill = "#e8f2ec";
  private readonly font = "12px system-ui, sans-serif";
  private readonly headerDivision = "#a0d8b9";
  /**
   *
   * @param ctx
   * @param cfg
   * @param data
   */
  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly cfg: GridConfig,
    private readonly data: DataStore,
    private readonly colW: ColWidths,
    private readonly rowH: RowHeights
  ) {}

  /**
   *
   * @param vp
   * @param sel
   */
  public draw(vp: Viewport, sel: AnySelection): void {
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
  private drawBody(
    vp: Viewport,
    offX: number,
    offY: number,
    sel: AnySelection
  ): void {
    const { ctx, cfg } = this;

    ctx.save();
    ctx.beginPath();
    ctx.rect(
      cfg.headerWidth,
      cfg.headerHeight,
      vp.width - cfg.headerWidth,
      vp.height - cfg.headerHeight
    );
    ctx.clip();

    ctx.translate(cfg.headerWidth - vp.scrollX, cfg.headerHeight - vp.scrollY);

    const firstCol = Math.floor(vp.scrollX / cfg.defaultColWidth);
    const lastCol = Math.min(
      cfg.cols - 1,
      firstCol + Math.ceil(vp.width / cfg.defaultColWidth) + 1
    );
    const firstRow = Math.floor(vp.scrollY / cfg.defaultRowHeight);
    const lastRow = Math.min(
      cfg.rows - 1,
      firstRow + Math.ceil(vp.height / cfg.defaultRowHeight) + 1
    );

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
    } else if (sel instanceof ColumnSelection) {
      ctx.fillStyle = this.selectionFill;
      const x = sel.col * cfg.defaultColWidth;
      const h = (lastRow - firstRow + 1) * cfg.defaultRowHeight;
      ctx.fillRect(x, firstRow * cfg.defaultRowHeight, cfg.defaultColWidth, h);
      ctx.fillStyle = "#fffff";
      ctx.fillRect(x, 0, cfg.defaultColWidth, cfg.defaultRowHeight);
    } else if (sel instanceof RowSelection) {
      ctx.fillStyle = this.selectionFill;
      const y = sel.row * cfg.defaultRowHeight;
      const w = (lastCol - firstCol + 1) * cfg.defaultColWidth;
      ctx.fillRect(firstCol * cfg.defaultColWidth, y, w, cfg.defaultRowHeight);
      ctx.fillStyle = "#fffff";
      ctx.fillRect(0, y, cfg.defaultColWidth, cfg.defaultRowHeight);
    } else if (sel instanceof ColumnRangeSelection) {
      ctx.fillStyle = this.selectionFill;
      const x = sel.c0 * cfg.defaultColWidth;
      const w = (sel.c1 - sel.c0 + 1) * cfg.defaultColWidth;
      ctx.fillRect(
        x,
        firstRow * cfg.defaultRowHeight,
        w,
        (lastRow - firstRow + 1) * cfg.defaultRowHeight
      );
      ctx.fillStyle = "#ffffff"; /* anchor cell */
      ctx.fillRect(
        sel.anchorCol * cfg.defaultColWidth, // ← fixed column
        0, // first row
        cfg.defaultColWidth,
        cfg.defaultRowHeight
      );
    } else if (sel instanceof RowRangeSelection) {
      /* --- RowRangeSelection fill --- */
      ctx.fillStyle = this.selectionFill;
      const y = sel.r0 * cfg.defaultRowHeight;
      const h = (sel.r1 - sel.r0 + 1) * cfg.defaultRowHeight;
      ctx.fillRect(
        firstCol * cfg.defaultColWidth,
        y,
        (lastCol - firstCol + 1) * cfg.defaultColWidth,
        h
      );
      ctx.fillStyle = "#ffffff"; /* anchor cell */
      ctx.fillRect(
        0, // first column
        sel.anchorRow * cfg.defaultRowHeight, // ← fixed row
        cfg.defaultColWidth,
        cfg.defaultRowHeight
      );
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
        if (!val) continue;

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
  /* ───────────────── Column header strip (A,B,…) ─────────────────── */
  private drawColumnHeaders(
    vp: Viewport,
    _ox: number,
    sel: AnySelection
  ): void {
    const { ctx, cfg } = this;

    ctx.save();
    ctx.beginPath();
    ctx.rect(cfg.headerWidth, 0, vp.width - cfg.headerWidth, cfg.headerHeight);
    ctx.clip();

    /* background */
    ctx.fillStyle = this.headerBg;
    ctx.fillRect(
      cfg.headerWidth,
      0,
      vp.width - cfg.headerWidth,
      cfg.headerHeight
    );

    ctx.font = this.font;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";

    /* find first visible column */
    let firstCol = 0,
      cumX = 0;
    while (firstCol < cfg.cols && cumX + this.colW[firstCol] <= vp.scrollX) {
      cumX += this.colW[firstCol];
      firstCol++;
    }

    let x = cfg.headerWidth - (vp.scrollX - cumX);

    let prevActive = false;
    for (let c = firstCol; c < cfg.cols && x < vp.width; c++) {
      const w = this.colW[c];
      /* ── Classification for this column ───────────────────────── */
      const inCellSel =
        (sel instanceof CellSelection && sel.col === c) ||
        (sel instanceof RangeSelection && c >= sel.c0 && c <= sel.c1);

      const inHdrSel =
        (sel instanceof ColumnSelection && sel.col === c) ||
        (sel instanceof ColumnRangeSelection && c >= sel.c0 && c <= sel.c1);

      /* Look‑ahead: is next column in the header selection? */
      const nextHdrSel =
        (sel instanceof ColumnSelection && sel.col === c + 1) ||
        (sel instanceof ColumnRangeSelection &&
          c + 1 >= sel.c0 &&
          c + 1 <= sel.c1);

      /* Look‑back: was previous column in header selection?      */
      const prevHdrSel =
        (sel instanceof ColumnSelection && sel.col === c - 1) ||
        (sel instanceof ColumnRangeSelection &&
          c - 1 >= sel.c0 &&
          c - 1 <= sel.c1);

      /* ── Fill background ─────────────────────────────────────── */
      if (inHdrSel) {
        ctx.fillStyle = this.selectionBorder;
        ctx.fillRect(x, 0, w, cfg.headerHeight);
      } else if (inCellSel || sel instanceof RowRangeSelection) {
        ctx.fillStyle = this.headerActive;
        ctx.fillRect(x, 0, w, cfg.headerHeight);
      }

      /* blue bottom border for *any* active header */
      if (inCellSel || inHdrSel || sel instanceof RowRangeSelection) {
        ctx.strokeStyle = this.selectionBorder;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, cfg.headerHeight - 0.5);
        ctx.lineTo(x + w + 1, cfg.headerHeight - 0.5);
        ctx.stroke();
      }

      /* ── Column letter ───────────────────────────────────────── */
      ctx.fillStyle = inHdrSel ? "#ffffff" : this.textColor; // rule 2 & 3
      ctx.fillText(this.columnName(c), x + w / 2, cfg.headerHeight / 2);

      /* ── Left divider  (only one per boundary) ───────────────── */
      if (c > firstCol) {
        const leftActive =
          inHdrSel ||
          prevHdrSel || // column header selections
          (sel instanceof CellSelection &&
            (sel.col === c || sel.col === c - 1)) ||
          (sel instanceof RangeSelection &&
            ((c >= sel.c0 && c <= sel.c1) ||
              (c - 1 >= sel.c0 && c - 1 <= sel.c1))) ||
          sel instanceof RowRangeSelection;

        ctx.strokeStyle = leftActive ? this.headerDivision : this.gridColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(
          x + 0.5,
          leftActive ? cfg.headerHeight - 2 : cfg.headerHeight
        ); // stops early if green to keep blue bottom visible
        ctx.stroke();
      }

      /* ── Right divider  (drawn by THIS column) ───────────────── */
      const rightActive =
        inHdrSel ||
        nextHdrSel ||
        (sel instanceof CellSelection &&
          (sel.col === c || sel.col === c + 1)) ||
        (sel instanceof RangeSelection &&
          ((c >= sel.c0 && c <= sel.c1) ||
            (c + 1 >= sel.c0 && c + 1 <= sel.c1))) ||
        sel instanceof RowRangeSelection;

      ctx.strokeStyle =
        inHdrSel && nextHdrSel
          ? "#fffff"
          : rightActive
          ? this.headerDivision
          : this.gridColor;
      ctx.beginPath();
      ctx.moveTo(x + w + 0.5, 0);
      ctx.lineTo(
        x + w + 0.5,
        rightActive ? cfg.headerHeight - 2 : cfg.headerHeight
      );
      ctx.stroke();

      // prevActive = active;
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
   *
   * @param vp
   * @param offY
   * @param sel
   */
  /* ───────── row header strip (1, 2, …) ───────── */
  private drawRowHeaders(vp: Viewport, _oy: number, sel: AnySelection): void {
    const { ctx, cfg } = this;

    ctx.save();
    ctx.beginPath();
    ctx.rect(
      0,
      cfg.headerHeight,
      cfg.headerWidth,
      vp.height - cfg.headerHeight
    );
    ctx.clip();

    ctx.fillStyle = this.headerBg;
    ctx.fillRect(
      0,
      cfg.headerHeight,
      cfg.headerWidth,
      vp.height - cfg.headerHeight
    );

    ctx.font = this.font;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";

    /* first visible row */
    let firstRow = 0,
      cumY = 0;
    while (firstRow < cfg.rows && cumY + this.rowH[firstRow] <= vp.scrollY) {
      cumY += this.rowH[firstRow];
      firstRow++;
    }

    let y = cfg.headerHeight - (vp.scrollY - cumY);

    let prevActive = false;
    for (let r = firstRow; r < cfg.rows && y < vp.height; r++) {
      const h = this.rowH[r];

      /* classification */
      const inCellSel =
        (sel instanceof CellSelection && sel.row === r) ||
        (sel instanceof RangeSelection && r >= sel.r0 && r <= sel.r1);

      const inHdrSel =
        (sel instanceof RowSelection && sel.row === r) ||
        (sel instanceof RowRangeSelection && r >= sel.r0 && r <= sel.r1);

      const nextHdrSel =
        (sel instanceof RowSelection && sel.row === r + 1) ||
        (sel instanceof RowRangeSelection &&
          r + 1 >= sel.r0 &&
          r + 1 <= sel.r1);

      const prevHdrSel =
        (sel instanceof RowSelection && sel.row === r - 1) ||
        (sel instanceof RowRangeSelection &&
          r - 1 >= sel.r0 &&
          r - 1 <= sel.r1);

      /* fills */
      if (inHdrSel) {
        ctx.fillStyle = this.selectionBorder; // dark green for selected header
        ctx.fillRect(0, y, cfg.headerWidth, h);
      } else if (inCellSel || sel instanceof ColumnRangeSelection) {
        ctx.fillStyle = this.headerActive; // light green for range-highlighted or active cell
        ctx.fillRect(0, y, cfg.headerWidth, h);
      }

      /* blue right border */
      if (inCellSel || inHdrSel || sel instanceof ColumnRangeSelection) {
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
        const topActive =
          inHdrSel ||
          prevHdrSel || // row header selections
          (sel instanceof CellSelection &&
            (sel.row === r || sel.row === r - 1)) ||
          (sel instanceof RangeSelection &&
            ((r >= sel.r0 && r <= sel.r1) ||
              (r - 1 >= sel.r0 && r - 1 <= sel.r1))) ||
          sel instanceof ColumnRangeSelection;

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
      const bottomActive =
        inHdrSel ||
        nextHdrSel ||
        (sel instanceof CellSelection &&
          (sel.row === r || sel.row === r + 1)) ||
        (sel instanceof RangeSelection &&
          ((r >= sel.r0 && r <= sel.r1) ||
            (r + 1 >= sel.r0 && r + 1 <= sel.r1))) ||
        sel instanceof ColumnRangeSelection;

      ctx.strokeStyle =
        inHdrSel && nextHdrSel
          ? "#ffffff"
          : bottomActive
          ? this.headerDivision
          : this.gridColor;

      ctx.beginPath();
      ctx.moveTo(0, y + h + 0.5);
      ctx.lineTo(
        bottomActive ? cfg.headerWidth - 2 : cfg.headerWidth,
        y + h + 0.5
      );
      ctx.stroke();
      /* bottom divider */
      

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
   *
   * @param vp
   * @param sel
   * @returns
   */
  private drawSelectionOutline(vp: Viewport, sel: AnySelection): void {
    if (!sel) return;

    const { ctx, cfg } = this;
    /* Visible row/col span in the current viewport */
    const firstVisibleRow = Math.floor(vp.scrollY / cfg.defaultRowHeight);
    const visibleRows = Math.ceil(
      (vp.height - cfg.headerHeight) / cfg.defaultRowHeight
    );

    const firstVisibleCol = Math.floor(vp.scrollX / cfg.defaultColWidth);
    const visibleCols = Math.ceil(
      (vp.width - cfg.headerWidth) / cfg.defaultColWidth
    );

    let x = 0,
      y = 0,
      w = 0,
      h = 0;

    if (sel instanceof CellSelection) {
      x = cfg.headerWidth + sel.col * cfg.defaultColWidth - vp.scrollX;
      y = cfg.headerHeight + sel.row * cfg.defaultRowHeight - vp.scrollY;
      w = cfg.defaultColWidth;
      h = cfg.defaultRowHeight;
    } else if (sel instanceof ColumnSelection) {
      x = cfg.headerWidth + sel.col * cfg.defaultColWidth - vp.scrollX;
      y =
        cfg.headerHeight + firstVisibleRow * cfg.defaultRowHeight - vp.scrollY;
      w = cfg.defaultColWidth;
      h = visibleRows * cfg.defaultRowHeight; // stop at last visible row
    } else if (sel instanceof RowSelection) {
      x = cfg.headerWidth + firstVisibleCol * cfg.defaultColWidth - vp.scrollX;
      y = cfg.headerHeight + sel.row * cfg.defaultRowHeight - vp.scrollY;
      w = visibleCols * cfg.defaultColWidth; // stop at last visible col
      h = cfg.defaultRowHeight;
    } else if (sel instanceof RangeSelection) {
      x = cfg.headerWidth + sel.c0 * cfg.defaultColWidth - vp.scrollX;
      y = cfg.headerHeight + sel.r0 * cfg.defaultRowHeight - vp.scrollY;
      w = (sel.c1 - sel.c0 + 1) * cfg.defaultColWidth;
      h = (sel.r1 - sel.r0 + 1) * cfg.defaultRowHeight;
    } else if (sel instanceof ColumnRangeSelection) {
      /* Column‑range border */
      x = cfg.headerWidth + sel.c0 * cfg.defaultColWidth - vp.scrollX;
      y = cfg.headerHeight;
      w = (sel.c1 - sel.c0 + 1) * cfg.defaultColWidth;
      h = vp.height - cfg.headerHeight;
    } else if (sel instanceof RowRangeSelection) {
      /* Row‑range border */
      x = cfg.headerWidth;
      y = cfg.headerHeight + sel.r0 * cfg.defaultRowHeight - vp.scrollY;
      w = vp.width - cfg.headerWidth;
      h = (sel.r1 - sel.r0 + 1) * cfg.defaultRowHeight;
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(
      cfg.headerWidth,
      cfg.headerHeight,
      vp.width - cfg.headerWidth,
      vp.height - cfg.headerHeight
    );
    ctx.clip();

    ctx.strokeStyle = this.selectionBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 1, h - 1);

    ctx.restore();
  }

  /* ───────────────────────────  helper  ─────────────────────────────── */

  /**
   *
   * @param col
   * @returns
   */
  private columnName(col: number): string {
    let name = "";
    for (let n = col; n >= 0; n = Math.floor(n / 26) - 1) {
      name = String.fromCharCode((n % 26) + 65) + name;
    }
    return name;
  }
}
