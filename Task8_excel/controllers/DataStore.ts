/**
 * Minimal key‑value storage for cell contents.
 * Keys are "row,col" strings → value string.
 */
export class DataStore {
  private readonly map = new Map<string, string>();

  private key(r: number, c: number): string {
    return `${r},${c}`;
  }

  /**Save or update a cell; empty strings erase the entry */
  set(r: number, c: number, value: string): void {
    const k = this.key(r, c);
    value ? this.map.set(k, value) : this.map.delete(k);
  }

  /**Retrieve a cell value (or `undefined`) */
  get(r: number, c: number): string | undefined {
    return this.map.get(this.key(r, c));
  }
}
