/**
 * Minimal key‑value storage for cell contents.
 * Keys are "row,col" strings → value string.
 */
export class DataStore {
    constructor() {
        this.map = new Map();
    }
    /**
     *
     * @param r
     * @param c
     * @returns
     */
    key(r, c) {
        return `${r},${c}`;
    }
    /**Save or update a cell; empty strings erase the entry */
    /**
     *
     * @param r
     * @param c
     * @param value
     */
    set(r, c, value) {
        const k = this.key(r, c);
        value ? this.map.set(k, value) : this.map.delete(k);
    }
    /**Retrieve a cell value (or `undefined`) */
    /**
     *
     * @param r
     * @param c
     * @returns
     */
    get(r, c) {
        return this.map.get(this.key(r, c));
    }
}
