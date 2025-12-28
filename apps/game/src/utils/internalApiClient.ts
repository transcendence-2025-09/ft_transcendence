import "dotenv/config";

interface MatchResultPayload {
  tournamentId: string;
  matchId: string;
  winnerId: number;
  score: {
    leftPlayer: number;
    rightPlayer: number;
  };
  ballSpeed?: number;
  ballRadius?: number;
  scoreLogs?: Array<{ left: number; right: number; elapsedSeconds: number }>;
}

interface MatchResultResponse {
  success: boolean;
  message: string;
}

export class InternalApiClient {
  private baseUrl: string;
  private apiSecret: string;

  constructor() {
    // this.baseUrl = "http://localhost:3000";
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to submit match result: ${response.status} ${JSON.stringify(errorData)}`,
        );
      }

      const data = await response.json();
      return data as MatchResultResponse;
    } catch (error) {
      console.error("Error submitting match result to backend:", error);
      throw error;
    }
  }
}

// シングルトンインスタンス
export const internalApiClient = new InternalApiClient();
