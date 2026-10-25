import { AiProviderError } from "@/lib/ai-provider";
import { jsonResponse } from "@/lib/api-utils";

export function aiProviderFailureResponse(error: unknown): Response {
  if (error instanceof AiProviderError) {
    if (error.code === "timeout") {
      return jsonResponse(
        {
          error:
            "The AI provider took too long to respond. Nothing was saved. Try again or use the rule-based result.",
          code: "timeout",
        },
        504,
      );
    }

    if (error.code === "rate_limited") {
      return jsonResponse(
        {
          error:
            "The AI provider is temporarily busy. Nothing was saved. Try again shortly or use the rule-based result.",
          code: "rate_limited",
        },
        429,
      );
    }

    if (error.code === "unauthorized") {
      return jsonResponse(
        {
          error:
            "The AI provider rejected its server-side configuration. Nothing was saved. Use the rule-based result or check the server setup.",
          code: "provider_unauthorized",
        },
        502,
      );
    }
  }

  return jsonResponse(
    {
      error:
        "The AI provider could not complete this request. Nothing was saved. Try again or use the rule-based result.",
      code: "provider_error",
    },
    502,
  );
}
