import {
  type UserStatsResponse,
  UserStatsResponseSchema,
} from "@transcendence/shared";
import type { ElComponent } from "../factory/componentFactory";
import { componentFactory } from "../factory/componentFactory";

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
    method: "GET",
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
  const statsHtml = stats
    ? `
			<p>平均獲得点数: ${stats.average_score}</p>
			<p>試合数: ${stats.number_of_matches}</p>
			<p>勝利数: ${stats.number_of_wins}</p>
			<p>連勝数: ${stats.current_winning_streak}</p>
			<p>合計獲得点数: ${stats.total_score_points}</p>
			<p>合計失点数: ${stats.total_loss_points}</p>
		`
    : `<p>有効な試合データがありません</p>`;

  el.innerHTML = `
		<h1>dashboard</h1>
		<p>Welcome, ${data.name ?? "User"}!</p>
		${statsHtml}
		<a href="/tournaments" class="inline-block mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
			トーナメント一覧
		</a>
		<a href="/settings/2fa" class="inline-block mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
			2FA設定
		</a>
	`;

  return componentFactory(el);
};
