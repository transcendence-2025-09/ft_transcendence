import { MATCH_ROUND } from "./constants";
import type { Match } from "./types";

export type TabType = "round1" | "finals" | "results";

/**
 * タブの状態管理クラス
 */
export class TabManager {
  private currentTab: TabType;
  private tabRound1: HTMLButtonElement;
  private tabFinals: HTMLButtonElement;
  private tabResults: HTMLButtonElement;

  constructor(
    initialTab: TabType,
    tabRound1: HTMLButtonElement,
    tabFinals: HTMLButtonElement,
    tabResults: HTMLButtonElement,
  ) {
    this.currentTab = initialTab;
    this.tabRound1 = tabRound1;
    this.tabFinals = tabFinals;
    this.tabResults = tabResults;
  }

  /**
   * 現在のタブを取得
   */
  getCurrentTab(): TabType {
    return this.currentTab;
  }

  /**
   * アクティブなタブを設定
   */
  setActiveTab(tab: TabType): void {
    this.currentTab = tab;

    const tabs = [
      { element: this.tabRound1, name: "round1" as const },
      { element: this.tabFinals, name: "finals" as const },
      { element: this.tabResults, name: "results" as const },
    ];

    tabs.forEach(({ element, name }) => {
      if (name === tab) {
        element.className =
          "px-8 py-3 font-semibold text-green-600 border-b-2 border-green-600 min-w-[140px] text-center";
      } else {
        element.className =
          "px-8 py-3 font-semibold text-gray-600 hover:text-green-600 min-w-[140px] text-center";
      }
    });
  }

  /**
   * タブの有効/無効状態を更新
   * @returns セミファイナル完了時に自動切り替えが必要な場合true
   */
  updateTabStates(matches: Match[]): "finals" | "results" | null {
    const semifinals = matches.filter(
      (m) => m.round === MATCH_ROUND.SEMIFINALS,
    );
    const finals = matches.filter(
      (m) =>
        m.round === MATCH_ROUND.FINALS || m.round === MATCH_ROUND.THIRD_PLACE,
    );

    const semifinalsCompleted = semifinals.every(
      (m) => m.status === "completed",
    );
    const finalsCompleted = finals.every((m) => m.status === "completed");

    // セミファイナル完了 → Finalsタブ有効化
    if (semifinalsCompleted && semifinals.length === 2) {
      this.tabFinals.disabled = false;
      this.tabFinals.className =
        "px-8 py-3 font-semibold text-gray-600 hover:text-green-600 min-w-[140px] text-center";
    }

    // ファイナル完了 → Resultsタブ有効化
    if (finalsCompleted && finals.length > 0) {
      this.tabResults.disabled = false;
      this.tabResults.className =
        "px-8 py-3 font-semibold text-gray-600 hover:text-green-600 min-w-[140px] text-center";

      // 決勝完了時、決勝タブにいる場合は結果タブに自動切り替え
      if (this.currentTab === "finals") {
        return "results";
      }
    }

    // セミファイナル完了時、セミファイナルタブにいる場合は決勝タブに自動切り替え
    if (
      semifinalsCompleted &&
      semifinals.length === 2 &&
      this.currentTab === "round1"
    ) {
      return "finals";
    }

    return null;
  }

  /**
   * Finalsタブが無効かどうか
   */
  isFinalsDisabled(): boolean {
    return this.tabFinals.disabled;
  }

  /**
   * Resultsタブが無効かどうか
   */
  isResultsDisabled(): boolean {
    return this.tabResults.disabled;
  }
}
