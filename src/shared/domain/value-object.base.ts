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
    return JSON.stringify(this.value) === JSON.stringify(other.value);
  }
}
