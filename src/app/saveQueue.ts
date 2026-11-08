/** Serialize saves so an older write cannot complete after a newer one. */
export class SaveQueue {
  private tail: Promise<unknown> = Promise.resolve();
  run<T>(save: () => Promise<T>): Promise<T> {
    const result = this.tail.then(save);
    this.tail = result.catch(() => undefined);
    return result;
  }
  async idle() { await this.tail; }
}
