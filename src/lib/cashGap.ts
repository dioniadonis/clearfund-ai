export interface CashGapInputs {
  contractAmount: number;
  contractMonths: number;
  startDate: string; // yyyy-mm-dd
  firstPaymentDate: string;
  upFrontPercent: number;
  marginPercent: number;
  cashOnHand: number;
}

const DAY = 86_400_000;
const parse = (d: string) => {
  const [y, m, day] = d.split("-").map(Number);
  return Date.UTC(y, (m || 1) - 1, day || 1);
};

export function computeCashGap(i: CashGapInputs) {
  const months = Math.max(1, i.contractMonths || 1);
  const days =
    i.startDate && i.firstPaymentDate
      ? Math.max(0, Math.round((parse(i.firstPaymentDate) - parse(i.startDate)) / DAY))
      : 0;
  const amount = Math.max(0, i.contractAmount || 0);
  const jobCost = amount * (1 - (i.marginPercent || 0) / 100);
  const upFront = amount * (i.upFrontPercent || 0) / 100;
  const monthlyBurn = Math.max(0, jobCost - upFront) / months;
  const runningCosts = monthlyBurn * (days / 30.4);
  const cashGap = Math.max(0, upFront + runningCosts - Math.max(0, i.cashOnHand || 0));
  return { days, jobCost, upFront, monthlyBurn, runningCosts, cashGap };
}
