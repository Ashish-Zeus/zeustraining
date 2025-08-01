import { Grid } from "./Grid.js";

let grid: Grid;

window.addEventListener("DOMContentLoaded", () => {
  grid = new Grid({
    rows: 100_000,
    cols: 500,
    defaultRowHeight: 22,
    defaultColWidth: 100,
    headerHeight: 24,
    headerWidth: 60,
  });

  // Fit once now – future resizes handled by ResizeObserver inside Grid
  grid.resize(window.innerWidth, window.innerHeight);
});
