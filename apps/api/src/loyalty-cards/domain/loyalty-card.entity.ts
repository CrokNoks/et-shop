import { BarcodeFormat } from './barcode-format.enum';

export interface LoyaltyCardProps {
  id: string;
  userId: string;
  storeId: string;
  name: string;
  description?: string;
  cardData: string;
  barcodeFormat: BarcodeFormat;
  customColor?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class LoyaltyCard {
  private constructor(private props: LoyaltyCardProps) {}

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get storeId(): string {
    return this.props.storeId;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get cardData(): string {
    return this.props.cardData;
  }

  get barcodeFormat(): BarcodeFormat {
    return this.props.barcodeFormat;
  }

  get customColor(): string | undefined {
    return this.props.customColor;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  static create(
    props: Omit<LoyaltyCardProps, 'id' | 'createdAt' | 'updatedAt'>,
    id?: string,
  ): LoyaltyCard {
    const now = new Date();
    // In a real application, you might use a dedicated UUID generation library
    // or rely on database-generated IDs. For a domain entity, this is illustrative.
    return new LoyaltyCard({
      id: id || require('crypto').randomUUID(),
      createdAt: now,
      updatedAt: now,
      ...props,
    });
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      storeId: this.storeId,
      name: this.name,
      description: this.description,
      cardData: this.cardData,
      barcodeFormat: this.barcodeFormat,
      customColor: this.customColor,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  update(
    props: Partial<Omit<LoyaltyCardProps, 'id' | 'userId' | 'createdAt'>>,
  ): void {
    // Destructure to explicitly exclude immutable fields even when bypassed with `as any`
    const {
      id: _id,
      userId: _userId,
      createdAt: _createdAt,
      ...updatableProps
    } = props as any;
    Object.assign(this.props, { ...updatableProps, updatedAt: new Date() });
  }
}
