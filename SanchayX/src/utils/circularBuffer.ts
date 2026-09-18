/**
 * CircularRingBuffer: Fixed-capacity Ring Buffer for 24/7 Tick Streams
 * Blueprint Optimization 3: Memory Leak Prevention
 * Strictly bounds memory consumption under 5 MB regardless of session duration.
 */
export class CircularRingBuffer<T> {
  private buffer: (T | undefined)[];
  private pointer = 0;
  private size = 0;
  private readonly capacity: number;

  constructor(capacity: number = 500) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  /**
   * Pushes a new item into the circular buffer, overwriting the oldest item when full.
   */
  push(item: T): void {
    this.buffer[this.pointer] = item;
    this.pointer = (this.pointer + 1) % this.capacity;
    if (this.size < this.capacity) {
      this.size++;
    }
  }

  /**
   * Returns all items in chronological order (oldest to newest).
   */
  toArray(): T[] {
    if (this.size < this.capacity) {
      return this.buffer.slice(0, this.size) as T[];
    }
    return [
      ...this.buffer.slice(this.pointer),
      ...this.buffer.slice(0, this.pointer)
    ] as T[];
  }

  /**
   * Returns the most recently inserted item, or undefined if empty.
   */
  getLatest(): T | undefined {
    if (this.size === 0) return undefined;
    const latestIndex = (this.pointer - 1 + this.capacity) % this.capacity;
    return this.buffer[latestIndex];
  }

  /**
   * Returns current number of elements stored.
   */
  getSize(): number {
    return this.size;
  }

  /**
   * Returns maximum capacity.
   */
  getCapacity(): number {
    return this.capacity;
  }

  /**
   * Clears the buffer.
   */
  clear(): void {
    this.buffer = new Array(this.capacity);
    this.pointer = 0;
    this.size = 0;
  }
}
