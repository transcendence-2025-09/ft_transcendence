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

  // DOM要素の取得
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

  // ===================
  // トーナメント操作
  // ===================

  /** トーナメントカードのHTMLを生成 */
  function createTournamentCardHtml(tournament: Tournament): string {
    const name = escapeHtml(tournament.name);
    const status = escapeHtml(getStatusLabel(tournament.status));
    const date = formatDate(tournament.createdAt);

    return `
      <div class="border border-gray-300 rounded p-4 hover:shadow-lg transition-shadow cursor-pointer" data-id="${tournament.id}">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-xl font-semibold">${name}</h3>
            <p class="text-sm text-gray-600">プレイヤー: ${tournament.currentPlayers}/${tournament.maxPlayers}</p>
            <p class="text-sm text-gray-600">ステータス: ${status}</p>
          </div>
          <span class="text-xs text-gray-500">${date}</span>
        </div>
      </div>
    `;
  }

  /** トーナメント一覧を描画し、クリックイベントを設定 */
  function renderTournamentsList(tournaments: Tournament[]): void {
    if (tournaments.length === 0) {
      showInfo(tournamentsList, ERROR_MESSAGES.NO_TOURNAMENTS);
      return;
    }

    tournamentsList.innerHTML = tournaments
      .map((t) => createTournamentCardHtml(t))
      .join("");

    tournamentsList.querySelectorAll("[data-id]").forEach((card) => {
      card.addEventListener("click", (e) => {
        e.preventDefault();
        const id = card.getAttribute("data-id");
        if (id) navigateTo(`/tournaments/${id}`);
      });
    });
  }

  /** トーナメント一覧を読み込む（初回読み込み用） */
  async function loadTournaments(): Promise<void> {
    try {
      showLoading(tournamentsList);
      const tournaments = await fetchAllTournaments();
      renderTournamentsList(tournaments);
    } catch (error) {
      showError(tournamentsList);
      console.error("Failed to load tournaments:", error);
    }
  }

  /** トーナメント一覧を更新（ポーリング用） */
  async function refreshTournamentsList(): Promise<void> {
    try {
      const tournaments = await fetchAllTournaments();
      renderTournamentsList(tournaments);
    } catch (error) {
      console.error("トーナメント一覧の更新に失敗しました:", error);
    }
  }

  /** トーナメント作成処理 */
  async function handleCreateTournament(): Promise<void> {
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
      const createdTournament = await fetchAllTournaments();
      const newTournament = createdTournament.find((t) => t.name === name);
      if (newTournament) {
        navigateTo(`/tournaments/${newTournament.id}`);
      } else {
        console.error("作成したトーナメントが見つかりませんでした");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC;
      alert(`作成に失敗しました: ${errorMessage}`);
      console.error("Failed to create tournament:", error);
    }
  }

  // ===================
  // モーダル関連
  // ===================

  /** モーダルを開く */
  function openModal(): void {
    const overlay = document.createElement("div");
    overlay.setAttribute(
      "class",
      "fixed inset-0 flex items-center justify-center",
    );
    overlay.style.backgroundColor = "rgba(0,0,0,0.8)";
    overlay.style.setProperty("backdrop-filter", "blur(4px)");
    overlay.style.zIndex = "9999";

    createModal.classList.remove("hidden");
    createModal.style.margin = "auto";
    createModal.style.position = "relative";
    createModal.style.maxWidth = "500px";
    createModal.style.width = "100%";
    overlay.appendChild(createModal);
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    const closeModal = () => {
      if (overlay.parentElement) overlay.parentElement.removeChild(overlay);
      document.body.style.overflow = "";
    };

    cancelBtn.addEventListener("click", closeModal);
    overlay.addEventListener("click", (ev) => {
      if (ev.target === overlay) closeModal();
    });
    createBtn.addEventListener("click", () => handleCreateTournament());
  }

  // ===================
  // イベントリスナー設定
  // ===================

  createTournamentBtn.addEventListener("click", openModal);

  // ===================
  // 自動更新（ポーリング）
  // ===================

  const autoRefreshInterval = window.setInterval(() => {
    refreshTournamentsList();
  }, 5000);

  // ===================
  // 初期化・クリーンアップ
  // ===================

  loadTournaments();

  const component = componentFactory(el);
  const originalUnmount = component.unmount;
  component.unmount = () => {
    clearInterval(autoRefreshInterval);
    originalUnmount();
  };

  return component;
}

export function Tournaments() {
  const component = createTournamentsPage();
  return pageFactory([component]);
}
