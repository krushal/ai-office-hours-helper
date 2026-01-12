// ====== Global sanity check ======
console.log("app.js loaded");

// ====== Main function ======
async function generatePlan() {
  console.log("Generate Plan button clicked");

  const problemInput = document.getElementById("problemInput");
  const statusDiv = document.getElementById("status");
  const outputDiv = document.getElementById("output");
  const jsonOutput = document.getElementById("jsonOutput");

  console.log("DOM elements:", {
    problemInput,
    statusDiv,
    outputDiv,
    jsonOutput,
  });

  const problem = problemInput.value.trim();
  console.log("Problem text:", problem);

  if (!problem) {
    console.warn("No problem entered");
    statusDiv.textContent = "Please enter a workflow problem.";
    return;
  }

  statusDiv.textContent = "Calling backend...";
  outputDiv.innerHTML = "";
  jsonOutput.textContent = "";

  try {
    console.log("Sending POST request to Netlify function");

    const response = await fetch("/.netlify/functions/generate_plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ problem }),
    });

    console.log("Response received:", response);

    const rawText = await response.text();
    console.log("Raw response text:", rawText);

    if (!response.ok) {
      throw new Error(`API Error (${response.status}): ${rawText}`);
    }

    const data = JSON.parse(rawText);
    console.log("Parsed JSON:", data);

    // ===== Render readable output =====
    outputDiv.innerHTML = `
      <h3>Problem Statement</h3>
      <p>${data.problem_statement}</p>

      <h3>Clarifying Questions</h3>
      <ul>${data.clarifying_questions.map(q => `<li>${q}</li>`).join("")}</ul>

      <h3>Proposed Approach</h3>
      <ul>${data.proposed_approach.map(p => `<li>${p}</li>`).join("")}</ul>

      <h3>Recommended Tools</h3>
      <p>${data.recommended_tools.join(", ")}</p>

      <h3>Risks & Privacy</h3>
      <ul>${data.risks_and_privacy.map(r => `<li>${r}</li>`).join("")}</ul>

      <h3>Next Steps</h3>
      <ul>${data.next_steps.map(n => `<li>☐ ${n}</li>`).join("")}</ul>
    `;

    jsonOutput.textContent = JSON.stringify(data, null, 2);
    statusDiv.textContent = "Plan generated successfully.";
    console.log("Rendering complete");
  } catch (error) {
    console.error("Error in generatePlan():", error);
    statusDiv.textContent = `Error: ${error.message}`;
  }
}

// ====== Wire button click safely ======
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded");

  const btn = document.getElementById("generateBtn");
  if (!btn) {
    console.error("Generate button not found");
    return;
  }

  btn.addEventListener("click", generatePlan);
  console.log("Generate button wired");
});
