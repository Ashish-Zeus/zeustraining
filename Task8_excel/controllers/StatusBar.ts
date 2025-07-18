// StatusBar.ts

import { DataStore } from "./DataStore.js";
import { AnySelection, RangeSelection, RowSelection, ColumnSelection } from "./Selection.js";
import { GridConfig } from "./Grid.js";

export class StatusBar {
  private avgEl: HTMLSpanElement;
  private countEl: HTMLSpanElement;
  private sumEl: HTMLSpanElement;
  private maxEl: HTMLSpanElement;
  private minEl: HTMLSpanElement;

  constructor() {
    this.avgEl = document.getElementById("avg-display") as HTMLSpanElement;
    this.countEl = document.getElementById("count-display") as HTMLSpanElement;
    this.sumEl = document.getElementById("sum-display") as HTMLSpanElement;
    this.maxEl = document.getElementById("max-display") as HTMLSpanElement;
    this.minEl = document.getElementById("min-display") as HTMLSpanElement;
  }

  /**
   * Updates the status bar based on the current selection.
   * @param {DataStore} data
   * @param {AnySelection} sel 
   * @param {GridConfig} cfg 
   */
  public update(data: DataStore, sel: AnySelection, cfg: GridConfig): void {
    if (!sel) {
      this.clear();
      return;
    }

    const numbers: number[] = [];
    let r0 = 0, r1 = 0, c0 = 0, c1 = 0;

    if (sel instanceof RangeSelection) {
      ({ r0, r1, c0, c1 } = sel);
    } else if (sel instanceof RowSelection) {
      ({ r0, r1 } = sel);
      c0 = 0;
      c1 = cfg.cols - 1;
    } else if (sel instanceof ColumnSelection) {
      ({ c0, c1 } = sel);
      r0 = 0;
      r1 = cfg.rows - 1;
    }

    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const val = data.get(r, c);
        if (val) {
          const num = parseFloat(val);
          if (val.trim() !== '' && !isNaN(num)) {
            numbers.push(num);
          }
        }
      }
    }

    if (numbers.length > 0) {
      const sum = numbers.reduce((a, b) => a + b, 0);
      const avg = sum / numbers.length;
      const maxNum = Math.max(...numbers);
      const minNum = Math.min(...numbers);
      this.avgEl.textContent = `Average: ${this.formatNumber(avg)}`;
      this.countEl.textContent = `Count: ${numbers.length}`;
      this.sumEl.textContent = `Sum: ${this.formatNumber(sum)}`;
      this.maxEl.textContent = `Max: ${this.formatNumber(maxNum)}`;
      this.minEl.textContent = `Min: ${this.formatNumber(minNum)}`;
    } else {
      this.clear();
    }
  }

  /**
   * 
   * @param {number} num 
   * @returns {string}
   */
  private formatNumber(num: number): string {
    // Format to a max of 2 decimal places if needed
    return parseFloat(num.toFixed(2)).toLocaleString();
  }
  
  private clear(): void {
    this.avgEl.textContent = "";
    this.countEl.textContent = "";
    this.sumEl.textContent = "";
    this.maxEl.textContent = "";
    this.minEl.textContent = "";
  }
}