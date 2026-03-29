export interface PurchaseRecordProps {
  id: string;
  shoppingListItemId: string;
  listId: string;
  householdId: string;
  catalogItemId: string;
  productName: string;
  quantity: number;
  unit: string;
  price: number;
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

  get productName(): string {
    return this.props.productName;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get unit(): string {
    return this.props.unit;
  }

  get price(): number {
    return this.props.price;
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
    return this.props.price * this.props.quantity;
  }

  static create(
    props: Omit<PurchaseRecordProps, 'id' | 'purchasedAt'>,
    id?: string,
  ): PurchaseRecord {
    return new PurchaseRecord({
      id: id ?? require('crypto').randomUUID(),
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
