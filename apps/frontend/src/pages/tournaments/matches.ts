import { MeResponseSchema } from "@transcendence/shared";
import { componentFactory, pageFactory } from "@/factory";
import type { RouteCtx } from "@/routing";
import { fetchAndParse } from "@/utils";
import {
  startMatch as apiStartMatch,
  fetchMatches,
  fetchTournament,
} from "./api";
import { ERROR_MESSAGES, MATCH_ROUND } from "./constants";
import {
  createFinalRankings,
  createMatchCard,
  createResultsSection,
} from "./matchCard";
import { TabManager, type TabType } from "./tabManager";
import type { Match } from "./types";
import {
  getLoser,
  getWinner,
  navigateTo,
  showError,
  showInfo,
  showLoading,
} from "./utils";

export function TournamentMatches(ctx: RouteCtx) {
  const tournamentId = ctx.params.id;
  const initialTab = (ctx.query.get("tab") as TabType | null) || "round1";

  const el = document.createElement("div");
  el.className = "min-h-screen bg-gray-100";

  el.innerHTML = `
    <div class="container mx-auto p-8">
      <div class="max-w-4xl mx-auto">
        <div class="mb-6">
          <h1 id="tournamentName" class="text-3xl font-bold text-center mb-2">Remote Tournament</h1>
        </div>

        <div class="flex justify-center mb-8 border-b border-gray-300">
          <button id="tabRound1" class="px-8 py-3 font-semibold text-green-600 border-b-2 border-green-600 min-w-[140px] text-center">
            セミファイナル
          </button>
          <button id="tabFinals" class="px-8 py-3 font-semibold text-gray-400 min-w-[140px] text-center cursor-not-allowed" disabled>
            決勝
          </button>
          <button id="tabResults" class="px-8 py-3 font-semibold text-gray-400 min-w-[140px] text-center cursor-not-allowed" disabled>
            結果
          </button>
        </div>

        <div id="matchesContainer" class="space-y-6">
          <p class="text-gray-500 text-center">${ERROR_MESSAGES.LOADING}</p>
        </div>
      </div>
    </div>
  `;

  // DOM要素の取得
  const tournamentNameEl = el.querySelector(
    "#tournamentName",
  ) as HTMLHeadingElement;
  const matchesContainer = el.querySelector(
    "#matchesContainer",
  ) as HTMLDivElement;
  const tabRound1 = el.querySelector("#tabRound1") as HTMLButtonElement;
  const tabFinals = el.querySelector("#tabFinals") as HTMLButtonElement;
  const tabResults = el.querySelector("#tabResults") as HTMLButtonElement;

  // 状態
  let currentUserId: number | undefined;
  let pollingInterval: number | null = null;

  // タブマネージャーの初期化
  const tabManager = new TabManager(
    initialTab,
    tabRound1,
    tabFinals,
    tabResults,
  );

  // ===================
  // マッチカード操作
  // ===================

  /** マッチの開始ボタンにイベントリスナーを追加 */
  function attachMatchEventListeners(matches: Match[]): void {
    matches.forEach((match) => {
      const btn = el.querySelector(
        `#startMatch-${match.id}`,
      ) as HTMLButtonElement;
      if (btn) {
        btn.addEventListener("click", () => handleMatchStart(match));
      }
    });
  }

  /** 個々のマッチカードを部分更新 */
  function updateMatchCard(match: Match): void {
    const existingCard = el.querySelector(`[data-match-id="${match.id}"]`);
    if (!existingCard) return;

    const newCardHtml = createMatchCard(match, currentUserId);
    const temp = document.createElement("div");
    temp.innerHTML = newCardHtml;
    const newCard = temp.firstElementChild;

    if (newCard) {
      existingCard.replaceWith(newCard);
      const btn = el.querySelector(
        `#startMatch-${match.id}`,
      ) as HTMLButtonElement;
      if (btn) {
        btn.addEventListener("click", () => handleMatchStart(match));
      }
    }
  }

  // ===================
  // マッチ操作
  // ===================

  /** マッチ開始処理 */
  async function handleMatchStart(match: Match): Promise<void> {
    try {
      const matches = await fetchMatches(tournamentId);
      const currentMatch = matches.find((m) => m.id === match.id);

      if (!currentMatch) {
        alert("マッチが見つかりませんでした");
        return;
      }

      // マッチがすでに開始されている場合は、直接ゲーム画面に遷移
      if (currentMatch.status === "in_progress") {
        navigateTo(`/pong/${tournamentId}/${match.id}`);
        return;
      }

      await apiStartMatch(tournamentId, match.id);
      navigateTo(`/pong/${tournamentId}/${match.id}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC;
      alert(`エラー: ${errorMessage}`);
      console.error("Failed to handle match start:", error);
    }
  }

  // ===================
  // タブコンテンツ読み込み
  // ===================

  /** セミファイナルタブのコンテンツを読み込む */
  async function loadSemifinals(): Promise<void> {
    try {
      showLoading(matchesContainer);
      const matches = await fetchMatches(tournamentId);

      const semifinalMatches = matches.filter(
        (m) => m.round === MATCH_ROUND.SEMIFINALS,
      );

      if (semifinalMatches.length === 0) {
        showInfo(matchesContainer, ERROR_MESSAGES.NO_MATCHES);
        return;
      }

      matchesContainer.innerHTML = semifinalMatches
        .map((match) => createMatchCard(match, currentUserId))
        .join("");

      attachMatchEventListeners(semifinalMatches);
    } catch (error) {
      showError(matchesContainer, ERROR_MESSAGES.MATCH_NOT_FOUND);
      console.error("Failed to load semifinals:", error);
    }
  }

  /** 決勝タブのコンテンツを読み込む */
  async function loadFinals(): Promise<void> {
    try {
      showLoading(matchesContainer);
      const matches = await fetchMatches(tournamentId);

      const semifinalMatches = matches.filter(
        (m) => m.round === MATCH_ROUND.SEMIFINALS,
      );
      const finalsMatch = matches.find((m) => m.round === MATCH_ROUND.FINALS);
      const thirdPlaceMatch = matches.find(
        (m) => m.round === MATCH_ROUND.THIRD_PLACE,
      );

      if (!finalsMatch && !thirdPlaceMatch) {
        showInfo(
          matchesContainer,
          "ファイナルマッチはまだ生成されていません。セミファイナルを完了してください。",
        );
        return;
      }

      let html = "";

      if (finalsMatch) {
        html += `<h2 class="text-2xl font-bold mb-4">決勝戦</h2>`;
        html += createMatchCard(finalsMatch, currentUserId);
      }

      if (thirdPlaceMatch) {
        html += `<h2 class="text-2xl font-bold mb-4 mt-8">3位決定戦</h2>`;
        html += createMatchCard(thirdPlaceMatch, currentUserId);
      }

      matchesContainer.innerHTML = html;
      matchesContainer.innerHTML += createResultsSection(
        semifinalMatches,
        "セミファイナル結果",
      );

      const finalMatches = [finalsMatch, thirdPlaceMatch].filter(
        (m) => m !== undefined,
      ) as Match[];
      attachMatchEventListeners(finalMatches);
    } catch (error) {
      showError(matchesContainer, ERROR_MESSAGES.MATCH_NOT_FOUND);
      console.error("Failed to load finals:", error);
    }
  }

  /** 結果タブのコンテンツを読み込む（1位〜4位の順位表示） */
  async function loadResults(): Promise<void> {
    try {
      showLoading(matchesContainer);
      const matches = await fetchMatches(tournamentId);

      const finalsMatch = matches.find((m) => m.round === MATCH_ROUND.FINALS);
      const thirdPlaceMatch = matches.find(
        (m) => m.round === MATCH_ROUND.THIRD_PLACE,
      );

      if (!finalsMatch?.score || !thirdPlaceMatch?.score) {
        showInfo(
          matchesContainer,
          "全ての試合が完了していません。決勝戦と3位決定戦を完了してください。",
        );
        return;
      }

      const champion = getWinner(finalsMatch);
      const runnerUp = getLoser(finalsMatch);
      const thirdPlace = getWinner(thirdPlaceMatch);
      const fourthPlace = getLoser(thirdPlaceMatch);

      if (!champion || !runnerUp || !thirdPlace || !fourthPlace) {
        showError(matchesContainer, "順位の計算中にエラーが発生しました。");
        return;
      }

      const rankings = [
        { rank: 1, player: champion },
        { rank: 2, player: runnerUp },
        { rank: 3, player: thirdPlace },
        { rank: 4, player: fourthPlace },
      ];

      matchesContainer.innerHTML = createFinalRankings(rankings);
    } catch (error) {
      showError(matchesContainer, ERROR_MESSAGES.GENERIC);
      console.error("Failed to load results:", error);
    }
  }

  // ===================
  // タブ状態管理
  // ===================

  /** タブの状態を更新し、必要に応じて自動遷移 */
  async function updateTabStates(): Promise<void> {
    try {
      const matches = await fetchMatches(tournamentId);
      const switchTo = tabManager.updateTabStates(matches);

      if (switchTo === "finals") {
        tabManager.setActiveTab("finals");
        await loadFinals();
      } else if (switchTo === "results") {
        tabManager.setActiveTab("results");
        await loadResults();
        if (pollingInterval !== null) {
          clearInterval(pollingInterval);
          pollingInterval = null;
        }
      }
    } catch (error) {
      console.error("Failed to update tab states:", error);
    }
  }

  // ===================
  // データ読み込み
  // ===================

  /** トーナメント情報を読み込む */
  async function loadTournament(): Promise<void> {
    try {
      const [tournament, currentUser] = await Promise.all([
        fetchTournament(tournamentId),
        fetchAndParse("/api/user/me", MeResponseSchema, {
          method: "GET",
          credentials: "include",
        }),
      ]);
      currentUserId = currentUser.id;
      tournamentNameEl.textContent = tournament.name;

      // 準決勝なのか決勝なのかで読み込み先を変更する
      const currentTab = tabManager.getCurrentTab();
      if (currentTab === "finals") {
        tabManager.setActiveTab("finals");
        await loadFinals();
      } else {
        tabManager.setActiveTab("round1");
        await loadSemifinals();
      }
      await updateTabStates();
    } catch (error) {
      showError(matchesContainer, ERROR_MESSAGES.TOURNAMENT_NOT_FOUND);
      console.error("Failed to load tournament:", error);
    }
  }

  /** 現在のタブを部分更新（ポーリング用） */
  async function refreshCurrentTab(): Promise<void> {
    try {
      const matches = await fetchMatches(tournamentId);
      const currentTab = tabManager.getCurrentTab();

      if (currentTab === "round1") {
        const semifinalMatches = matches.filter(
          (m) => m.round === MATCH_ROUND.SEMIFINALS,
        );
        for (const match of semifinalMatches) {
          updateMatchCard(match);
        }
      } else if (currentTab === "finals") {
        const finalsMatch = matches.find((m) => m.round === MATCH_ROUND.FINALS);
        const thirdPlaceMatch = matches.find(
          (m) => m.round === MATCH_ROUND.THIRD_PLACE,
        );
        if (finalsMatch) updateMatchCard(finalsMatch);
        if (thirdPlaceMatch) updateMatchCard(thirdPlaceMatch);
      }

      await updateTabStates();
    } catch (error) {
      console.error("Failed to refresh current tab:", error);
    }
  }

  // ===================
  // イベントリスナー設定
  // ===================

  tabRound1.addEventListener("click", () => {
    tabManager.setActiveTab("round1");
    loadSemifinals();
  });

  tabFinals.addEventListener("click", () => {
    if (tabManager.isFinalsDisabled()) return;
    tabManager.setActiveTab("finals");
    loadFinals();
  });

  tabResults.addEventListener("click", () => {
    if (tabManager.isResultsDisabled()) return;
    tabManager.setActiveTab("results");
    loadResults();
  });

  // ===================
  // 自動更新（ポーリング）
  // ===================

  pollingInterval = window.setInterval(refreshCurrentTab, 5000);

  // ===================
  // 初期化・クリーンアップ
  // ===================

  loadTournament();

  const component = componentFactory(el);
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
