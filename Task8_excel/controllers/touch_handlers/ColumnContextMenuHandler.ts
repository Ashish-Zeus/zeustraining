import { Grid } from "../Grid.js";
import { PointerHandler } from "./TouchHandler.js";
import { InsertColumnCommand, DeleteColumnCommand } from "../Actions.js";

export class ColumnContextMenuHandler implements PointerHandler {
  private grid: Grid | null = null;

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
  public hitTest(e: MouseEvent): boolean {
    if (!this.grid) return false;

    if (e.button !== 2) return false;

    const rect = this.grid.getScroller().getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cfg = this.grid.getConfig();
    return y < cfg.headerHeight && x > cfg.headerWidth;
  }

  /**
   * 
   * @param {MouseEvent} e
   */
  public onPointerDown(e: MouseEvent): void {
    if (!this.grid) return;

    e.preventDefault();
    this.removeContextMenu();

    const { col } = this.grid.bodyCoordsFromEvent(e);
    const clickedColumnWidth = this.grid.getColWidth(col);
    const menuItems: { label: string; action: () => void }[] = [];
    menuItems.push({
      label: "Insert Column Left",
      action: () =>
        this.grid!.getHistoryManager().addAndExecute(
          new InsertColumnCommand(col,clickedColumnWidth)
        ),
    });
    menuItems.push({
      label: "Insert Column Right",
      action: () =>
        this.grid!.getHistoryManager().addAndExecute(
          new InsertColumnCommand(col + 1,clickedColumnWidth)
        ),
    });

    if (menuItems.length > 0) {
      menuItems.push({ label: "---", action: () => {} });
    }

    menuItems.push({
      label: "Delete Column",
      action: () =>
        this.grid!.getHistoryManager().addAndExecute(
          new DeleteColumnCommand(col,this.grid!)
        ),
    });

    const menu = this.createMenu(e.clientX, e.clientY, menuItems);
    document.body.appendChild(menu);
  }

  /**
   * 
   * @param {number} x 
   * @param {number} y 
   * @param {Array<>} items 
   * @returns {HTMLDivElement}
   */
  private createMenu(
    x: number,
    y: number,
    items: { label: string; action: () => void }[]
  ): HTMLDivElement {
    const menu = document.createElement("div");
    menu.id = "grid-context-menu";
    Object.assign(menu.style, {
      position: "fixed",
      top: `${y}px`,
      left: `${x}px`,
      backgroundColor: "#f4f6f9",
      border: "1px solid #d4d4d4",
      boxShadow: "2px 2px 5px rgba(0,0,0,0.2)",
      zIndex: "1000",
      padding: "5px 0",
      fontFamily: "system-ui, sans-serif",
      fontSize: "12px",
    });

    items.forEach((item) => {
      if (item.label === "---") {
        const separator = document.createElement("div");
        Object.assign(separator.style, {
          height: "1px",
          backgroundColor: "#d4d4d4",
          margin: "5px 0",
        });
        menu.appendChild(separator);
      } else {
        const btn = document.createElement("div");
        btn.textContent = item.label;
        Object.assign(btn.style, { padding: "8px 15px", cursor: "pointer" });
        btn.onmouseenter = () => (btn.style.backgroundColor = "#e8f2ec");
        btn.onmouseleave = () => (btn.style.backgroundColor = "transparent");
        btn.onclick = () => {
          item.action();
          this.removeContextMenu();
        };
        menu.appendChild(btn);
      }
    });

    setTimeout(
      () =>
        window.addEventListener("click", this.removeContextMenu, {
          once: true,
        }),
      0
    );
    return menu;
  }

  private removeContextMenu = (): void => {
    const menu = document.getElementById("grid-context-menu");
    if (menu) menu.remove();
  };

  public onPointerMove(e: MouseEvent): void {}
  public onPointerUp(): void {}
  public setCursor(e: MouseEvent): void {}
}
