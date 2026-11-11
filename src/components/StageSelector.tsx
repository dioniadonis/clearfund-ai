import React from "react";
import { Check } from "lucide-react";

export type StageKey = "bidding" | "won" | "working" | "invoiced";
export const STAGES: { key: StageKey; title: string; pain: string }[] = [
  { key: "bidding", title: "Bidding now", pain: "Line up funding before you win so you can say yes fast." },
  { key: "won", title: "Just won, haven't started", pain: "Bonding, materials and equipment are due before the job starts." },
  { key: "working", title: "Working, waiting on the first payment", pain: "Payroll and suppliers are due, the agency pays in 30 to 90 days." },
  { key: "invoiced", title: "Invoiced the agency, waiting to get paid", pain: "The work is done and approved, but the check is weeks away." },
];

const StageSelector: React.FC<{ stage: StageKey | null; onChoose: (k: StageKey) => void }> = ({ stage, onChoose }) => {
  const choose = onChoose;
  return (
            <div className="grid md:grid-cols-2 gap-6" role="radiogroup" aria-label="Contract stage">
              {STAGES.map((s, i) => {
                const active = s.key === stage;
                return (
                  <button
                    key={s.key}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => choose(s.key)}
                    className={`text-left rounded-xl border-2 p-6 md:p-8 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-clearfund-blue ${
                      active ? "border-clearfund-blue bg-clearfund-pale-blue" : "border-gray-200 bg-white hover:border-clearfund-blue"
                    }`}
                  >
                    <span className="flex items-center gap-3 mb-3">
                      <span className={`h-9 w-9 rounded-full flex items-center justify-center font-bold ${active ? "bg-clearfund-blue text-white" : "bg-clearfund-pale-blue text-clearfund-blue"}`}>
                        {active ? <Check size={18} /> : i + 1}
                      </span>
                      <span className="text-xl font-bold text-clearfund-dark-blue">{s.title}</span>
                    </span>
                    <span className="block text-gray-700">{s.pain}</span>
                  </button>
                );
              })}
            </div>
  );
};

export default StageSelector;
