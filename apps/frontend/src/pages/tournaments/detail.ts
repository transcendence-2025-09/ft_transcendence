import { componentFactory } from "../../factory/componentFactory";
import { pageFactory } from "../../factory/pageFactory";
import type { RouteCtx } from "../../routing/routeList";
import {
  startTournament as apiStartTournament,
  cancelJoinTournament,
  fetchTournament,
  getCurrentUser,
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
      const [tournament, currentUser] = await Promise.all([
        fetchTournament(tournamentId),
        getCurrentUser(),
      ]);

      // トーナメントが既に開始されている場合、マッチ画面に即座に遷移
      if (tournament.status === "in_progress") {
        navigateTo(`/tournaments/${tournamentId}/matches`);
        return;
      }

      // トーナメントが完了している場合、結果タブに遷移
      if (tournament.status === "completed") {
        navigateTo(`/tournaments/${tournamentId}/matches?tab=results`);
        return;
      }

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

          <h3 class="text-lg font-semibold mt-6 mb-3">ゲームオプション</h3>
          <dl class="space-y-2">
            <div class="flex">
              <dt class="font-semibold w-32">ボールの速度:</dt>
              <dd>${tournament.gameOptions?.ballSpeed === 3 ? "ゆっくり" : tournament.gameOptions?.ballSpeed === 6 ? "普通" : tournament.gameOptions?.ballSpeed === 15 ? "速い" : (tournament.gameOptions?.ballSpeed ?? "未設定")}</dd>
            </div>
            <div class="flex">
              <dt class="font-semibold w-32">ボールの大きさ:</dt>
              <dd>${tournament.gameOptions?.ballRadius === 3 ? "小さい" : tournament.gameOptions?.ballRadius === 12 ? "普通" : tournament.gameOptions?.ballRadius === 48 ? "大きい" : (tournament.gameOptions?.ballRadius ?? "未設定")}</dd>
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

        <div class="space-x-4" id="actionButtons">
        </div>
      `;

      // ユーザーの状態に応じて処理を分岐
      const isHost = currentUser.id === tournament.hostId;
      const isParticipant =
        tournament.players?.some((p) => p.userId === currentUser.id) ?? false;

      if (isHost && !isParticipant) {
        try {
          // ホストが未参加の場合、自動的に参加させる
          await joinTournament(tournamentId, currentUser.name);
          loadTournamentDetail(); // トーナメント詳細を再読み込み
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC;
          alert(`自動参加に失敗しました: ${errorMessage}`);
          console.error("自動参加エラー: ", error);
        }
      }

      // actionButtonsContainer を再定義
      const actionButtonsContainer =
        detailContainer.querySelector("#actionButtons");

      if (actionButtonsContainer) {
        if (isHost) {
          // ホストの場合: キャンセルボタン非表示、開始ボタン表示
          const canStart =
            (tournament.players?.length ?? 0) >= tournament.maxPlayers;
          actionButtonsContainer.innerHTML = `
            <button id="startBtn" class="${canStart ? "bg-blue-500 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"} text-white font-bold py-2 px-6 rounded" ${canStart ? "" : "disabled"}>
              開始する ${canStart ? "" : `(${tournament.players?.length ?? 0}/${tournament.maxPlayers}人)`}
            </button>
          `;

          // 開始ボタンのイベントリスナーを設定
          const startBtn = detailContainer.querySelector("#startBtn");
          if (startBtn) {
            startBtn.addEventListener("click", () => handleStart());
          }
        } else {
          // ゲストの場合: 参加ボタン表示、キャンセルボタン表示、開始ボタン非表示
          if (isParticipant) {
            actionButtonsContainer.innerHTML = `
              <button id="cancelJoinBtn" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-6 rounded">
                参加をキャンセルする
              </button>
            `;

            // キャンセルボタンのイベントリスナーを設定
            const cancelJoinBtn =
              detailContainer.querySelector("#cancelJoinBtn");
            if (cancelJoinBtn) {
              cancelJoinBtn.addEventListener("click", async () => {
                alert("参加キャンセル処理を実行します");
                try {
                  await cancelJoinTournament(tournamentId);
                  loadTournamentDetail(); // トーナメント詳細を再読み込み
                } catch (error) {
                  const errorMessage =
                    error instanceof Error
                      ? error.message
                      : ERROR_MESSAGES.GENERIC;
                  alert(`キャンセルに失敗しました: ${errorMessage}`);
                  console.error("キャンセルエラー: ", error);
                }
              });
            }
          } else {
            actionButtonsContainer.innerHTML = `
              <button id="joinBtn" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-6 rounded">
                参加する
              </button>
            `;

            // 参加ボタンのイベントリスナーを設定
            const joinBtn = detailContainer.querySelector("#joinBtn");
            if (joinBtn) {
              joinBtn.addEventListener("click", () => handleJoin());
            }
          }
        }
      }
    } catch (error) {
      showError(detailContainer);
      console.error("Failed to load tournament detail:", error);
    }
  }

  // トーナメントに参加
  async function handleJoin() {
    try {
      const currentUser = await getCurrentUser();
      const alias = currentUser.name; // 現在のユーザー名を取得

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
    try {
      await apiStartTournament(tournamentId);
      navigateTo(`/tournaments/${tournamentId}/matches`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC;
      alert(`開始に失敗しました: ${errorMessage}`);
    }
  }

  // ポーリング: トーナメントの状態を定期的にチェック
  let pollingInterval: number | null = null;

  async function checkTournamentStatus() {
    try {
      const tournament = await fetchTournament(tournamentId);
      // トーナメントが開始されたら、マッチ画面に遷移
      if (tournament.status === "in_progress") {
        navigateTo(`/tournaments/${tournamentId}/matches`);
        return;
      }
      // トーナメントが完了したら、結果タブに遷移
      if (tournament.status === "completed") {
        navigateTo(`/tournaments/${tournamentId}/matches?tab=results`);
        return;
      }
    } catch (error) {
      console.error("Failed to check tournament status:", error);
    }
  }

  // 5秒ごとにトーナメントの状態をチェック
  pollingInterval = window.setInterval(checkTournamentStatus, 5000);

  loadTournamentDetail();

  const component = componentFactory(el);

  // オリジナルのunmountを拡張してポーリングをクリーンアップ
  const originalUnmount = component.unmount;
  component.unmount = () => {
    if (pollingInterval !== null) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
    originalUnmount();
  };

  return pageFactory([component]);
}
