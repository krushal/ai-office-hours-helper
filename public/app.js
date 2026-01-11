console.log("app.js loaded");

const input = document.getElementById("problemInput");
const button = document.getElementById("generateBtn");
const statusDiv = document.getElementById("status");
const outputDiv = document.getElementById("output");
const jsonOutput = document.getElementById("jsonOutput");

button.addEventListener("click", async () => {
  console.log("Generate button clicked");

  statusDiv.textContent = "";
  outputDiv.innerHTML = "";
  jsonOutput.textContent = "";

  if (!input.value.trim()) {
    statusDiv.textContent = "Please enter a workflow problem.";
    return;
  }

  statusDiv.textContent = "Generating plan...";

  try {
    const response = await fetch("/.netlify/functions/generate_plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ problem: input.value })
    });

    console.log("Response status:", response.status);

    const data = await response.json();
    console.log("Response data:", data);

    if (!response.ok) {
      throw new Error(data.error || "API error");
    }

    statusDiv.textContent = "";
    renderPlan(data);
    jsonOutput.textContent = JSON.stringify(data, null, 2);

  } catch (err) {
    statusDiv.textContent = err.message;
    console.error(err);
  }
});

function renderPlan(plan) {
  outputDiv.innerHTML = `
    <h2>Problem Statement</h2>
    <p>${plan.problem_statement}</p>

    <h2>Clarifying Questions</h2>
    <ul>${plan.clarifying_questions.map(q => `<li>${q}</li>`).join("")}</ul>

    <h2>Proposed Approach</h2>
    <ul>${plan.proposed_approach.map(p => `<li>${p}</li>`).join("")}</ul>

    <h2>Recommended Tools</h2>
    <p>${plan.recommended_tools.join(", ")}</p>

    <h2>Risks & Privacy</h2>
    <ul>${plan.risks_and_privacy.map(r => `<li>${r}</li>`).join("")}</ul>

    <h2>Next Steps</h2>
    <ul>${plan.next_steps.map(s => `<li>☐ ${s}</li>`).join("")}</ul>
  `;
}
