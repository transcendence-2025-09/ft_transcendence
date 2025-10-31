import "dotenv/config";

interface MatchResultPayload {
  tournamentId: string;
  matchId: string;
  winnerId: number;
  score: {
    leftPlayer: number;
    rightPlayer: number;
  };
}

interface MatchResultResponse {
  success: boolean;
  message: string;
}

export class InternalApiClient {
  private baseUrl: string;
  private apiSecret: string;

  constructor() {
    this.baseUrl = "http://localhost:3000";
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
    const { tournamentId, matchId, winnerId, score } = payload;
    const url = `${this.baseUrl}/internal/tournaments/${tournamentId}/matches/${matchId}/result`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiSecret}`,
        },
        body: JSON.stringify({ winnerId, score }),
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
