export abstract class ValueObject<TValue> {
  protected readonly value: TValue;

  protected constructor(value: TValue) {
    this.value = value;
  }

  getValue(): TValue {
    return this.value;
  }

  equals(other?: ValueObject<TValue>): boolean {
    if (other == null) return false;
    return this.equalsValue(this.value, other.value);
  }

  private equalsValue(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== 'object' || typeof b !== 'object') return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) =>
        this.equalsValue(item, (b as unknown[])[index]),
      );
    }
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) =>
      this.equalsValue(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
      ),
    );
  }
}
