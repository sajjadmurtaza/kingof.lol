export function promoErrorMessage(code: string, t: (key: string) => string): string {
  switch (code) {
    case "PROMO_INVALID":
      return t("promoInvalid");
    case "PROMO_EXPIRED":
      return t("promoExpired");
    case "PROMO_MAX_REDEMPTIONS":
      return t("promoMaxRedemptions");
    case "PROMO_ALREADY_USED":
      return t("promoAlreadyUsed");
    case "PROMO_NOT_FIRST_PAID":
      return t("promoNotFirstPaid");
    case "PROMO_INCREASE_NOT_ELIGIBLE":
      return t("promoIncreaseNotEligible");
    case "PROMO_SETUP_REQUIRED":
      return t("promoSetupRequired");
    default:
      return t("promoInvalid");
  }
}
