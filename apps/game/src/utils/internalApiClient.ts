import "dotenv/config";

// マッチ結果送信用のペイロード型定義
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

// マッチ結果送信のレスポンス型定義
interface MatchResultResponse {
  success: boolean;
  message: string;
}

//backend serverへの内部APIクライアント
export class InternalApiClient {
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
