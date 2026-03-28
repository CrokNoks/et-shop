import { BarcodeFormat } from './barcode-format.enum';

export interface LoyaltyCardProps {
  id: string;
  userId: string;
  storeId: string;
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

  update(
    props: Partial<Omit<LoyaltyCardProps, 'id' | 'userId' | 'createdAt'>>,
  ): void {
    const { ...updatableProps } = props; // Filter out id and userId
    Object.assign(this.props, { ...updatableProps, updatedAt: new Date() });
  }
}
