/**
 * Minimal key‑value storage for cell contents.
 * Keys are "row,col" strings → value string.
 */
export class DataStore {
    /**
     *
     * @param {Map<string,string>} initialMap
     * @param {Map<number,number>} initialRowCounts
     * @param {Map<number,number>} initialColCounts
     */
    constructor(initialMap, initialRowCounts, initialColCounts) {
        this.map = new Map();
        this.rowCounts = new Map();
        this.colCounts = new Map();
        this.map = initialMap ? new Map(initialMap.entries()) : new Map();
        this.rowCounts = initialRowCounts ? new Map(initialRowCounts.entries()) : new Map();
        this.colCounts = initialColCounts ? new Map(initialColCounts.entries()) : new Map();
    }
    /**
     *
     * @param {number} r
     * @param {number} c
     * @returns
     */
    key(r, c) {
        return `${r},${c}`;
    }
    /**Save or update a cell; empty strings erase the entry */
    /**
     *
     * @param {number} r
     * @param {number} c
     * @param {string} value
     * @returns {void}
     */
    set(r, c, value) {
        const k = this.key(r, c);
        const oldValueExists = this.map.has(k) && this.map.get(k) !== '';
        const newValueExists = value !== '' && value !== undefined;
        if (newValueExists) {
            this.map.set(k, value);
            if (!oldValueExists) {
                this.rowCounts.set(r, (this.rowCounts.get(r) ?? 0) + 1);
                this.colCounts.set(c, (this.colCounts.get(c) ?? 0) + 1);
            }
        }
        else { // Deleting a value
            if (oldValueExists) {
                this.map.delete(k);
                const newRowCount = (this.rowCounts.get(r) ?? 1) - 1;
                if (newRowCount === 0)
                    this.rowCounts.delete(r);
                else
                    this.rowCounts.set(r, newRowCount);
                const newColCount = (this.colCounts.get(c) ?? 1) - 1;
                if (newColCount === 0)
                    this.colCounts.delete(c);
                else
                    this.colCounts.set(c, newColCount);
            }
        }
    }
    /**Retrieve a cell value (or `undefined`) */
    /**
     *
     * @param {number} r
     * @param {number} c
     * @returns {string | undefined}
     */
    get(r, c) {
        return this.map.get(this.key(r, c));
    }
    /**
     *
     * @param {number} r
     * @returns {boolean}
     */
    hasDataInRow(r) {
        return this.rowCounts.has(r);
    }
    /**
     *
     * @param {number} c
     * @returns {boolean}
     */
    hasDataInCol(c) {
        return this.colCounts.has(c);
    }
    getEntries() {
        return this.map.entries();
    }
    /**
     *
     * @returns {DataStore}
     */
    clone() {
        return new DataStore(this.map);
    }
}
