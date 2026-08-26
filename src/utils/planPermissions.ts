export interface PlanFeatures {
  maxBankAccounts: number;
  maxUsers: number;
  hasOFXReconciliation: boolean;
  hasCostCenters: boolean;
  hasAdvancedDRE: boolean;
  hasMultiBranch: boolean;
  hasAccountantAccess: boolean;
  hasPrioritySupport: boolean;
  planDisplayName: string;
}

export const PLAN_LIMITS: Record<'starter' | 'pro' | 'business', PlanFeatures> = {
  starter: {
    maxBankAccounts: 2,
    maxUsers: 1,
    hasOFXReconciliation: false,
    hasCostCenters: false,
    hasAdvancedDRE: false,
    hasMultiBranch: false,
    hasAccountantAccess: false,
    hasPrioritySupport: false,
    planDisplayName: 'Starter',
  },
  pro: {
    maxBankAccounts: Infinity,
    maxUsers: 5,
    hasOFXReconciliation: true,
    hasCostCenters: true,
    hasAdvancedDRE: true,
    hasMultiBranch: false,
    hasAccountantAccess: false,
    hasPrioritySupport: true,
    planDisplayName: 'Pro',
  },
  business: {
    maxBankAccounts: Infinity,
    maxUsers: Infinity,
    hasOFXReconciliation: true,
    hasCostCenters: true,
    hasAdvancedDRE: true,
    hasMultiBranch: true,
    hasAccountantAccess: true,
    hasPrioritySupport: true,
    planDisplayName: 'Business',
  },
};

export const getPlanFeatures = (
  plan: 'starter' | 'pro' | 'business' = 'pro',
  isTrial: boolean = false
): PlanFeatures => {
  if (isTrial) {
    // 14-day evaluation / trial gets full Pro features
    return PLAN_LIMITS.pro;
  }
  return PLAN_LIMITS[plan] || PLAN_LIMITS.pro;
};
