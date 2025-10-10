import { componentFactory } from "../../factory/componentFactory";
import { pageFactory } from "../../factory/pageFactory";
import type { RouteCtx } from "../../routing/routeList";
import { ERROR_MESSAGES, MATCH_ROUND } from "./constants";
import type { Match, Tournament } from "./types";
import { escapeHtml, showError, showInfo, showLoading } from "./utils";

export function TournamentSemifinal(ctx: RouteCtx) {
  const tournamentId = ctx.params.id;

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
          <button id="tabRound1" class="px-6 py-3 font-semibold text-green-600 border-b-2 border-green-600">
            Round 1
          </button>
          <button id="tabFinals" class="px-6 py-3 font-semibold text-gray-600 hover:text-green-600">
            Finals
          </button>
          <button id="tabResults" class="px-6 py-3 font-semibold text-gray-600 hover:text-green-600">
            Results
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

  // トーナメント情報を読み込む
  async function loadTournament() {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`);
      if (!response.ok) {
        showError(matchesContainer, ERROR_MESSAGES.TOURNAMENT_NOT_FOUND);
        return;
      }

      const tournament: Tournament = await response.json();
      tournamentNameEl.textContent = tournament.name;

      await loadMatches();
    } catch (error) {
      showError(matchesContainer);
      console.error("Failed to load tournament:", error);
    }
  }

  // マッチ一覧を読み込む
  async function loadMatches() {
    try {
      showLoading(matchesContainer);
      const response = await fetch(`/api/tournaments/${tournamentId}/matches`);
      if (!response.ok) {
        showError(matchesContainer, ERROR_MESSAGES.MATCH_NOT_FOUND);
        return;
      }

      const data = await response.json();
      const matches: Match[] = data.matches || [];

      // セミファイナルのマッチのみフィルタリング
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

      // 各マッチの開始ボタンにイベントリスナーを追加
      semifinalMatches.forEach((match) => {
        const btn = el.querySelector(
          `#startMatch-${match.id}`,
        ) as HTMLButtonElement;
        if (btn) {
          btn.addEventListener("click", () => startMatch(match.id));
        }
      });
    } catch (error) {
      showError(matchesContainer);
      console.error("Failed to load matches:", error);
    }
  }

  // マッチカードのHTMLを生成
  function createMatchCard(match: Match): string {
    const player1Name = escapeHtml(match.player1?.alias || "TBD");
    const player2Name = escapeHtml(match.player2?.alias || "TBD");
    const isStartable =
      match.status === "pending" && match.player1 && match.player2;

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
            Start Match
          </button>
        </div>
      </div>
    `;
  }

  // マッチを開始
  async function startMatch(matchId: string) {
    try {
      // マッチ情報を取得して勝者を決定
      const matchesResponse = await fetch(
        `/api/tournaments/${tournamentId}/matches`,
      );
      if (!matchesResponse.ok) {
        alert("マッチ情報の取得に失敗しました");
        return;
      }

      const matchesData = await matchesResponse.json();
      const currentMatch = matchesData.matches?.find(
        (m: Match) => m.id === matchId,
      );
      if (!currentMatch) {
        alert("マッチが見つかりません");
        return;
      }

      // マッチを開始
      const startResponse = await fetch(
        `/api/tournaments/${tournamentId}/matches/${matchId}/start`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      if (!startResponse.ok) {
        const error = await startResponse.json();
        alert(`マッチ開始に失敗しました: ${error.error}`);
        return;
      }

      alert("マッチが開始されました");

      // TODO: 実際のゲーム画面に遷移してプレイ
      // 現在は仮の結果を送信（player1が5点、player2が3点で勝利）

      // 仮の結果を送信（5 vs 3、player1の勝利）
      const resultResponse = await fetch(
        `/api/tournaments/${tournamentId}/matches/${matchId}/result`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            winnerId: currentMatch.player1.userId, // player1を勝者とする
            score: {
              player1: 5,
              player2: 3,
            },
          }),
        },
      );

      if (resultResponse.ok) {
        alert(
          `マッチ結果を送信しました\n${currentMatch.player1.alias}: 5 vs ${currentMatch.player2.alias}: 3`,
        );
        loadMatches();
      } else {
        const error = await resultResponse.json();
        alert(`結果送信に失敗しました: ${error.error}`);
      }
    } catch (error) {
      alert(ERROR_MESSAGES.GENERIC);
      console.error("Failed to start match:", error);
    }
  }

  // タブ切り替えのイベントリスナー
  tabRound1.addEventListener("click", () => {
    setActiveTab("round1");
    loadMatches();
  });

  tabFinals.addEventListener("click", () => {
    setActiveTab("finals");
    // TODO: ファイナル画面を実装
    // - round === "finals" のマッチを表示
    // - ファイナルマッチが存在しない場合は「ファイナルマッチはまだ生成されていません」を表示
    alert("Finals page is not yet implemented");
  });

  tabResults.addEventListener("click", () => {
    setActiveTab("results");
    // TODO: 結果画面を実装
    // - トーナメントの最終順位を表示
    // - 1位: ファイナルの勝者
    // - 2位: ファイナルの敗者
    // - 3-4位: セミファイナルの敗者
    alert("Results page is not yet implemented");
  });

  // アクティブなタブを設定
  function setActiveTab(tab: "round1" | "finals" | "results") {
    const tabs = [
      { element: tabRound1, name: "round1" },
      { element: tabFinals, name: "finals" },
      { element: tabResults, name: "results" },
    ];

    tabs.forEach(({ element, name }) => {
      if (name === tab) {
        element.className =
          "px-6 py-3 font-semibold text-green-600 border-b-2 border-green-600";
      } else {
        element.className =
          "px-6 py-3 font-semibold text-gray-600 hover:text-green-600";
      }
    });
  }

  loadTournament();

  const component = componentFactory(el);
  return pageFactory([component]);
}
