// HistoryManager.ts

import { Grid } from './Grid.js';
import { GridAction } from './Actions.js';

export class HistoryManager {
  private undoStack: GridAction[] = [];
  private redoStack: GridAction[] = [];

  /**
   * 
   * @param {Grid} grid 
   */
  constructor(private readonly grid: Grid) {}

  /**
   * Executes a new action and adds it to the history.
   * This is the main entry point for new user actions.
   */
  /**
   * 
   * @param {GridAction} action 
   */
  public addAndExecute(action: GridAction): void {
    // First, execute the action.
    action.execute(this.grid);

    // Then, add it to the undo stack.
    this.undoStack.push(action);
    this.redoStack = []; // A new action invalidates the old redo history.
  }

  /**
   * Adds a new action to the history, clearing any possible "redo" actions.
   * @param {GridAction} action
   */
  public add(action: GridAction): void {
    this.undoStack.push(action);
    this.redoStack = []; // A new action invalidates the old redo history.
  }

  /**
   * Undoes the last action, moving it to the redo stack.
   */
  public undo(): void {
    const action = this.undoStack.pop();
    if (action) {
      action.undo(this.grid);
      this.redoStack.push(action);
    }
  }

  /**
   * Redoes the last undone action, moving it back to the undo stack.
   */
  public redo(): void {
    const action = this.redoStack.pop();
    if (action) {
      action.execute(this.grid);
      this.undoStack.push(action);
    }
  }
}