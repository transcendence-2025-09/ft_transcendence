import { MeResponseSchema } from "@transcendence/shared";
import { componentFactory, pageFactory } from "@/factory";
import type { RouteCtx } from "@/routing";
import { fetchAndParse } from "@/utils";
import {
  startTournament as apiStartTournament,
  cancelJoinTournament,
  fetchTournament,
  joinTournament,
} from "./api";
import {
  BALL_RADIUS_LABELS,
  BALL_SPEED_LABELS,
  ERROR_MESSAGES,
} from "./constants";
import type { Player, Tournament } from "./types";
import { escapeHtml, navigateTo, showError, showLoading } from "./utils";

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

  // DOM要素の取得
  const detailContainer = el.querySelector(
    "#tournamentDetail",
  ) as HTMLDivElement;

  // ===================
  // 参加者一覧
  // ===================

  /** 参加者一覧のHTMLを生成 */
  function renderPlayersList(players: Player[], hostId: number): string {
    if (!players || players.length === 0) {
      return `<p class="text-gray-500">${ERROR_MESSAGES.NO_PLAYERS}</p>`;
    }
    return `
      <ul class="space-y-2">
        ${players
          .map(
            (p: Player) => `
          <li class="flex items-center justify-between p-2 border rounded">
            <span>${escapeHtml(p.alias)}</span>
            ${p.userId === hostId ? '<span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">ホスト</span>' : ""}
          </li>
        `,
          )
          .join("")}
      </ul>
    `;
  }

  /** 参加者一覧を更新 */
  function updatePlayersList(players: Player[], hostId: number): void {
    const playersListContainer = detailContainer.querySelector("#playersList");
    if (playersListContainer) {
      playersListContainer.innerHTML = renderPlayersList(players, hostId);
    }
  }

  // ===================
  // ゲームオプション表示
  // ===================

  /** ボール速度のラベルを取得 */
  function getBallSpeedLabel(speed: number | undefined): string {
    if (speed === undefined) return "未設定";
    return BALL_SPEED_LABELS[speed] ?? speed.toString();
  }

  /** ボールサイズのラベルを取得 */
  function getBallRadiusLabel(radius: number | undefined): string {
    if (radius === undefined) return "未設定";
    return BALL_RADIUS_LABELS[radius] ?? radius.toString();
  }

  // ===================
  // トーナメント操作
  // ===================

  /** トーナメントに参加 */
  async function handleJoin(): Promise<void> {
    try {
      const me = await fetchAndParse("/api/user/me", MeResponseSchema, {
        method: "GET",
        credentials: "include",
      });
      await joinTournament(tournamentId, me.name);
      loadTournamentDetail();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC;
      alert(`参加に失敗しました: ${errorMessage}`);
    }
  }

  /** トーナメント参加をキャンセル */
  async function handleCancelJoin(): Promise<void> {
    try {
      await cancelJoinTournament(tournamentId);
      loadTournamentDetail();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC;
      alert(`キャンセルに失敗しました: ${errorMessage}`);
      console.error("キャンセルエラー:", error);
    }
  }

  /** トーナメントを開始 */
  async function handleStart(): Promise<void> {
    try {
      await apiStartTournament(tournamentId);
      navigateTo(`/tournaments/${tournamentId}/matches`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC;
      alert(`開始に失敗しました: ${errorMessage}`);
    }
  }

  // ===================
  // UI描画
  // ===================

  /** 開始ボタンの状態を更新 */
  function updateStartButton(currentPlayers: number, maxPlayers: number): void {
    const startBtn = detailContainer.querySelector(
      "#startBtn",
    ) as HTMLButtonElement | null;
    if (!startBtn) return;

    const canStart = currentPlayers >= maxPlayers;
    startBtn.disabled = !canStart;
    startBtn.className = `${canStart ? "bg-blue-500 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"} text-white font-bold py-2 px-6 rounded`;
    startBtn.textContent = canStart
      ? "開始する"
      : `開始する (${currentPlayers}/${maxPlayers}人)`;
  }

  /** 開始、参加、キャンセルボタンを描画 */
  function renderActionButtons(
    isHost: boolean,
    isParticipant: boolean,
    tournament: Tournament,
  ): void {
    const actionButtonsContainer =
      detailContainer.querySelector("#actionButtons");
    if (!actionButtonsContainer) return;

    if (isHost) {
      const canStart =
        (tournament.players?.length ?? 0) >= tournament.maxPlayers;
      actionButtonsContainer.innerHTML = `
        <button id="startBtn" class="${canStart ? "bg-blue-500 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"} text-white font-bold py-2 px-6 rounded" ${canStart ? "" : "disabled"}>
          開始する ${canStart ? "" : `(${tournament.players?.length ?? 0}/${tournament.maxPlayers}人)`}
        </button>
      `;
      const startBtn = detailContainer.querySelector("#startBtn");
      if (startBtn) {
        startBtn.addEventListener("click", handleStart);
      }
    } else if (isParticipant) {
      actionButtonsContainer.innerHTML = `
        <button id="cancelJoinBtn" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-6 rounded">
          参加をキャンセルする
        </button>
      `;
      const cancelJoinBtn = detailContainer.querySelector("#cancelJoinBtn");
      if (cancelJoinBtn) {
        cancelJoinBtn.addEventListener("click", handleCancelJoin);
      }
    } else {
      actionButtonsContainer.innerHTML = `
        <button id="joinBtn" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-6 rounded">
          参加する
        </button>
      `;
      const joinBtn = detailContainer.querySelector("#joinBtn");
      if (joinBtn) {
        joinBtn.addEventListener("click", handleJoin);
      }
    }
  }

  /** トーナメント詳細のHTMLを生成 */
  function renderTournamentDetail(tournament: Tournament): void {
    detailContainer.innerHTML = `
      <div class="mb-6">
        <button id="backBtn" class="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded">&larr; 一覧に戻る</button>
      </div>

      <h1 class="text-3xl font-bold mb-6">${escapeHtml(tournament.name)}</h1>

      <div class="bg-white shadow rounded-lg p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">トーナメント情報</h2>
        <dl class="space-y-2">
          <div class="flex">
            <dt class="font-semibold w-32">対戦人数:</dt>
            <dd>4人</dd>
          </div>
          <div class="flex">
            <dt class="font-semibold w-32">ボールの速度:</dt>
            <dd>${getBallSpeedLabel(tournament.gameOptions?.ballSpeed)}</dd>
          </div>
          <div class="flex">
            <dt class="font-semibold w-32">ボールの大きさ:</dt>
            <dd>${getBallRadiusLabel(tournament.gameOptions?.ballRadius)}</dd>
          </div>
        </dl>
      </div>

      <div class="bg-white shadow rounded-lg p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">参加者一覧</h2>
        <div id="playersList"></div>
      </div>

      <div class="space-x-4" id="actionButtons">
      </div>
    `;
  }

  // ===================
  // データ読み込み
  // ===================

  /** 参加者一覧を部分更新（ポーリング用） */
  async function refreshPlayersList(): Promise<void> {
    try {
      const tournament = await fetchTournament(tournamentId);

      // トーナメントが開始されていれば遷移
      if (tournament.status === "in_progress") {
        navigateTo(`/tournaments/${tournamentId}/matches`);
        return;
      }
      if (tournament.status === "completed") {
        navigateTo(`/tournaments/${tournamentId}/matches?tab=results`);
        return;
      }

      updatePlayersList(tournament.players ?? [], tournament.hostId);

      updateStartButton(tournament.players?.length ?? 0, tournament.maxPlayers);
    } catch (error) {
      console.error("参加者一覧の更新に失敗しました:", error);
    }
  }

  /** トーナメント詳細を読み込む */
  async function loadTournamentDetail(): Promise<void> {
    try {
      showLoading(detailContainer);
      const [tournament, currentUser] = await Promise.all([
        fetchTournament(tournamentId),
        fetchAndParse("/api/user/me", MeResponseSchema, {
          method: "GET",
          credentials: "include",
        }),
      ]);

      // トーナメントが既に開始されている場合、マッチ画面に遷移
      if (tournament.status === "in_progress") {
        navigateTo(`/tournaments/${tournamentId}/matches`);
        return;
      }

      // トーナメントが完了している場合、結果タブに遷移
      if (tournament.status === "completed") {
        navigateTo(`/tournaments/${tournamentId}/matches?tab=results`);
        return;
      }

      // 詳細画面を描画
      renderTournamentDetail(tournament);
      updatePlayersList(tournament.players ?? [], tournament.hostId);

      // 戻るボタンのイベントリスナーを設定
      const backBtn = detailContainer.querySelector("#backBtn");
      if (backBtn) {
        backBtn.addEventListener("click", () => navigateTo("/tournaments"));
      }

      // ユーザーの状態を判定
      const isHost = currentUser.id === tournament.hostId;
      const isParticipant =
        tournament.players?.some((p) => p.userId === currentUser.id) ?? false;

      // ホストはトーナメントを作成した段階で自動参加
      if (isHost && !isParticipant) {
        try {
          await joinTournament(tournamentId, currentUser.name);
          loadTournamentDetail();
          return;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC;
          alert(`自動参加に失敗しました: ${errorMessage}`);
          console.error("自動参加エラー:", error);
        }
      }

      // 開始、参加、キャンセルボタンを描画
      renderActionButtons(isHost, isParticipant, tournament);
    } catch (error) {
      showError(detailContainer);
      console.error("Failed to load tournament detail:", error);
    }
  }

  // ===================
  // 自動更新（ポーリング）
  // ===================

  const autoRefreshInterval = window.setInterval(() => {
    refreshPlayersList();
  }, 5000);

  // ===================
  // 初期化・クリーンアップ
  // ===================

  loadTournamentDetail();

  const component = componentFactory(el);
  const originalUnmount = component.unmount;
  component.unmount = () => {
    clearInterval(autoRefreshInterval);
    originalUnmount();
  };

  return pageFactory([component]);
}
