import {
  type UserStatsResponse,
  UserStatsResponseSchema,
} from "@transcendence/shared";
import type { ElComponent } from "../factory/componentFactory";
import { componentFactory } from "../factory/componentFactory";

const renderOverview = (stats: UserStatsResponse | null) => {
  if (!stats) return '<p class="text-gray-500 italic p-4">有効な試合データがありません</p>';
  
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
  if (!stats) return '<p class="text-gray-500 italic p-4">有効な試合データがありません</p>';
  
  return `
    <div class="p-4">
      <p class="text-gray-500">試合履歴は実装中です...</p>
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
  const res = await fetch("/api/user/me", {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Unauthorized");
  const data = await res.json();

  // fetch stats
  const userStatsRes = await fetch(`/api/user-stats/${data.id}`, {
    method: "POST",
    credentials: "include",
  });

  let stats: UserStatsResponse | null = null;
  if (userStatsRes.ok) {
    const statsJson = await userStatsRes.json().catch(() => null);
    if (statsJson) {
      const parsed = UserStatsResponseSchema.safeParse(statsJson);
      if (parsed.success) stats = parsed.data;
      else console.warn("user-stats validation failed", parsed.error);
    }
  }

  const el = document.createElement("div");
  
  el.innerHTML = `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold mb-2">Dashboard</h1>
          <p class="text-xl text-gray-600">Welcome, ${data.name ?? "User"}!</p>
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
            ${renderOverview(stats)}
          </div>
          <div id="matches" class="tab-content hidden">
            ${renderMatches(stats)}
          </div>
          <div id="settings" class="tab-content hidden">
            ${renderSettings()}
          </div>
        </div>
      </div>
    </div>
  `;

  // タブ切り替えの実装
  const tabs = el.querySelectorAll('.tab-btn');
  const contents = el.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      
      // タブボタンのスタイル更新
      tabs.forEach(t => {
        if (t === tab) {
          t.classList.add('border-blue-500', 'text-blue-600');
          t.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
        } else {
          t.classList.remove('border-blue-500', 'text-blue-600');
          t.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
        }
      });

      // コンテンツの表示/非表示
      contents.forEach(content => {
        if (content.id === target) {
          content.classList.remove('hidden');
        } else {
          content.classList.add('hidden');
        }
      });
    });
  });

  return componentFactory(el);
};
