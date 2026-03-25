export interface PriceAlert {
  id: string;
  route_id: string;
  target_price: number;
  active: boolean;
  created_at: string;
}

export function shouldTriggerAlert(
  currentPrice: number,
  targetPrice: number
): boolean {
  return currentPrice <= targetPrice;
}
