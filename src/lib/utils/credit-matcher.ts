import { CreditEntry } from '@/lib/db/idb';

export interface AppliedPaymentInfo {
  paymentId: string;
  paymentTimestamp: number;
  paymentDescription: string;
  amountApplied: number;
}

export interface MatchedCredit {
  id: string;
  timestamp: number;
  description: string;
  originalAmount: number;
  amountPaid: number;
  remainingBalance: number;
  status: 'fully_paid' | 'partially_paid' | 'unpaid';
  settledAt?: number;
  appliedPayments: AppliedPaymentInfo[];
}

export interface CoveredCreditInfo {
  creditId: string;
  creditTimestamp: number;
  creditDescription: string;
  originalCreditAmount: number;
  amountCovered: number;
  isFullySettledByThis: boolean;
  creditRemainingAfter: number;
}

export interface MatchedPayment {
  id: string;
  timestamp: number;
  description: string;
  paymentAmount: number;
  targetCreditId?: string;
  coveredCredits: CoveredCreditInfo[];
  unallocatedAmount: number; // Advance payment / excess credit
}

export interface CrossMatchSummary {
  totalCredits: number;
  totalPayments: number;
  totalOutstanding: number;
  totalSettledCredits: number;
  totalPartialCredits: number;
  totalUnpaidCredits: number;
}

export interface CrossMatchResult {
  credits: MatchedCredit[];
  payments: MatchedPayment[];
  summary: CrossMatchSummary;
}

/**
 * Deterministically cross-matches historical credits (utang) and payments (bayad).
 * Evaluates FIFO settlement and any specific target assignments.
 */
export function computeCreditCrossMatch(entries: CreditEntry[]): CrossMatchResult {
  const activeEntries = entries.filter(e => !e.isDeleted);

  // Separate and sort chronologically (oldest first for FIFO)
  const creditEntries = activeEntries
    .filter(e => e.type === 'credit')
    .sort((a, b) => a.timestamp - b.timestamp);

  const paymentEntries = activeEntries
    .filter(e => e.type === 'payment')
    .sort((a, b) => a.timestamp - b.timestamp);

  const matchedCredits: MatchedCredit[] = creditEntries.map(c => {
    const originalAmount = Math.abs(c.amount);
    return {
      id: c.id,
      timestamp: c.timestamp,
      description: c.description,
      originalAmount,
      amountPaid: 0,
      remainingBalance: originalAmount,
      status: 'unpaid',
      appliedPayments: [],
    };
  });

  const paymentTrackers = paymentEntries.map(p => {
    const paymentAmount = Math.abs(p.amount);
    return {
      id: p.id,
      timestamp: p.timestamp,
      description: p.description,
      paymentAmount,
      targetCreditId: p.targetCreditId,
      remainingToAllocate: paymentAmount,
      coveredCredits: [] as CoveredCreditInfo[],
      unallocatedAmount: 0,
    };
  });

  // Step 1: Explicit target matching if any payment targeted a specific credit
  for (const p of paymentTrackers) {
    if (p.targetCreditId && p.remainingToAllocate > 0.0001) {
      const targetCredit = matchedCredits.find(c => c.id === p.targetCreditId);
      if (targetCredit && targetCredit.remainingBalance > 0.0001) {
        const alloc = Math.min(p.remainingToAllocate, targetCredit.remainingBalance);
        targetCredit.amountPaid += alloc;
        targetCredit.remainingBalance -= alloc;
        p.remainingToAllocate -= alloc;

        targetCredit.appliedPayments.push({
          paymentId: p.id,
          paymentTimestamp: p.timestamp,
          paymentDescription: p.description,
          amountApplied: alloc,
        });

        p.coveredCredits.push({
          creditId: targetCredit.id,
          creditTimestamp: targetCredit.timestamp,
          creditDescription: targetCredit.description,
          originalCreditAmount: targetCredit.originalAmount,
          amountCovered: alloc,
          isFullySettledByThis: targetCredit.remainingBalance < 0.0001,
          creditRemainingAfter: Math.max(0, targetCredit.remainingBalance),
        });
      }
    }
  }

  // Step 2: FIFO matching (oldest unpaid debts receive payments in order)
  for (const p of paymentTrackers) {
    while (p.remainingToAllocate > 0.0001) {
      const openCredit = matchedCredits.find(c => c.remainingBalance > 0.0001);
      if (!openCredit) {
        p.unallocatedAmount = p.remainingToAllocate;
        p.remainingToAllocate = 0;
        break;
      }

      const alloc = Math.min(p.remainingToAllocate, openCredit.remainingBalance);
      openCredit.amountPaid += alloc;
      openCredit.remainingBalance -= alloc;
      p.remainingToAllocate -= alloc;

      openCredit.appliedPayments.push({
        paymentId: p.id,
        paymentTimestamp: p.timestamp,
        paymentDescription: p.description,
        amountApplied: alloc,
      });

      p.coveredCredits.push({
        creditId: openCredit.id,
        creditTimestamp: openCredit.timestamp,
        creditDescription: openCredit.description,
        originalCreditAmount: openCredit.originalAmount,
        amountCovered: alloc,
        isFullySettledByThis: openCredit.remainingBalance < 0.0001,
        creditRemainingAfter: Math.max(0, openCredit.remainingBalance),
      });
    }
  }

  // Finalize credit statuses
  let totalSettledCredits = 0;
  let totalPartialCredits = 0;
  let totalUnpaidCredits = 0;

  for (const c of matchedCredits) {
    if (c.remainingBalance < 0.0001) {
      c.remainingBalance = 0;
      c.status = 'fully_paid';
      totalSettledCredits++;
      const lastPayment = c.appliedPayments[c.appliedPayments.length - 1];
      if (lastPayment) {
        c.settledAt = lastPayment.paymentTimestamp;
      }
    } else if (c.amountPaid > 0.0001) {
      c.status = 'partially_paid';
      totalPartialCredits++;
    } else {
      c.status = 'unpaid';
      totalUnpaidCredits++;
    }
  }

  const matchedPayments: MatchedPayment[] = paymentTrackers.map(p => ({
    id: p.id,
    timestamp: p.timestamp,
    description: p.description,
    paymentAmount: p.paymentAmount,
    targetCreditId: p.targetCreditId,
    coveredCredits: p.coveredCredits,
    unallocatedAmount: p.unallocatedAmount,
  }));

  const totalCredits = matchedCredits.reduce((sum, c) => sum + c.originalAmount, 0);
  const totalPayments = matchedPayments.reduce((sum, p) => sum + p.paymentAmount, 0);
  const totalOutstanding = matchedCredits.reduce((sum, c) => sum + c.remainingBalance, 0);

  return {
    credits: matchedCredits,
    payments: matchedPayments,
    summary: {
      totalCredits,
      totalPayments,
      totalOutstanding,
      totalSettledCredits,
      totalPartialCredits,
      totalUnpaidCredits,
    },
  };
}

export interface PaymentPreviewImpact {
  creditId: string;
  timestamp: number;
  description: string;
  originalAmount: number;
  currentBalance: number;
  amountCovered: number;
  remainingAfter: number;
  willBeFullySettled: boolean;
}

/**
 * Previews the impact of a prospective payment against current unpaid/partial debts.
 */
export function previewPaymentImpact(
  unpaidCredits: MatchedCredit[],
  paymentAmount: number,
  targetCreditId?: string
): {
  impacts: PaymentPreviewImpact[];
  unallocated: number;
  totalCovered: number;
} {
  let remainingPayment = Math.max(0, paymentAmount);
  const impacts: PaymentPreviewImpact[] = [];

  // Deep clone candidate credits so we don't mutate input
  const candidates = unpaidCredits
    .filter(c => c.remainingBalance > 0.0001)
    .map(c => ({ ...c }));

  // Prioritize target credit if specified
  if (targetCreditId) {
    const target = candidates.find(c => c.id === targetCreditId);
    if (target && remainingPayment > 0.0001) {
      const cover = Math.min(remainingPayment, target.remainingBalance);
      impacts.push({
        creditId: target.id,
        timestamp: target.timestamp,
        description: target.description,
        originalAmount: target.originalAmount,
        currentBalance: target.remainingBalance,
        amountCovered: cover,
        remainingAfter: Math.max(0, target.remainingBalance - cover),
        willBeFullySettled: target.remainingBalance - cover < 0.0001,
      });
      target.remainingBalance -= cover;
      remainingPayment -= cover;
    }
  }

  // FIFO for the rest
  for (const c of candidates) {
    if (c.id === targetCreditId) continue;
    if (remainingPayment <= 0.0001) break;

    const cover = Math.min(remainingPayment, c.remainingBalance);
    impacts.push({
      creditId: c.id,
      timestamp: c.timestamp,
      description: c.description,
      originalAmount: c.originalAmount,
      currentBalance: c.remainingBalance,
      amountCovered: cover,
      remainingAfter: Math.max(0, c.remainingBalance - cover),
      willBeFullySettled: c.remainingBalance - cover < 0.0001,
    });
    c.remainingBalance -= cover;
    remainingPayment -= cover;
  }

  const totalCovered = impacts.reduce((sum, imp) => sum + imp.amountCovered, 0);

  return {
    impacts,
    unallocated: remainingPayment,
    totalCovered,
  };
}
