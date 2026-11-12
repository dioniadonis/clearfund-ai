export const AGENT_AGREEMENT_VERSION = "agent-agreement-v1";
export const AGENT_AGREEMENT = "I will not take ClearFund AI clients or leads to another funder or broker. I will not copy or export lead data. I will not quote rates, promise approval or funding, promise timing, or name funding providers. I will keep lead information confidential and use it only for ClearFund AI follow-up.";

export const AGENT_TRAINING = [
  { key: "program", title: "How the program works", body: "Introduce business owners to ClearFund AI using your referral link. ClearFund reviews each inquiry and manages the funding conversation." },
  { key: "who", title: "Who we help", body: "Speak with owners who want to explore business funding. ClearFund AI is a broker, not a lender, and providers make their own decisions." },
  { key: "conversations", title: "How to talk to business owners", body: "Ask permission, listen to the business need, and offer the ClearFund questionnaire. Never add anyone to a list without consent." },
  { key: "rules", title: "What you can never say", body: "Never quote rates or pricing, promise approval or funding, promise timing, or name funding providers. Direct cost questions to a ClearFund funding specialist." },
  { key: "payouts", title: "How leads and payouts work", body: "Only assigned warm leads appear in your queue. When an assigned deal is marked funded, ClearFund records its commission and calculates your share using the applicable percentage. Compensation is not guaranteed." },
] as const;

export const AGENT_QUIZ = [
  { key: "promise_approval", question: "Can you promise a client approval?", options: [["yes", "Yes"], ["no", "No"]] },
  { key: "quote_rates", question: "Can you quote rates?", options: [["yes", "Yes"], ["no", "No"]] },
  { key: "move_client", question: "Can you take a client we gave you to another funder?", options: [["yes", "Yes"], ["no", "No"]] },
  { key: "cost_question", question: "What do you do if a client asks about cost?", options: [["guess", "Give an estimate"], ["specialist", "Say a funding specialist will explain the offer"], ["avoid", "Tell them cost does not matter"]] },
  { key: "add_without_asking", question: "Can you add someone to a list without asking?", options: [["yes", "Yes"], ["no", "No"]] },
] as const;

export const REFERRAL_COOKIE = "cf_agent_ref";
export const REFERRAL_STORAGE = "cf_agent_referral";
const CODE = /^CF[A-Z0-9]{8}$/;

export function saveAgentReferral(code: string, now = Date.now()) {
  const normalized = code.trim().toUpperCase();
  if (!CODE.test(normalized)) return false;
  const expires = now + 30 * 86400000;
  localStorage.setItem(REFERRAL_STORAGE, JSON.stringify({ code: normalized, expires }));
  document.cookie = `${REFERRAL_COOKIE}=${normalized}; Max-Age=2592000; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  return true;
}

export function getAgentReferral(now = Date.now()): string | null {
  try {
    const saved = JSON.parse(localStorage.getItem(REFERRAL_STORAGE) || "null") as { code?: string; expires?: number } | null;
    if (saved?.code && CODE.test(saved.code) && Number(saved.expires) > now) return saved.code;
  } catch { /* fall through to the cookie */ }
  const cookie = document.cookie.split("; ").find((value) => value.startsWith(`${REFERRAL_COOKIE}=`))?.split("=")[1]?.toUpperCase() ?? null;
  if (cookie && CODE.test(cookie)) return cookie;
  localStorage.removeItem(REFERRAL_STORAGE);
  return null;
}
