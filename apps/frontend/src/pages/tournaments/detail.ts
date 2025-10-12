import { componentFactory } from "../../factory/componentFactory";
import { pageFactory } from "../../factory/pageFactory";
import type { RouteCtx } from "../../routing/routeList";
import {
  startTournament as apiStartTournament,
  fetchTournament,
  joinTournament,
} from "./api";
import { ERROR_MESSAGES } from "./constants";
import type { Player } from "./types";
import {
  escapeHtml,
  formatDate,
  getStatusLabel,
  navigateTo,
  showError,
  showLoading,
} from "./utils";

export function TournamentDetail(ctx: RouteCtx) {
  const tournamentId = ctx.params.id;

  const el = document.createElement("div");
  el.className = "container mx-auto p-8";

  el.innerHTML = `
    <div class="max-w-4xl mx-auto">
      <div id="tournamentDetail">
        <p class="text-gray-500">${ERROR_MESSAGES.LOADING}</p>
      </div>
    </div>
  `;

  const detailContainer = el.querySelector(
    "#tournamentDetail",
  ) as HTMLDivElement;

  // トーナメント詳細を読み込む
  async function loadTournamentDetail() {
    try {
      showLoading(detailContainer);
      const tournament = await fetchTournament(tournamentId);

      detailContainer.innerHTML = `
        <div class="mb-6">
          <a href="/tournaments" class="text-blue-500 hover:underline">&larr; 一覧に戻る</a>
        </div>

        <h1 class="text-3xl font-bold mb-6">${escapeHtml(tournament.name)}</h1>

        <div class="bg-white shadow rounded-lg p-6 mb-6">
          <h2 class="text-xl font-semibold mb-4">トーナメント情報</h2>
          <dl class="space-y-2">
            <div class="flex">
              <dt class="font-semibold w-32">ステータス:</dt>
              <dd>${escapeHtml(getStatusLabel(tournament.status))}</dd>
            </div>
            <div class="flex">
              <dt class="font-semibold w-32">最大人数:</dt>
              <dd>${tournament.maxPlayers}人</dd>
            </div>
            <div class="flex">
              <dt class="font-semibold w-32">現在の参加者:</dt>
              <dd>${tournament.players?.length ?? 0}人</dd>
            </div>
            <div class="flex">
              <dt class="font-semibold w-32">作成日時:</dt>
              <dd>${formatDate(tournament.createdAt)}</dd>
            </div>
          </dl>
        </div>

        <div class="bg-white shadow rounded-lg p-6 mb-6">
          <h2 class="text-xl font-semibold mb-4">参加者一覧</h2>
          ${
            !tournament.players || tournament.players.length === 0
              ? `<p class="text-gray-500">${ERROR_MESSAGES.NO_PLAYERS}</p>`
              : `
              <ul class="space-y-2">
                ${tournament.players
                  .map(
                    (p: Player) => `
                  <li class="flex items-center justify-between p-2 border rounded">
                    <span>${escapeHtml(p.alias)}</span>
                    ${p.userId === tournament.hostId ? '<span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">ホスト</span>' : ""}
                  </li>
                `,
                  )
                  .join("")}
              </ul>
            `
          }
        </div>

        <div class="space-x-4">
          <button id="joinBtn" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-6 rounded">
            参加する
          </button>
          <button id="startBtn" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded">
            開始する
          </button>
        </div>
      `;

      // 参加ボタンのイベントリスナーを設定
      const joinBtn = detailContainer.querySelector("#joinBtn");
      if (joinBtn) {
        joinBtn.addEventListener("click", () => handleJoin());
      }

      // 開始ボタンのイベントリスナーを設定
      const startBtn = detailContainer.querySelector("#startBtn");
      if (startBtn) {
        startBtn.addEventListener("click", () => handleStart());
      }
    } catch (error) {
      showError(detailContainer);
      console.error("Failed to load tournament detail:", error);
    }
  }

  // トーナメントに参加
  async function handleJoin() {
    const alias = prompt("プレイヤー名を入力してください:");
    if (!alias) return;

    try {
      await joinTournament(tournamentId, alias);
      loadTournamentDetail();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC;
      alert(`参加に失敗しました: ${errorMessage}`);
    }
  }

  // トーナメントを開始
  async function handleStart() {
    if (!confirm("トーナメントを開始しますか？")) return;

    try {
      await apiStartTournament(tournamentId);
      navigateTo(`/tournaments/${tournamentId}/matches`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC;
      alert(`開始に失敗しました: ${errorMessage}`);
    }
  }

  loadTournamentDetail();

  const component = componentFactory(el);
  return pageFactory([component]);
}
