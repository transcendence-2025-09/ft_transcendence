import { MATCH_ROUND } from "./constants";
import type { Match } from "@transcendence/shared";

export type TabType = "round1" | "finals" | "results";

/** タブのCSSクラス */
const TAB_CLASS = {
  ACTIVE:
    "px-8 py-3 font-semibold text-green-600 border-b-2 border-green-600 min-w-[140px] text-center",
  INACTIVE:
    "px-8 py-3 font-semibold text-gray-600 hover:text-green-600 min-w-[140px] text-center",
} as const;

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
      element.className = name === tab ? TAB_CLASS.ACTIVE : TAB_CLASS.INACTIVE;
    });
  }

  /**
   * タブの有効/無効状態を更新
   * @returns 自動切り替えが必要なタブ、またはnull
   */
  updateTabStates(matches: Match[]): "finals" | "results" | null {
    const semifinals = matches.filter(
      (m) => m.round === MATCH_ROUND.SEMIFINALS,
    );
    const finals = matches.filter(
      (m) =>
        m.round === MATCH_ROUND.FINALS || m.round === MATCH_ROUND.THIRD_PLACE,
    );

    const semifinalsCompleted =
      semifinals.length === 2 &&
      semifinals.every((m) => m.status === "completed");
    const finalsCompleted =
      finals.length > 0 && finals.every((m) => m.status === "completed");

    // セミファイナル完了 → Finalsタブ有効化
    if (semifinalsCompleted) {
      this.tabFinals.disabled = false;
      this.tabFinals.className = TAB_CLASS.INACTIVE;
    }

    // ファイナル完了 → Resultsタブ有効化
    if (finalsCompleted) {
      this.tabResults.disabled = false;
      this.tabResults.className = TAB_CLASS.INACTIVE;
    }

    // 自動遷移ロジック: 結果タブにいる場合は遷移しない
    if (this.currentTab === "results") {
      return null;
    }

    // 決勝完了 → 結果タブへ
    if (finalsCompleted) {
      return "results";
    }

    // セミファイナル完了 & まだround1タブにいる → 決勝タブへ
    if (semifinalsCompleted && this.currentTab === "round1") {
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
