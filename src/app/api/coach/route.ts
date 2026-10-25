import {
  buildCoachMessages,
  COACH_MAX_QUESTION_LENGTH,
  generateRuleReply,
  getCoachFigures,
  parseCoachContext,
  parseCoachHistory,
  validateCoachQuestion,
} from "@/lib/coach";
import { connection } from "next/server";
import {
  createChatCompletion,
  getAiProviderConfig,
  isAiProviderConfigured,
  normalizeProviderAnswer,
} from "@/lib/ai-provider";
import { aiProviderFailureResponse } from "@/lib/ai-route";
import { jsonResponse, readJsonBody } from "@/lib/api-utils";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET() {
  await connection();
  return jsonResponse({ configured: isAiProviderConfigured() });
}

export async function POST(request: Request) {
  const body = await readJsonBody(request);

  if (!body.ok) {
    return jsonResponse(
      {
        error:
          body.reason === "too_large"
            ? "That request is too large."
            : "Send a valid JSON request.",
        code: "invalid_request",
      },
      400,
    );
  }

  if (!isRecord(body.value)) {
    return jsonResponse(
      { error: "Send a valid JSON request.", code: "invalid_request" },
      400,
    );
  }

  const question = validateCoachQuestion(body.value.question);

  if (!question) {
    return jsonResponse(
      {
        error: `Enter a question between 1 and ${COACH_MAX_QUESTION_LENGTH} characters.`,
        code: "invalid_question",
      },
      400,
    );
  }

  const context = parseCoachContext(body.value.context);

  if (!context) {
    return jsonResponse(
      {
        error: "The financial summary could not be read. Refresh the page and try again.",
        code: "invalid_context",
      },
      400,
    );
  }

  const history = parseCoachHistory(body.value.history);

  if (!history) {
    return jsonResponse(
      {
        error: "The conversation history is too long or invalid. Clear the chat and try again.",
        code: "invalid_history",
      },
      400,
    );
  }

  const provider = getAiProviderConfig();

  if (!provider) {
    return jsonResponse(generateRuleReply(question, context));
  }

  try {
    const answer = await createChatCompletion(provider, {
      messages: buildCoachMessages(question, context, history),
      maxTokens: 700,
      temperature: 0.3,
    });

    return jsonResponse({
      source: "ai",
      title: "AI-assisted guidance",
      body: normalizeProviderAnswer(answer),
      figures: getCoachFigures(context),
      contextUsed: true,
    });
  } catch (error) {
    return aiProviderFailureResponse(error);
  }
}
