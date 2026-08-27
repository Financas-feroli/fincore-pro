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

export interface PlanPricing {
  monthly: number;
  yearly: number;
  yearlyTotal: number;
  yearlySavings: number;
  label: string;
  subtitle: string;
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

/** Centralized plan pricing — single source of truth for all UI components */
export const PLAN_PRICING: Record<'starter' | 'pro' | 'business', PlanPricing> = {
  starter: {
    monthly: 49,
    yearly: 39,
    yearlyTotal: 470,
    yearlySavings: 118,
    label: 'Starter',
    subtitle: 'Ideal para MEIs e profissionais autônomos',
  },
  pro: {
    monthly: 97,
    yearly: 77,
    yearlyTotal: 930,
    yearlySavings: 234,
    label: 'Pro',
    subtitle: 'Para pequenas e médias empresas em crescimento',
  },
  business: {
    monthly: 197,
    yearly: 157,
    yearlyTotal: 1890,
    yearlySavings: 474,
    label: 'Business',
    subtitle: 'Para empresas com múltiplas filiais e equipes',
  },
};

/**
 * Returns the plan features for the given plan, checking trial expiration.
 * If the trial has expired, the user is automatically downgraded to Starter.
 */
export const getPlanFeatures = (
  plan: 'starter' | 'pro' | 'business' = 'pro',
  isTrial: boolean = false,
  trialEndsAt?: string | null
): PlanFeatures => {
  if (isTrial) {
    // Check if trial has expired
    if (trialEndsAt) {
      const trialEnd = new Date(trialEndsAt).getTime();
      const now = Date.now();
      if (now > trialEnd) {
        // Trial expired — downgrade to Starter until user subscribes
        return PLAN_LIMITS.starter;
      }
    }
    // Trial still valid — grant full Pro features
    return PLAN_LIMITS.pro;
  }
  return PLAN_LIMITS[plan] || PLAN_LIMITS.pro;
};

/** Helper: check if trial is expired */
export const isTrialExpired = (
  isTrial: boolean,
  trialEndsAt?: string | null
): boolean => {
  if (!isTrial || !trialEndsAt) return false;
  return Date.now() > new Date(trialEndsAt).getTime();
};
