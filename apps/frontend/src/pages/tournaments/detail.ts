import { componentFactory } from "../../factory/componentFactory";
import { pageFactory } from "../../factory/pageFactory";
import type { RouteCtx } from "../../routing/routeList";

type Player = {
  userId: number;
  alias: string;
};

type Tournament = {
  id: string;
  name: string;
  hostId: number;
  maxPlayers: number;
  players: Player[];
  status: "waiting" | "ready" | "in_progress" | "completed";
  createdAt: string;
};

export function TournamentDetail(ctx: RouteCtx) {
  const tournamentId = ctx.params.id;

  const el = document.createElement("div");
  el.className = "container mx-auto p-8";

  el.innerHTML = `
    <div class="max-w-4xl mx-auto">
      <div id="tournamentDetail">
        <p class="text-gray-500">読み込み中...</p>
      </div>
    </div>
  `;

  const detailContainer = el.querySelector(
    "#tournamentDetail",
  ) as HTMLDivElement;

  async function loadTournamentDetail() {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`);

      if (!response.ok) {
        detailContainer.innerHTML =
          '<p class="text-red-500">トーナメントが見つかりません</p>';
        return;
      }

      const tournament: Tournament = await response.json();

      detailContainer.innerHTML = `
        <div class="mb-6">
          <a href="/tournaments" class="text-blue-500 hover:underline">&larr; 一覧に戻る</a>
        </div>

        <h1 class="text-3xl font-bold mb-6">${tournament.name}</h1>

        <div class="bg-white shadow rounded-lg p-6 mb-6">
          <h2 class="text-xl font-semibold mb-4">トーナメント情報</h2>
          <dl class="space-y-2">
            <div class="flex">
              <dt class="font-semibold w-32">ステータス:</dt>
              <dd>${getStatusLabel(tournament.status)}</dd>
            </div>
            <div class="flex">
              <dt class="font-semibold w-32">最大人数:</dt>
              <dd>${tournament.maxPlayers}人</dd>
            </div>
            <div class="flex">
              <dt class="font-semibold w-32">現在の参加者:</dt>
              <dd>${tournament.players.length}人</dd>
            </div>
            <div class="flex">
              <dt class="font-semibold w-32">作成日時:</dt>
              <dd>${new Date(tournament.createdAt).toLocaleString()}</dd>
            </div>
          </dl>
        </div>

        <div class="bg-white shadow rounded-lg p-6 mb-6">
          <h2 class="text-xl font-semibold mb-4">参加者一覧</h2>
          ${
            tournament.players.length === 0
              ? '<p class="text-gray-500">まだ参加者がいません</p>'
              : `
              <ul class="space-y-2">
                ${tournament.players
                  .map(
                    (p: Player) => `
                  <li class="flex items-center justify-between p-2 border rounded">
                    <span>${p.alias}</span>
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

      // 参加ボタン
      const joinBtn = detailContainer.querySelector("#joinBtn");
      if (joinBtn) {
        joinBtn.addEventListener("click", async () => {
          const alias = prompt("プレイヤー名を入力してください:");
          if (!alias) return;

          try {
            const res = await fetch(`/api/tournaments/${tournamentId}/join`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ alias }),
            });

            if (res.ok) {
              loadTournamentDetail();
            } else {
              const error = await res.json();
              alert(`参加に失敗しました: ${error.error}`);
            }
          } catch (_error) {
            alert("エラーが発生しました");
          }
        });
      }

      // 開始ボタン
      const startBtn = detailContainer.querySelector("#startBtn");
      if (startBtn) {
        startBtn.addEventListener("click", async () => {
          if (!confirm("トーナメントを開始しますか？")) return;

          try {
            const res = await fetch(`/api/tournaments/${tournamentId}/start`, {
              method: "POST",
              credentials: "include",
            });

            if (res.ok) {
              loadTournamentDetail();
            } else {
              const error = await res.json();
              alert(`開始に失敗しました: ${error.error}`);
            }
          } catch (_error) {
            alert("エラーが発生しました");
          }
        });
      }
    } catch (error) {
      detailContainer.innerHTML =
        '<p class="text-red-500">エラーが発生しました</p>';
      console.error("Failed to load tournament detail:", error);
    }
  }

  function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      waiting: "待機中",
      ready: "準備完了",
      in_progress: "進行中",
      completed: "完了",
    };
    return labels[status] || status;
  }

  loadTournamentDetail();

  const component = componentFactory(el);
  return pageFactory([component]);
}
