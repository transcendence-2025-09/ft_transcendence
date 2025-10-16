import { componentFactory } from "../../factory/componentFactory";
import { pageFactory } from "../../factory/pageFactory";
import type { RouteCtx } from "../../routing/routeList";
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
        <!-- Header -->
        <div class="mb-6">
          <h1 id="tournamentName" class="text-3xl font-bold text-center mb-2">Remote Tournament</h1>
          <div class="text-center">
            <a href="/tournaments" class="text-blue-500 hover:underline">← Back to Home</a>
          </div>
        </div>

        <!-- Tabs -->
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

        <!-- Matches Container -->
        <div id="matchesContainer" class="space-y-6">
          <p class="text-gray-500 text-center">${ERROR_MESSAGES.LOADING}</p>
        </div>
      </div>
    </div>
  `;

  const tournamentNameEl = el.querySelector(
    "#tournamentName",
  ) as HTMLHeadingElement;
  const matchesContainer = el.querySelector(
    "#matchesContainer",
  ) as HTMLDivElement;
  const tabRound1 = el.querySelector("#tabRound1") as HTMLButtonElement;
  const tabFinals = el.querySelector("#tabFinals") as HTMLButtonElement;
  const tabResults = el.querySelector("#tabResults") as HTMLButtonElement;

  // タブマネージャーの初期化
  const tabManager = new TabManager(
    initialTab,
    tabRound1,
    tabFinals,
    tabResults,
  );

  /**
   * マッチの開始ボタンにイベントリスナーを追加
   */
  function attachMatchEventListeners(matches: Match[]) {
    matches.forEach((match) => {
      const btn = el.querySelector(
        `#startMatch-${match.id}`,
      ) as HTMLButtonElement;
      if (btn) {
        btn.addEventListener("click", () => handleMatchStart(match));
      }
    });
  }

  /**
   * タブの状態を更新
   */
  async function updateTabStates() {
    try {
      const matches = await fetchMatches(tournamentId);
      const shouldAutoSwitch = tabManager.updateTabStates(matches);

      if (shouldAutoSwitch) {
        alert("全てのセミファイナルが完了しました！決勝戦をご覧ください。");
        tabManager.setActiveTab("finals");
        await loadFinals();
      }
    } catch (error) {
      console.error("Failed to update tab states:", error);
    }
  }

  /**
   * トーナメント情報を読み込む
   */
  async function loadTournament() {
    try {
      const tournament = await fetchTournament(tournamentId);
      tournamentNameEl.textContent = tournament.name;

      // 初期タブに応じた内容を読み込み
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

  /**
   * セミファイナルタブのコンテンツを読み込む
   */
  async function loadSemifinals() {
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
        .map((match) => createMatchCard(match))
        .join("");

      attachMatchEventListeners(semifinalMatches);
    } catch (error) {
      showError(matchesContainer, ERROR_MESSAGES.MATCH_NOT_FOUND);
      console.error("Failed to load semifinals:", error);
    }
  }

  /**
   * 決勝タブのコンテンツを読み込む
   */
  async function loadFinals() {
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
        html += createMatchCard(finalsMatch);
      }

      if (thirdPlaceMatch) {
        html += `<h2 class="text-2xl font-bold mb-4 mt-8">3位決定戦</h2>`;
        html += createMatchCard(thirdPlaceMatch);
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

  /**
   * 結果タブのコンテンツを読み込む（1位〜4位の順位表示）
   */
  async function loadResults() {
    try {
      showLoading(matchesContainer);
      const matches = await fetchMatches(tournamentId);

      const finalsMatch = matches.find((m) => m.round === MATCH_ROUND.FINALS);
      const thirdPlaceMatch = matches.find(
        (m) => m.round === MATCH_ROUND.THIRD_PLACE,
      );

      // 決勝戦と3位決定戦が両方完了していることを確認
      if (!finalsMatch?.score || !thirdPlaceMatch?.score) {
        showInfo(
          matchesContainer,
          "全ての試合が完了していません。決勝戦と3位決定戦を完了してください。",
        );
        return;
      }

      // 順位を計算
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

  /**
   * マッチ開始処理
   */
  async function handleMatchStart(match: Match) {
    try {
      await apiStartMatch(tournamentId, match.id);
      // Pongゲーム画面に遷移
      navigateTo(`/pong/${tournamentId}/${match.id}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC;
      alert(`エラー: ${errorMessage}`);
      console.error("Failed to handle match start:", error);
    }
  }

  // タブクリックイベント
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

  loadTournament();

  const component = componentFactory(el);
  return pageFactory([component]);
}
