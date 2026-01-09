import "dotenv/config";
import {
  type MatchResultPayload,
  type MatchResultResponse,
  MatchResultResponseSchema,
} from "@transcendence/shared";

//backend serverへの内部APIクライアント
class InternalApiClient {
  private baseUrl: string;
  private apiSecret: string;

  constructor() {
    this.baseUrl =
      process.env.NODE_ENV === "production"
        ? "http://backend:3000"
        : "http://localhost:3000";
    this.apiSecret = process.env.INTERNAL_API_SECRET || "";

    if (!this.apiSecret) {
      console.warn(
        "INTERNAL_API_SECRET is not set. Internal API calls will fail.",
      );
    }
  }

  // マッチ結果をbackend serverに送信するメソッド
  async submitMatchResult(
    payload: MatchResultPayload,
  ): Promise<MatchResultResponse> {
    const {
      tournamentId,
      matchId,
      winnerId,
      score,
      ballSpeed,
      ballRadius,
      scoreLogs,
    } = payload;
    const url = `${this.baseUrl}/internal/tournaments/${tournamentId}/matches/${matchId}/result`;

    try {
      const body: Record<string, unknown> = { winnerId, score };
      if (ballSpeed !== undefined) body.ballSpeed = ballSpeed;
      if (ballRadius !== undefined) body.ballRadius = ballRadius;
      if (scoreLogs !== undefined) body.scoreLogs = scoreLogs;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiSecret}`,
        },
        body: JSON.stringify(body),
      });
      const responseData = await response.json();
      const parseResult = MatchResultResponseSchema.safeParse(responseData);
      if (!parseResult.success) {
        throw new Error("Invalid response format from backend");
      }

      return parseResult.data;
    } catch (error) {
      console.error("Error submitting match result to backend:", error);
      throw error;
    }
  }
}

// シングルトンインスタンス
export const internalApiClient = new InternalApiClient();
