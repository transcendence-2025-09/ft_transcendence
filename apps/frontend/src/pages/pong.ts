import { pongBackGroundFactory } from "../components/pong/pongBackGround";
import { pongGame } from "../components/pong/pongGame";
import { pongHeader } from "../components/pong/pongHeader";
import { pongPlayerRow } from "../components/pong/pongPlayerRow";
import type { ElComponent } from "../factory/componentFactory";
import { pageFactory } from "../factory/pageFactory";
import type { RenderOption } from "../logic/pong/pongGame";
import { PongGame } from "../logic/pong/pongGame";
import type { RouteCtx } from "../routing/routeList";

//pong pageを積むためのbackground
const pongPageComp = (ctx?: RouteCtx): ElComponent => {
  const bg = pongBackGroundFactory();
  const content = bg.el.querySelector("#pong-container") as HTMLDivElement;

  const header = pongHeader();
  const playerLow = pongPlayerRow();
  const pong = pongGame();

  let gameInstance: PongGame | null = null;

  const opt: RenderOption | null = null;

  //path parameterからtournament, matchを特定する
  // const tournamentId = ctx.params.tournamentId;
  // const matchId = ctx.params.matchId;

  return {
    el: bg.el,
    mount(target, anchor = null) {
      bg.mount(target, anchor);
      header.mount(content);
      playerLow.mount(content);
      pong.mount(content);
      const canvas = pong.el as HTMLCanvasElement;
      gameInstance = new PongGame(canvas, opt, ctx);
      gameInstance.init();
      // gameInstance.registerKeyEvent();
      gameInstance.start();
    },
    unmount() {
      if (gameInstance) {
        gameInstance.stop();
      }
      gameInstance?.unregisterKeyEvent();
      gameInstance = null;
      pong.unmount();
      playerLow.unmount();
      header.unmount();
      bg.unmount();
    },
  };
};

export const pongPage = (ctx?: RouteCtx) => pageFactory([pongPageComp(ctx)]);
