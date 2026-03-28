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
  name: string;
  description?: string;
  cardData: string;
  barcodeFormat: BarcodeFormat;
  customColor?: string;
  createdAt: string;
  updatedAt: string;
}
