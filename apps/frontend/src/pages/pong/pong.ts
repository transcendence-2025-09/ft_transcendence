import {
  type PongPlayerRowComponent,
  pongBackGroundFactory,
  pongGame,
  pongHeader,
  pongPlayerRow,
} from "@/components/pong";
import { type ElComponent, pageFactory } from "@/factory";
import type { Match } from "@transcendence/shared";
import type { RouteCtx } from "@/routing";
import { PongGame } from "./logic/pongGame";

const pongPageComp = (ctx?: RouteCtx): ElComponent => {
  const bg = pongBackGroundFactory();
  const content = bg.el.querySelector("#pong-container") as HTMLDivElement;

  const header = pongHeader();
  const playerLow = pongPlayerRow() as PongPlayerRowComponent;
  const pong = pongGame();

  let gameInstance: PongGame | null = null;

  //すでにできているマッチ情報を取得して、PongGameの初期化に使う
  const getMatchInfo = async (): Promise<Match | null> => {
    const tournamentId = ctx?.params.tournamentId;
    const matchId = ctx?.params.matchId;
    console.log(`tournamentId: ${tournamentId}`);
    console.log(`matchId: ${matchId}`);
    if (!tournamentId || !matchId) {
      console.log("not get match id or tournament Id");
      return null;
    }
    const res = await fetch(
      `/api/tournaments/${tournamentId}/matches/${matchId}`,
      {
        method: "GET",
      },
    );
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error("Failed to get tournament info");
    }
    const data = await res.json();
    return data.match;
  };

  return {
    el: bg.el,
    mount(target, anchor = null) {
      //canvasの作成と、header, playerLow, pongのマウント
      bg.mount(target, anchor);
      header.mount(content);
      playerLow.mount(content);
      pong.mount(content);

      //非同期でマッチ情報を取得し、ゲームを初期化して開始
      void (async () => {
        const match = await getMatchInfo();
        if (!match) return;
        const leftPlayerName: string = match.leftPlayer.alias ?? "Left Player";
        const rightPlayerName: string =
          match.rightPlayer.alias ?? "Right Player";
        playerLow.setNames(leftPlayerName, rightPlayerName);

        const canvas = pong.el as HTMLCanvasElement;
        gameInstance = new PongGame(canvas, ctx, match);

        await gameInstance.init().then(() => {
          gameInstance?.start();
        });
      })();
    },
    unmount() {
      //ゲームの停止とキーイベントの登録解除、各コンポーネントのアンマウント
      if (gameInstance) {
        gameInstance.stop();
      }
      gameInstance = null;
      pong.unmount();
      playerLow.unmount();
      header.unmount();
      bg.unmount();
    },
  };
};
export const pongPage = (ctx?: RouteCtx) => pageFactory([pongPageComp(ctx)]);
