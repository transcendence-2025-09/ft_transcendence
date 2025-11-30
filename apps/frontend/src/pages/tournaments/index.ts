import { componentFactory } from "../../factory/componentFactory";
import { pageFactory } from "../../factory/pageFactory";
import { createTournament, fetchAllTournaments } from "./api";
import { ERROR_MESSAGES } from "./constants";
import type { Tournament } from "./types";
import {
  escapeHtml,
  formatDate,
  getStatusLabel,
  navigateTo,
  showError,
  showInfo,
  showLoading,
} from "./utils";

function createTournamentsPage() {
  const el = document.createElement("div");
  el.className = "container mx-auto p-8";

  el.innerHTML = `
    <div class="max-w-4xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">トーナメント一覧</h1>
        <button id="createTournamentBtn" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          新規作成
        </button>
      </div>

      <div id="tournamentsList" class="space-y-4">
        <p class="text-gray-500">${ERROR_MESSAGES.LOADING}</p>
      </div>
    </div>

    <!-- 新規作成モーダル -->
    <div id="createModal" class="hidden fixed inset-0 items-center justify-center">
      <div class="bg-white p-6 rounded-lg max-w-md w-full">
        <h2 class="text-2xl font-bold mb-4">トーナメント作成</h2>
        <input
          type="text"
          id="tournamentName"
          placeholder="トーナメント名"
          class="w-full border border-gray-300 rounded px-3 py-2 mb-4"
        >

        <div class="mb-4">
          <label class="block text-sm font-bold mb-2">ボールの速度</label>
          <select id="ballSpeed" class="w-full border border-gray-300 rounded px-3 py-2">
            <option value="3">ゆっくり</option>
            <option value="6" selected>普通</option>
            <option value="15">速い</option>
          </select>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-bold mb-2">ボールの大きさ</label>
          <select id="ballRadius" class="w-full border border-gray-300 rounded px-3 py-2">
            <option value="3">小さい</option>
            <option value="12" selected>普通</option>
            <option value="48">大きい</option>
          </select>
        </div>

        <div class="flex gap-2">
          <button id="createBtn" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex-1">
            作成
          </button>
          <button id="cancelBtn" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded flex-1">
            キャンセル
          </button>
        </div>
      </div>
    </div>
  `;

  const tournamentsList = el.querySelector(
    "#tournamentsList",
  ) as HTMLDivElement;
  const createTournamentBtn = el.querySelector(
    "#createTournamentBtn",
  ) as HTMLButtonElement;
  const createModal = el.querySelector("#createModal") as HTMLDivElement;
  const createBtn = el.querySelector("#createBtn") as HTMLButtonElement;
  const cancelBtn = el.querySelector("#cancelBtn") as HTMLButtonElement;
  const tournamentNameInput = el.querySelector(
    "#tournamentName",
  ) as HTMLInputElement;
  const ballSpeedSelect = el.querySelector("#ballSpeed") as HTMLSelectElement;
  const ballRadiusSelect = el.querySelector("#ballRadius") as HTMLSelectElement;

  // トーナメント一覧を読み込む
  async function loadTournaments() {
    try {
      showLoading(tournamentsList);
      const tournaments = await fetchAllTournaments();

      if (tournaments.length === 0) {
        showInfo(tournamentsList, ERROR_MESSAGES.NO_TOURNAMENTS);
        return;
      }

      tournamentsList.innerHTML = tournaments
        .map((t: Tournament) => {
          const name = escapeHtml(t.name);
          const status = escapeHtml(getStatusLabel(t.status));
          const date = formatDate(t.createdAt);

          return `
            <div class="border border-gray-300 rounded p-4 hover:shadow-lg transition-shadow cursor-pointer" data-id="${t.id}">
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="text-xl font-semibold">${name}</h3>
                  <p class="text-sm text-gray-600">プレイヤー: ${t.currentPlayers}/${t.maxPlayers}</p>
                  <p class="text-sm text-gray-600">ステータス: ${status}</p>
                </div>
                <span class="text-xs text-gray-500">${date}</span>
              </div>
            </div>
          `;
        })
        .join("");

      // トーナメントカードのクリックイベントを追加
      tournamentsList.querySelectorAll("[data-id]").forEach((card) => {
        card.addEventListener("click", (e) => {
          e.preventDefault();
          const id = card.getAttribute("data-id");
          if (id) navigateTo(`/tournaments/${id}`);
        });
      });
    } catch (error) {
      showError(tournamentsList);
      console.error("Failed to load tournaments:", error);
    }
  }

  // モーダルをbody直下に生成
  createTournamentBtn.addEventListener("click", () => {
    const overlay = document.createElement("div");
    overlay.setAttribute(
      "class",
      "fixed inset-0 flex items-center justify-center",
    );
    overlay.style.backgroundColor = "rgba(0,0,0,0.8)";
    overlay.style.setProperty("backdrop-filter", "blur(4px)");
    overlay.style.zIndex = "9999";

    // モーダル本体を移動
    createModal.classList.remove("hidden");
    createModal.style.margin = "auto"; // モーダルを中央に配置
    createModal.style.position = "relative"; // モーダルの位置を調整
    createModal.style.maxWidth = "500px"; // モーダルの最大幅を設定
    createModal.style.width = "100%"; // モーダルの幅を設定
    overlay.appendChild(createModal);
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    const close = () => {
      if (overlay.parentElement) overlay.parentElement.removeChild(overlay);
      document.body.style.overflow = "";
    };

    cancelBtn.addEventListener("click", close);
    overlay.addEventListener("click", (ev) => {
      if (ev.target === overlay) close();
    });
    createBtn.addEventListener("click", async () => {
      const name = tournamentNameInput.value.trim();
      if (!name) {
        alert("トーナメント名を入力してください");
        return;
      }

      const gameOptions = {
        ballSpeed: Number(ballSpeedSelect.value),
        ballRadius: Number(ballRadiusSelect.value),
      };

      try {
        await createTournament(name, gameOptions);
        loadTournaments();
        close();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC;
        alert(`作成に失敗しました: ${errorMessage}`);
        console.error("Failed to create tournament:", error);
      }
    });
  });

  // 初期読み込み
  loadTournaments();

  return el;
}

const TournamentsComponent = componentFactory(createTournamentsPage());

export const Tournaments = pageFactory([TournamentsComponent]);
