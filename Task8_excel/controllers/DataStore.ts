/**
 * Minimal key‑value storage for cell contents.
 * Keys are "row,col" strings → value string.
 */
export class DataStore {
  private readonly map = new Map<string, string>();

  /**
   * 
   * @param r 
   * @param c 
   * @returns 
   */
  private key(r: number, c: number): string {
    return `${r},${c}`;
  }

  /**Save or update a cell; empty strings erase the entry */
  /**
   * 
   * @param r 
   * @param c 
   * @param value 
   */
  set(r: number, c: number, value: string): void {
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
  get(r: number, c: number): string | undefined {
    return this.map.get(this.key(r, c));
  }
}
