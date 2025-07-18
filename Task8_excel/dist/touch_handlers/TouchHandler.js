export default class TouchHandler {
    /**
     * Initializes the TouchHandler.
     * @param {Grid} grid
     */
    constructor(grid) {
        /**
         * List of registered pointer event handlers.
         * @type {PointerHandler[]}
         */
        this.handlers = [];
        /**
         * Currently active handler during a pointer interaction.
         * @type {PointerHandler|null}
         */
        this.curHandler = null;
        this.grid = grid;
    }
    /**
     * Registers a handler for pointer events.
     * @param {PointerHandler} handler - The handler to register.
     */
    registerHandler(handler) {
        this.handlers.push(handler);
        handler.setGrid(this.grid); // Pass the grid instance to the handler
    }
    /**
     * Handles pointer down event and delegates to the appropriate handler.
     * @param {MouseEvent} e - The pointer event.
     */
    onMouseDown(e) {
        const scroller = this.grid.getScroller();
        const rect = scroller.getBoundingClientRect();
        // Click on the vertical scrollbar
        const onVScroll = e.clientX >= rect.left + scroller.clientWidth;
        //Click on the horizontal scrollbar
        const onHScroll = e.clientY >= rect.top + scroller.clientHeight;
        // If the click is on either scrollbar, do nothing.
        if (onVScroll || onHScroll) {
            return;
        }
        if (e.button !== 0)
            return;
        for (const handler of this.handlers) {
            if (handler.hitTest(e)) {
                this.curHandler = handler;
                this.curHandler.onPointerDown(e);
                break;
            }
        }
    }
    /**
     * Specifically handles the context menu
     * @param {MouseEvent} e
     */
    onContextMenu(e) {
        const scroller = this.grid.getScroller();
        const rect = scroller.getBoundingClientRect();
        //Click is on the vertical scrollbar
        const onVScroll = e.clientX >= rect.left + scroller.clientWidth;
        // Click is on the horizontal scrollbar
        const onHScroll = e.clientY >= rect.top + scroller.clientHeight;
        // If the click is on either scrollbar, do nothing.
        if (onVScroll || onHScroll) {
            return;
        }
        for (const handler of this.handlers) {
            if (handler.hitTest(e)) {
                this.curHandler = handler;
                this.curHandler.onPointerDown(e);
                break;
            }
        }
    }
    /**
     * Handles pointer move event and delegates to the current handler.
     * If no handler is active, it checks if any handler can take over (e.g., for cursor changes).
     * @param {MouseEvent} e - The pointer event.
     */
    onMouseMove(e) {
        if (this.curHandler) {
            this.curHandler.onPointerMove(e);
        }
        else {
            // No active handler, check if any handler wants to respond to a hover (e.g., cursor change)
            let cursorSet = false;
            for (const handler of this.handlers) {
                if (handler.hitTest(e)) {
                    // A handler is being hovered over, let it handle the move (e.g., set cursor)
                    handler.onPointerMove(e);
                    handler.setCursor(e);
                    cursorSet = true;
                    break; // Only one handler should set the cursor at a time
                }
            }
            if (!cursorSet) {
                // If no handler hit, revert to default cursor
                this.grid.getScroller().style.cursor = "default";
            }
        }
    }
    /**
     * Handles pointer up event and resets the current handler to null.
     * @param {MouseEvent} e - The pointer event.
     */
    onMouseUp(e) {
        if (this.curHandler) {
            this.curHandler.onPointerUp();
        }
        else {
            // If no handler was active, check if any handler should respond to a general mouse up (e.g., resetting state)
            for (const handler of this.handlers) {
                handler.onPointerUp(); // Call onPointerUp on all handlers to ensure they reset their state
            }
        }
        this.curHandler = null;
        // this.grid.getScroller().style.cursor = 'default';
        for (const handler of this.handlers) {
            if (handler.hitTest(e)) {
                handler.setCursor(e);
                break;
            }
        }
    }
}
