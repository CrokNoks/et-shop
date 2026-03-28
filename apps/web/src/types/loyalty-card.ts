// app_build/apps/web/src/types/loyalty-card.ts

export enum BarcodeFormat {
  CODE_128 = "CODE_128",
  QR_CODE = "QR_CODE",
  EAN_13 = "EAN_13",
  UNKNOWN = "UNKNOWN",
}

export interface LoyaltyCardFrontend {
  id: string;
  userId: string;
  storeId: string;
  cardData: string;
  barcodeFormat: BarcodeFormat;
  customColor?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}
