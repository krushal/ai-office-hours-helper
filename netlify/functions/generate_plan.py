import json
import os
from typing import List
from pydantic import BaseModel
from openai import OpenAI

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))


class Plan(BaseModel):
    problem_statement: str
    clarifying_questions: List[str]
    proposed_approach: List[str]
    recommended_tools: List[str]
    risks_and_privacy: List[str]
    next_steps: List[str]


def handler(event, context):
    if event.get("httpMethod") != "POST":
        return {
            "statusCode": 405,
            "body": json.dumps({"error": "Method not allowed. Use POST."})
        }

    try:
        body = json.loads(event.get("body") or "{}")
        problem = body.get("problem", "").strip()

        if not problem:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Problem statement is required"})
            }

        prompt = f"""
Convert the following workflow problem into a structured action plan.

Return ONLY valid JSON with this schema:
{{
  "problem_statement": "string",
  "clarifying_questions": ["string"],
  "proposed_approach": ["string"],
  "recommended_tools": ["string"],
  "risks_and_privacy": ["string"],
  "next_steps": ["string"]
}}

Workflow problem:
"{problem}"
"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4
        )

        raw = response.choices[0].message.content
        parsed = json.loads(raw)
        validated = Plan(**parsed)

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": validated.json()
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
