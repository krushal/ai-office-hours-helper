import json
import os
from typing import List
from pydantic import BaseModel
from openai import OpenAI

# Netlify injects env vars at runtime
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))


class Plan(BaseModel):
    problem_statement: str
    clarifying_questions: List[str]
    proposed_approach: List[str]
    recommended_tools: List[str]
    risks_and_privacy: List[str]
    next_steps: List[str]


def handler(event, context):
    print("🐍 Python function invoked")

    try:
        if event.get("httpMethod") != "POST":
            return {
                "statusCode": 405,
                "body": json.dumps({"error": "Method not allowed"})
            }

        body = json.loads(event.get("body") or "{}")
        problem = body.get("problem", "").strip()

        if not problem:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Problem statement is required"})
            }

        prompt = f"""
Return ONLY valid JSON with this schema:
{{
  "problem_statement": "string",
  "clarifying_questions": ["string"],
  "proposed_approach": ["string"],
  "recommended_tools": ["string"],
  "risks_and_privacy": ["string"],
  "next_steps": ["string"]
}}

Rules:
- clarifying_questions: 3–5 items
- proposed_approach: 4–7 items
- risks_and_privacy: at least 1 item
- next_steps must start with actionable verbs

Workflow problem:
"{problem}"
"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )

        raw = response.choices[0].message.content.strip()

        # 🔐 Harden JSON parsing
        raw = raw[raw.find("{"): raw.rfind("}") + 1]
        parsed = json.loads(raw)

        validated = Plan(**parsed)

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": validated.json()
        }

    except Exception as e:
        print("❌ ERROR:", str(e))
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
