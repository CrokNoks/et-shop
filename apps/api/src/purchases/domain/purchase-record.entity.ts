import { randomUUID } from 'crypto';

export interface PurchaseRecordProps {
  id: string;
  shoppingListItemId: string;
  listId: string;
  householdId: string;
  catalogItemId: string;
  itemName: string;
  categoryName?: string;
  pricePerUnit: number;
  quantity: number;
  unit: string;
  categoryId?: string;
  storeId?: string;
  purchasedAt: Date;
}

export class PurchaseRecord {
  private constructor(private readonly props: PurchaseRecordProps) {}

  get id(): string {
    return this.props.id;
  }

  get shoppingListItemId(): string {
    return this.props.shoppingListItemId;
  }

  get listId(): string {
    return this.props.listId;
  }

  get householdId(): string {
    return this.props.householdId;
  }

  get catalogItemId(): string {
    return this.props.catalogItemId;
  }

  get itemName(): string {
    return this.props.itemName;
  }

  get categoryName(): string | undefined {
    return this.props.categoryName;
  }

  get pricePerUnit(): number {
    return this.props.pricePerUnit;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get unit(): string {
    return this.props.unit;
  }

  get categoryId(): string | undefined {
    return this.props.categoryId;
  }

  get storeId(): string | undefined {
    return this.props.storeId;
  }

  get purchasedAt(): Date {
    return this.props.purchasedAt;
  }

  get totalAmount(): number {
    return this.props.pricePerUnit * this.props.quantity;
  }

  static create(
    props: Omit<PurchaseRecordProps, 'id' | 'purchasedAt'>,
    id?: string,
  ): PurchaseRecord {
    return new PurchaseRecord({
      id: id ?? randomUUID(),
      purchasedAt: new Date(),
      ...props,
    });
  }

  static reconstitute(props: PurchaseRecordProps): PurchaseRecord {
    return new PurchaseRecord(props);
  }

  toJSON(): PurchaseRecordProps {
    return { ...this.props };
  }
}
