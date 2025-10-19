import { v7 as uuidv7 } from "uuid";
import type { GameOptions, Match, Player, Tournament } from "../types.js";

const REQUIRED_SEMIFINAL_MATCHES = 2;
const REQUIRED_FINAL_PLAYERS = 2;

export function createMatchManager(tournaments: Map<string, Tournament>) {
  /**
   * 特定のマッチを取得する
   */
  function getMatch(
    tournamentId: string,
    matchId: string,
  ): { tournament: Tournament; match: Match } | null {
    const tournament = tournaments.get(tournamentId);
    if (!tournament) return null;

    const match = tournament.matches.find((m) => m.id === matchId);
    if (!match) return null;

    return { tournament, match };
  }

  /**
   * セミファイナルマッチから勝者を判定する
   */
  function getWinner(semifinal: Match): Player | null {
    if (!semifinal.score) return null;

    return semifinal.score.leftPlayer > semifinal.score.rightPlayer
      ? semifinal.leftPlayer
      : semifinal.rightPlayer;
  }

  /**
   * セミファイナルマッチから敗者を判定する
   */
  function getLoser(semifinal: Match): Player | null {
    const winner = getWinner(semifinal);
    if (!winner) return null;

    return winner.userId === semifinal.leftPlayer.userId
      ? semifinal.rightPlayer
      : semifinal.leftPlayer;
  }

  /**
   * マッチを作成する
   */
  function createMatch(
    round: "semifinals" | "finals" | "third_place",
    leftPlayer: Player,
    rightPlayer: Player,
    gameOptions: GameOptions,
  ): Match {
    return {
      id: uuidv7(),
      round,
      leftPlayer,
      rightPlayer,
      status: "pending",
      gameOptions,
    };
  }

  /**
   * セミファイナルが全て完了しているかチェック
   */
  function areSemifinalsCompleted(matches: Match[]): boolean {
    const semifinalMatches = matches.filter((m) => m.round === "semifinals");

    return (
      semifinalMatches.length === REQUIRED_SEMIFINAL_MATCHES &&
      semifinalMatches.every((m) => m.status === "completed")
    );
  }

  /**
   * ファイナルマッチが既に存在するかチェック
   */
  function hasFinalMatches(matches: Match[]): boolean {
    return matches.some(
      (m) => m.round === "finals" || m.round === "third_place",
    );
  }

  /**
   * セミファイナルマッチから勝者と敗者を抽出
   */
  function extractWinnersAndLosers(matches: Match[]): {
    winners: Player[];
    losers: Player[];
  } {
    const semifinals = matches.filter((m) => m.round === "semifinals");
    const winners: Player[] = [];
    const losers: Player[] = [];

    for (const semifinal of semifinals) {
      const winner = getWinner(semifinal);
      const loser = getLoser(semifinal);

      if (winner) winners.push(winner);
      if (loser) losers.push(loser);
    }

    return { winners, losers };
  }

  /**
   * ファイナルマッチと3位決定戦を自動生成する
   */
  function generateFinalMatches(tournament: Tournament): void {
    if (!areSemifinalsCompleted(tournament.matches)) return;
    if (hasFinalMatches(tournament.matches)) return;

    const { winners, losers } = extractWinnersAndLosers(tournament.matches);

    // ファイナルマッチを生成
    if (winners.length === REQUIRED_FINAL_PLAYERS) {
      tournament.matches.push(
        createMatch("finals", winners[0], winners[1], tournament.gameOptions),
      );
    }

    // 3位決定戦を生成
    if (losers.length === REQUIRED_FINAL_PLAYERS) {
      tournament.matches.push(
        createMatch(
          "third_place",
          losers[0],
          losers[1],
          tournament.gameOptions,
        ),
      );
    }
  }

  return {
    /**
     * セミファイナルマッチを生成する
     * @param tournamentId トーナメントID
     * @returns 成功した場合true
     */
    generateMatches(tournamentId: string): boolean {
      const tournament = tournaments.get(tournamentId);
      if (!tournament) return false;
      if (tournament.players.length < 4) return false;

      // セミファイナル2試合を生成
      const match1 = createMatch(
        "semifinals",
        tournament.players[0],
        tournament.players[1],
        tournament.gameOptions,
      );

      const match2 = createMatch(
        "semifinals",
        tournament.players[2],
        tournament.players[3],
        tournament.gameOptions,
      );

      tournament.matches = [match1, match2];
      return true;
    },

    /**
     * マッチ一覧を取得
     * @param tournamentId トーナメントID
     * @returns マッチ配列（トーナメントが存在しない場合はundefined）
     */
    getMatches(tournamentId: string): Match[] | undefined {
      const tournament = tournaments.get(tournamentId);
      return tournament?.matches;
    },

    /**
     * マッチを開始する
     * @param tournamentId トーナメントID
     * @param matchId マッチID
     * @returns 成功した場合true
     */
    startMatch(tournamentId: string, matchId: string): boolean {
      const result = getMatch(tournamentId, matchId);
      if (!result) return false;

      const { match } = result;
      if (match.status !== "pending") return false;

      match.status = "in_progress";
      return true;
    },

    /**
     * 試合結果を登録する
     * @param tournamentId トーナメントID
     * @param matchId マッチID
     * @param winnerId 勝者のユーザーID
     * @param score スコア
     * @returns 更新されたマッチ（失敗した場合はundefined）
     */
    submitMatchResult(
      tournamentId: string,
      matchId: string,
      winnerId: number,
      score: { leftPlayer: number; rightPlayer: number },
    ): Match | undefined {
      const result = getMatch(tournamentId, matchId);
      if (!result) return undefined;

      const { tournament, match } = result;
      if (match.status !== "in_progress") return undefined;

      // 勝者がマッチの参加者であることを確認
      const isValidWinner =
        match.leftPlayer.userId === winnerId ||
        match.rightPlayer.userId === winnerId;
      if (!isValidWinner) return undefined;

      match.score = score;
      match.status = "completed";

      // セミファイナルの両方のマッチが完了したら、ファイナルと3位決定戦を自動生成
      generateFinalMatches(tournament);

      return match;
    },
  };
}
