interface EvalSummary {
  scenarios: number;
  passed: number;
  failed: number;
}

const summary: EvalSummary = {
  scenarios: 0,
  passed: 0,
  failed: 0,
};

console.log(JSON.stringify({
  status: "no_evals_configured",
  summary,
}, null, 2));
