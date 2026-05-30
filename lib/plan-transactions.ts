export const ADVANCE_PAYMENT_DESCRIPTION = "Advance Payment";
export const DISCOUNT_DESCRIPTION = "Discount";

export function isPlanDiscountTransaction(description: string | null | undefined) {
  return description === DISCOUNT_DESCRIPTION;
}

export function isCollectedPlanTransaction(description: string | null | undefined) {
  return !isPlanDiscountTransaction(description);
}
