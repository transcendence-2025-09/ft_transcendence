import { componentFactory } from "../factory/componentFactory";
import { pageFactory } from "../factory/pageFactory";

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
        <p class="text-gray-500">読み込み中...</p>
      </div>
    </div>

    <!-- 新規作成モーダル -->
    <div id="createModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div class="bg-white p-6 rounded-lg max-w-md w-full">
        <h2 class="text-2xl font-bold mb-4">トーナメント作成</h2>
        <input
          type="text"
          id="tournamentName"
          placeholder="トーナメント名"
          class="w-full border border-gray-300 rounded px-3 py-2 mb-4"
        >
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

  const tournamentsList = el.querySelector("#tournamentsList") as HTMLDivElement;
  const createTournamentBtn = el.querySelector("#createTournamentBtn") as HTMLButtonElement;
  const createModal = el.querySelector("#createModal") as HTMLDivElement;
  const createBtn = el.querySelector("#createBtn") as HTMLButtonElement;
  const cancelBtn = el.querySelector("#cancelBtn") as HTMLButtonElement;
  const tournamentNameInput = el.querySelector("#tournamentName") as HTMLInputElement;

  // トーナメント一覧取得
  async function loadTournaments() {
    try {
      const response = await fetch("/api/tournaments");
      const tournaments = await response.json();

      if (tournaments.length === 0) {
        tournamentsList.innerHTML = '<p class="text-gray-500">トーナメントがありません</p>';
        return;
      }

      tournamentsList.innerHTML = tournaments.map((t: any) => `
        <div class="border border-gray-300 rounded p-4 hover:shadow-lg transition-shadow cursor-pointer" data-id="${t.id}">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="text-xl font-semibold">${t.name}</h3>
              <p class="text-sm text-gray-600">プレイヤー: ${t.currentPlayers}/${t.maxPlayers}</p>
              <p class="text-sm text-gray-600">ステータス: ${getStatusLabel(t.status)}</p>
            </div>
            <span class="text-xs text-gray-500">${new Date(t.createdAt).toLocaleString()}</span>
          </div>
        </div>
      `).join('');

      // クリックイベント追加
      tournamentsList.querySelectorAll('[data-id]').forEach((card) => {
        card.addEventListener('click', () => {
          const id = card.getAttribute('data-id');
          window.location.href = `/tournaments/${id}`;
        });
      });
    } catch (error) {
      tournamentsList.innerHTML = '<p class="text-red-500">エラーが発生しました</p>';
      console.error('Failed to load tournaments:', error);
    }
  }

  function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      waiting: '待機中',
      ready: '準備完了',
      in_progress: '進行中',
      completed: '完了',
    };
    return labels[status] || status;
  }

  // モーダル表示
  createTournamentBtn.addEventListener('click', () => {
    createModal.classList.remove('hidden');
  });

  // モーダル非表示
  cancelBtn.addEventListener('click', () => {
    createModal.classList.add('hidden');
    tournamentNameInput.value = '';
  });

  // トーナメント作成
  createBtn.addEventListener('click', async () => {
    const name = tournamentNameInput.value.trim();
    if (!name) {
      alert('トーナメント名を入力してください');
      return;
    }

    try {
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        createModal.classList.add('hidden');
        tournamentNameInput.value = '';
        loadTournaments();
      } else {
        const error = await response.json();
        alert('作成に失敗しました: ' + error.error);
      }
    } catch (error) {
      alert('エラーが発生しました');
      console.error('Failed to create tournament:', error);
    }
  });

  // 初期読み込み
  loadTournaments();

  return el;
}

const TournamentsComponent = componentFactory(createTournamentsPage());

export const Tournaments = pageFactory([TournamentsComponent]);
