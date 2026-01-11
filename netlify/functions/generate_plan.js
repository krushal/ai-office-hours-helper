import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Simple runtime schema validation
function validatePlan(plan) {
  if (!plan.problem_statement) throw new Error("Missing problem_statement");

  if (
    !Array.isArray(plan.clarifying_questions) ||
    plan.clarifying_questions.length < 3 ||
    plan.clarifying_questions.length > 5
  ) {
    throw new Error("clarifying_questions must be 3–5 items");
  }

  if (
    !Array.isArray(plan.proposed_approach) ||
    plan.proposed_approach.length < 4 ||
    plan.proposed_approach.length > 7
  ) {
    throw new Error("proposed_approach must be 4–7 items");
  }

  if (!Array.isArray(plan.recommended_tools)) {
    throw new Error("recommended_tools must be an array");
  }

  if (
    !Array.isArray(plan.risks_and_privacy) ||
    plan.risks_and_privacy.length < 1
  ) {
    throw new Error("risks_and_privacy must have at least 1 item");
  }

  if (!Array.isArray(plan.next_steps)) {
    throw new Error("next_steps must be an array");
  }

  return plan;
}

export async function handler(event) {
  try {
    const body = JSON.parse(event.body || "{}");
    const problem = body.problem?.trim();

    if (!problem) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Problem statement is required" })
      };
    }

    const prompt = `
You are an assistant that converts workflow pain points into structured action plans.

Return ONLY valid JSON with this schema:
{
  "problem_statement": "string",
  "clarifying_questions": ["string"],
  "proposed_approach": ["string"],
  "recommended_tools": ["string"],
  "risks_and_privacy": ["string"],
  "next_steps": ["string"]
}

Rules:
- clarifying_questions: 3–5 items
- proposed_approach: 4–7 items
- risks_and_privacy: at least 1 item
- next_steps must start with actionable verbs (Define, Review, Prototype, etc.)

Workflow problem:
"${problem}"
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4
    });

    const rawText = completion.choices[0].message.content;
    const parsed = JSON.parse(rawText);

    const validated = validatePlan(parsed);

    return {
      statusCode: 200,
      body: JSON.stringify(validated)
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to generate plan",
        details: error.message
      })
    };
  }
}
