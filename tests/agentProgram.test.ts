import { describe, expect, it } from "bun:test";
import { AGENT_QUIZ_ANSWERS, evaluateAgentQuiz } from "../supabase/functions/_shared/agentQuiz";

describe("agent compliance quiz", () => {
  it("passes all five correct answers", () => {
    expect(evaluateAgentQuiz(AGENT_QUIZ_ANSWERS)).toEqual({ score: 5, passed: true });
  });
  it("passes four correct answers", () => {
    expect(evaluateAgentQuiz({ ...AGENT_QUIZ_ANSWERS, quote_rates: "yes" })).toEqual({ score: 4, passed: true });
  });
  it("rejects three correct answers", () => {
    expect(evaluateAgentQuiz({ ...AGENT_QUIZ_ANSWERS, quote_rates: "yes", move_client: "yes" })).toEqual({ score: 3, passed: false });
  });
  it("requires the specialist response for cost questions", () => {
    expect(evaluateAgentQuiz({ ...AGENT_QUIZ_ANSWERS, cost_question: "guess" }).score).toBe(4);
  });
});
