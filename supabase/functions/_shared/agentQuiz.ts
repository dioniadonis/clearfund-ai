export const AGENT_QUIZ_ANSWERS = {
  promise_approval: "no",
  quote_rates: "no",
  move_client: "no",
  cost_question: "specialist",
  add_without_asking: "no",
} as const;

export type AgentQuizAnswers = Record<keyof typeof AGENT_QUIZ_ANSWERS, string>;

export function evaluateAgentQuiz(answers: Partial<AgentQuizAnswers>) {
  const score = (Object.keys(AGENT_QUIZ_ANSWERS) as (keyof typeof AGENT_QUIZ_ANSWERS)[])
    .reduce((total, key) => total + (answers[key] === AGENT_QUIZ_ANSWERS[key] ? 1 : 0), 0);
  return { score, passed: score >= 4 };
}
