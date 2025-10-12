import type { Match } from "./types";
import { escapeHtml } from "./utils";

/**
 * 完了した試合のカードHTMLを生成
 */
function createCompletedMatchCard(match: Match): string {
  const player1Name = escapeHtml(match.leftPlayer?.alias || "TBD");
  const player2Name = escapeHtml(match.rightPlayer?.alias || "TBD");
  const score1 = match.score?.leftPlayer || 0;
  const score2 = match.score?.rightPlayer || 0;
  const winnerName = score1 > score2 ? player1Name : player2Name;

  return `
    <div class="bg-white shadow-lg rounded-lg p-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4 flex-1">
          <span class="text-lg font-semibold">${player1Name}</span>
          <span class="text-gray-500">VS</span>
          <span class="text-lg font-semibold">${player2Name}</span>
        </div>
        <div class="flex items-center gap-4">
          <span class="font-mono text-xl font-bold">${score1} - ${score2}</span>
          <span class="bg-green-100 text-green-800 px-4 py-2 rounded font-semibold">
            勝者: ${winnerName}
          </span>
        </div>
      </div>
    </div>
  `;
}

/**
 * 未完了の試合のカードHTMLを生成
 */
function createPendingMatchCard(match: Match): string {
  const player1Name = escapeHtml(match.leftPlayer?.alias || "TBD");
  const player2Name = escapeHtml(match.rightPlayer?.alias || "TBD");
  const isStartable =
    match.status === "pending" && match.leftPlayer && match.rightPlayer;

  return `
    <div class="bg-white shadow-lg rounded-lg p-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4 flex-1">
          <span class="text-lg font-semibold">${player1Name}</span>
          <span class="text-gray-500">VS</span>
          <span class="text-lg font-semibold">${player2Name}</span>
        </div>
        <button
          id="startMatch-${match.id}"
          class="bg-black hover:bg-gray-800 text-white font-bold py-2 px-6 rounded ${!isStartable ? "opacity-50 cursor-not-allowed" : ""}"
          ${!isStartable ? "disabled" : ""}
        >
          試合開始
        </button>
      </div>
    </div>
  `;
}

/**
 * マッチカードのHTMLを生成
 */
export function createMatchCard(match: Match): string {
  const isCompleted = match.status === "completed";

  if (isCompleted && match.score) {
    return createCompletedMatchCard(match);
  }

  return createPendingMatchCard(match);
}

/**
 * 試合結果セクションのHTMLを生成
 */
export function createResultsSection(matches: Match[], title: string): string {
  const completedMatches = matches.filter((m) => m.status === "completed");
  if (completedMatches.length === 0) return "";

  let html = `
    <div class="mt-8">
      <h2 class="text-2xl font-bold mb-4">${title}</h2>
      <div class="bg-white shadow-lg rounded-lg p-6 space-y-3">
  `;

  completedMatches.forEach((match) => {
    const player1Name = escapeHtml(match.leftPlayer?.alias || "");
    const player2Name = escapeHtml(match.rightPlayer?.alias || "");
    const score1 = match.score?.leftPlayer || 0;
    const score2 = match.score?.rightPlayer || 0;
    const winnerName = score1 > score2 ? player1Name : player2Name;

    html += `
      <div class="flex items-center justify-between py-2 border-b">
        <div class="flex items-center gap-4">
          <span class="font-semibold">${player1Name}</span>
          <span class="text-gray-500">vs</span>
          <span class="font-semibold">${player2Name}</span>
        </div>
        <div class="flex items-center gap-4">
          <span class="font-mono text-lg">${score1} - ${score2}</span>
          <span class="text-green-600 font-semibold">勝者: ${winnerName}</span>
        </div>
      </div>
    `;
  });

  html += `
      </div>
    </div>
  `;

  return html;
}

/**
 * 最終結果（1位〜4位）のHTMLを生成
 */
export function createFinalRankings(
  rankings: Array<{
    rank: number;
    player: { alias: string; userId: number };
    score?: string;
  }>,
): string {
  const colors = [
    {
      bg: "bg-yellow-50",
      border: "border-yellow-400",
      icon: "text-yellow-500",
    },
    { bg: "bg-gray-50", border: "border-gray-400", icon: "text-gray-500" },
    {
      bg: "bg-orange-50",
      border: "border-orange-400",
      icon: "text-orange-500",
    },
    { bg: "bg-blue-50", border: "border-blue-400", icon: "text-blue-500" },
  ];

  let html = `
    <div class="bg-white shadow-lg rounded-lg p-8">
      <h2 class="text-3xl font-bold text-center mb-8">最終結果</h2>
      <div class="grid grid-cols-4 gap-4">
  `;

  rankings.forEach((ranking) => {
    const colorSet = colors[ranking.rank - 1] || {
      bg: "bg-gray-50",
      border: "border-gray-300",
      icon: "text-gray-500",
    };
    const playerName = escapeHtml(ranking.player.alias);
    const scoreText = ranking.score ? ` - ${ranking.score}` : "";

    html += `
      <div class="flex flex-col items-center p-6 border-2 rounded-lg ${colorSet.bg} ${colorSet.border}">
        <svg class="w-16 h-16 mb-4 ${colorSet.icon}" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
        </svg>
        <div class="text-center">
          <div class="text-2xl font-bold mb-2">${ranking.rank}位</div>
          <div class="text-gray-700 font-semibold">${playerName}</div>
          ${scoreText ? `<div class="text-sm text-gray-500 mt-1">${scoreText}</div>` : ""}
        </div>
      </div>
    `;
  });

  html += `
      </div>
    </div>
  `;

  return html;
}
