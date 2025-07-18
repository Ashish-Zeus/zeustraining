// HistoryManager.ts
export class HistoryManager {
    /**
     *
     * @param {Grid} grid
     */
    constructor(grid) {
        this.grid = grid;
        this.undoStack = [];
        this.redoStack = [];
    }
    /**
     * Executes a new action and adds it to the history.
     * This is the main entry point for new user actions.
     */
    /**
     *
     * @param {GridAction} action
     */
    addAndExecute(action) {
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
    add(action) {
        this.undoStack.push(action);
        this.redoStack = []; // A new action invalidates the old redo history.
    }
    /**
     * Undoes the last action, moving it to the redo stack.
     */
    undo() {
        const action = this.undoStack.pop();
        if (action) {
            action.undo(this.grid);
            this.redoStack.push(action);
        }
    }
    /**
     * Redoes the last undone action, moving it back to the undo stack.
     */
    redo() {
        const action = this.redoStack.pop();
        if (action) {
            action.execute(this.grid);
            this.undoStack.push(action);
        }
    }
}
