import {
  MatchesResponseSchema,
  MeResponseSchema,
  type UserStatsResponse,
  UserStatsResponseSchema,
} from "@transcendence/shared";
import Chart from "chart.js/auto";
import type { ElComponent } from "../../factory/componentFactory";
import { componentFactory } from "../../factory/componentFactory";
import { fetchAndParse } from "../../utils/fetchAndParse";

const renderOverview = (stats: UserStatsResponse | null) => {
  if (!stats)
    return '<p class="text-gray-500 italic p-4">有効な試合データがありません</p>';

  return `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      <div class="bg-white shadow rounded-lg p-4 hover:shadow-lg transition-shadow">
        <p class="text-gray-500 text-sm">平均獲得点数</p>
        <p class="text-2xl font-bold">${stats.average_score.toFixed(1)}</p>
      </div>
      <div class="bg-white shadow rounded-lg p-4 hover:shadow-lg transition-shadow">
        <p class="text-gray-500 text-sm">試合数</p>
        <p class="text-2xl font-bold">${stats.number_of_matches}</p>
      </div>
      <div class="bg-white shadow rounded-lg p-4 hover:shadow-lg transition-shadow">
        <p class="text-gray-500 text-sm">勝利数</p>
        <p class="text-2xl font-bold">${stats.number_of_wins}</p>
        <p class="text-gray-500 text-sm">勝率: ${((stats.number_of_wins / stats.number_of_matches) * 100 || 0).toFixed(1)}%</p>
      </div>
      <div class="bg-white shadow rounded-lg p-4 hover:shadow-lg transition-shadow">
        <p class="text-gray-500 text-sm">現在の連勝数</p>
        <p class="text-2xl font-bold">${stats.current_winning_streak}</p>
      </div>
      <div class="bg-white shadow rounded-lg p-4 hover:shadow-lg transition-shadow">
        <p class="text-gray-500 text-sm">合計獲得点数</p>
        <p class="text-2xl font-bold">${stats.total_score_points}</p>
      </div>
      <div class="bg-white shadow rounded-lg p-4 hover:shadow-lg transition-shadow">
        <p class="text-gray-500 text-sm">合計失点数</p>
        <p class="text-2xl font-bold">${stats.total_loss_points}</p>
        <p class="text-gray-500 text-sm">得失点差: ${stats.total_score_points - stats.total_loss_points}</p>
      </div>
    </div>
  `;
};

const renderMatches = (stats: UserStatsResponse | null) => {
  if (!stats)
    return '<p class="text-gray-500 italic p-4">有効な試合データがありません</p>';

  return `
    <div id="matchesContainer" class="p-4">
      <p class="text-gray-500">読み込み中...</p>
    </div>
  `;
};

const renderSettings = () => {
  return `
    <div class="p-4">
      <h2 class="text-xl font-semibold mb-4">設定</h2>
      <div class="space-y-4">
        <div class="bg-white shadow rounded-lg p-4">
          <h3 class="text-lg font-medium mb-2">二要素認証</h3>
          <p class="text-gray-600 mb-4">アカウントのセキュリティを強化するために2FAを設定できます。</p>
          <a href="/settings/2fa" class="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors">
            2FA設定
          </a>
        </div>
      </div>
    </div>
  `;
};

export const Dashboard = async (): Promise<ElComponent> => {
  // fetch current user
  const me = await fetchAndParse("/api/user/me", MeResponseSchema, {
    method: "GET",
    credentials: "include",
  });

  const userStatsRes = await fetchAndParse(
    `/api/user-stats/${me.id}`,
    UserStatsResponseSchema,
    {
      method: "POST",
      credentials: "include",
    },
  );

  const el = document.createElement("div");

  el.innerHTML = `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold mb-2">Dashboard</h1>
          <p class="text-xl text-gray-600">Welcome, ${me.name ?? "User"}!</p>
        </div>
        <div>
          <a href="/tournaments" class="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors">
            トーナメント一覧
          </a>
        </div>
      </div>
      
      <div class="mb-6">
        <div class="border-b border-gray-200">
          <nav class="flex gap-4" aria-label="Tabs">
            <button 
              class="tab-btn py-2 px-4 border-b-2 border-blue-500 text-blue-600 font-medium text-sm" 
              data-tab="overview"
            >
              Overview
            </button>
            <button 
              class="tab-btn py-2 px-4 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300" 
              data-tab="matches"
            >
              Matches
            </button>
            <button 
              class="tab-btn py-2 px-4 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300" 
              data-tab="settings"
            >
              Settings
            </button>
          </nav>
        </div>
        
        <div class="min-h-[400px]"> <!-- タブコンテンツの最小高さを設定 -->
          <div id="overview" class="tab-content">
            ${renderOverview(userStatsRes)}
          </div>
          <div id="matches" class="tab-content hidden">
            ${renderMatches(userStatsRes)}
          </div>
          <div id="settings" class="tab-content hidden">
            ${renderSettings()}
          </div>
        </div>
      </div>
    </div>
  `;

  // タブ切り替えの実装
  const tabs = el.querySelectorAll(".tab-btn");
  const contents = el.querySelectorAll(".tab-content");

  // マッチ履歴を取得して表示
  async function loadMatchHistory() {
    const matchesContainer = el.querySelector("#matchesContainer");
    if (!matchesContainer) return;

    try {
      const me = await fetchAndParse("/api/user/me", MeResponseSchema, {
        method: "GET",
        credentials: "include",
      });

      const matchesData = await fetchAndParse(
        "/api/user/matches",
        MatchesResponseSchema,
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (matchesData.matches.length === 0) {
        matchesContainer.innerHTML =
          '<p class="text-gray-500 italic p-4">試合履歴がありません</p>';
        return;
      }

      // マッチ履歴を表示
      const matchesHtml = matchesData.matches
        .map(
          (match: {
            id: string;
            tournament_id: string;
            round: number;
            player1_id: number;
            player2_id: number;
            player1_name: string;
            player2_name: string;
            player1_score: number;
            player2_score: number;
            winner_id: number;
            played_at: string;
            ball_speed?: number;
            ball_radius?: number;
            score_logs?: Array<{
              scored_player_id: number;
              scored_player_name: string;
              current_player1_score: number;
              current_player2_score: number;
            }>;
          }) => {
            const isWin = match.winner_id === me.id;
            const opponent =
              match.player1_id === me.id
                ? `Player: ${match.player2_name}`
                : `Player: ${match.player1_name}`;
            const score =
              match.player1_id === me.id
                ? `${match.player1_score} - ${match.player2_score}`
                : `${match.player2_score} - ${match.player1_score}`;
            const resultClass = isWin
              ? "text-green-600 font-bold"
              : "text-red-600";
            const result = isWin ? "勝利" : "敗北";
            const playedAt = new Date(match.played_at).toLocaleString("ja-JP");

            // 得点推移をHTMLで生成
            const scoreLogsHtml = (match.score_logs || [])
              .map((log) => {
                const isCurrentUserScored = log.scored_player_id === me.id;
                return `
                  <div class="text-xs py-1 px-2 ${
                    isCurrentUserScored
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }">
                    ${log.current_player1_score} - ${log.current_player2_score}
                  </div>
                `;
              })
              .join("");

            return `
              <div class="bg-white shadow rounded-lg p-4 mb-3 hover:shadow-lg transition-shadow">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex-1">
                    <p class="text-gray-600 text-sm">対戦相手: ${opponent}</p>
                    <p class="text-lg font-semibold mt-1">${score}</p>
                    <p class="text-gray-500 text-xs mt-1">Round: ${match.round} | ${playedAt}</p>
                  </div>
                  <div class="text-right">
                    <p class="${resultClass}">${result}</p>
                  </div>
                </div>

                <!-- ゲーム設定 -->
                <div class="bg-gray-50 rounded p-2 mb-2 text-xs">
                  <p class="text-gray-700">
                    Ball Speed: ${match.ball_speed ?? "N/A"} | Ball Radius: ${
                      match.ball_radius ?? "N/A"
                    }
                  </p>
                </div>

                <!-- 得点推移 -->
                ${
                  scoreLogsHtml
                    ? `
                  <div class="bg-gray-100 rounded p-2 mb-2">
                    <p class="text-gray-600 font-semibold text-xs mb-2">スコア推移:</p>
                    <div style="position: relative; height: 200px; margin-bottom: 8px;">
                      <canvas id="chart-${match.id}"></canvas>
                    </div>
                  </div>
                `
                    : '<p class="text-gray-500 text-xs italic">得点データなし</p>'
                }
              </div>
            `;
          },
        )
        .join("");

      matchesContainer.innerHTML = matchesHtml;

      // すべてのグラフを描画
      const loadChartLibrary = async () => {
        try {
          matchesData.matches.forEach(
            (match: {
              id: string;
              tournament_id: string;
              round: number;
              player1_id: number;
              player2_id: number;
              player1_name: string;
              player2_name: string;
              player1_score: number;
              player2_score: number;
              winner_id: number;
              played_at: string;
              ball_speed?: number;
              ball_radius?: number;
              score_logs?: Array<{
                scored_player_id: number;
                scored_player_name: string;
                current_player1_score: number;
                current_player2_score: number;
                elapsed_seconds?: number;
              }>;
            }) => {
              if (!match.score_logs || match.score_logs.length === 0) return;

              const canvasElement = el.querySelector(
                `#chart-${match.id}`,
              ) as HTMLCanvasElement | null;
              if (!canvasElement) return;

              // 初期値（0秒、0対0）を先頭に追加
              const logsWithInitial = [
                {
                  scored_player_id: 0,
                  current_player1_score: 0,
                  current_player2_score: 0,
                  elapsed_seconds: 0,
                },
                ...match.score_logs,
              ];

              const labels = logsWithInitial.map(
                (log) => `${log.elapsed_seconds}s`,
              );
              const player1Data = logsWithInitial.map(
                (log) => log.current_player1_score,
              );
              const player2Data = logsWithInitial.map(
                (log) => log.current_player2_score,
              );

              const player1Name = `Player: ${match.player1_name}`;
              const player2Name = `Player: ${match.player2_name}`;
              new Chart(canvasElement, {
                type: "line",
                data: {
                  labels,
                  datasets: [
                    {
                      label: player1Name,
                      data: player1Data,
                      borderColor: "#3B82F6",
                      backgroundColor: "rgba(59, 130, 246, 0.1)",
                      borderWidth: 2,
                      fill: false,
                      tension: 0.3,
                    },
                    {
                      label: player2Name,
                      data: player2Data,
                      borderColor: "#EF4444",
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                      borderWidth: 2,
                      fill: false,
                      tension: 0.3,
                    },
                  ],
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "top" as const,
                      labels: {
                        font: {
                          size: 12,
                        },
                      },
                    },
                  },
                  scales: {
                    x: {
                      title: {
                        display: true,
                        text: "Elapsed Time (seconds)",
                      },
                    },
                    y: {
                      beginAtZero: true,
                      max: Math.max(...player1Data, ...player2Data) + 1,
                      ticks: {
                        stepSize: 1,
                      },
                      title: {
                        display: true,
                        text: "Score",
                      },
                    },
                  },
                },
              });
            },
          );
        } catch (err) {
          console.error("Failed to load chart library:", err);
        }
      };

      loadChartLibrary();
    } catch (error) {
      console.error("Failed to load match history:", error);
      matchesContainer.innerHTML =
        '<p class="text-gray-500 italic p-4">試合履歴の読み込みに失敗しました</p>';
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", async () => {
      const target = tab.getAttribute("data-tab");

      // タブボタンのスタイル更新
      tabs.forEach((t) => {
        if (t === tab) {
          t.classList.add("border-blue-500", "text-blue-600");
          t.classList.remove(
            "border-transparent",
            "text-gray-500",
            "hover:text-gray-700",
            "hover:border-gray-300",
          );
        } else {
          t.classList.remove("border-blue-500", "text-blue-600");
          t.classList.add(
            "border-transparent",
            "text-gray-500",
            "hover:text-gray-700",
            "hover:border-gray-300",
          );
        }
      });

      // コンテンツの表示/非表示
      contents.forEach((content) => {
        if (content.id === target) {
          content.classList.remove("hidden");
          // Matches タブが選択された時にマッチ履歴を読み込む
          if (target === "matches") {
            loadMatchHistory();
          }
        } else {
          content.classList.add("hidden");
        }
      });
    });
  });

  return componentFactory(el);
};
