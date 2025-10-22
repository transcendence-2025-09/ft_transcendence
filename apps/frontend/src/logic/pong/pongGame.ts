//このクラスはあくまで描画の管理のみ。データの変更などはAPIを通じて行う.
//
// import WebSocket from "ws";
import type {
  Match,
  Player,
  // MatchRound,
  // MatchStatus,
} from "../../pages/tournaments/types";
import { navigateTo } from "../../pages/tournaments/utils";
import type { RouteCtx } from "../../routing/routeList";
import type { MatchData, MatchResult, MatchState, WsMessage } from "./types";

export type RenderOption = {
  paddleWidth: number;
  paddleHeight: number;
  paddleMargin: number;
  paddleSpeed: number;
  ballRadius: number;
  ballSpeed: number;
  ballAccel: number;
  winScore: number;
};

//あとで環境変数として登録しておく？
// const URL = "ws://localhost:3001";

export class PongGame {
  //基本定数(固定値)
  private width: number;
  private height: number;
  private paddleWidth: number;
  private paddleHeight: number;
  private paddleMargin: number;
  // private paddleSpeed: number;
  private ballRadius: number;
  private ballSpeed: number;
  private ballAccel: number;
  // private ballMaxSpeed: number;
  //状態データ
  private ballX: number;
  private ballY: number;
  // private ballVelX: number;
  // private ballVelY: number;
  private paddleLeftY: number;
  private paddleRightY: number;
  private leftScore: number;
  private rightScore: number;
  private leftInput: { up: boolean; down: boolean };
  private rightInput: { up: boolean; down: boolean };
  private winScore: number;
  private winnerId: string | null;
  private isFinish: boolean;
  //制御データ
  private canvas: HTMLCanvasElement;
  private isRunning: boolean;
  private isPaused: boolean;
  private animationId: number | null;
  // private lastScored: "left" | "right" | null;
  //key管理関係
  private onKeyDownRef?: (e: KeyboardEvent) => void;
  private onKeyUpRef?: (e: KeyboardEvent) => void;
  private spaceDown: boolean;
  //試合に関する情報
  private tournamentId: string | null;
  private matchId: string | null;
  //APIから取得するデータ
  // private round: MatchRound | null;
  private leftPlayer: Player | null;
  private rightPlayer: Player | null;
  // private status: MatchStatus | null;
  private ws: WebSocket;
  private finishTime: number | null;
  private redirectDelay: number;

  constructor(
    canvas: HTMLCanvasElement,
    opt?: RenderOption | null,
    ctx?: RouteCtx | null,
  ) {
    this.width = canvas.width;
    this.height = canvas.height;
    this.paddleWidth = opt?.paddleWidth ?? 12;
    this.paddleHeight = opt?.paddleHeight ?? 110;
    this.paddleMargin = opt?.paddleMargin ?? 24;
    // this.paddleSpeed = opt?.paddleSpeed ?? 3;
    this.ballRadius = opt?.ballRadius ?? 12;
    this.ballSpeed = opt?.ballSpeed ?? 3;
    this.ballAccel = opt?.ballAccel ?? 1.03;
    // this.ballMaxSpeed = 8;
    this.ballX = this.width / 2;
    this.ballY = this.height / 2;
    // this.ballVelX = 0;
    // this.ballVelY = 0;
    this.paddleLeftY = (this.height - this.paddleHeight) / 2;
    this.paddleRightY = (this.height - this.paddleHeight) / 2;
    this.leftScore = 0;
    this.rightScore = 0;
    this.leftInput = { up: false, down: false };
    this.rightInput = { up: false, down: false };
    this.winScore = opt?.winScore ?? 1;
    this.isFinish = false;
    this.canvas = canvas;
    this.isRunning = false;
    this.isPaused = false;
    this.animationId = null;
    // this.lastScored = null;
    this.spaceDown = false;
    this.tournamentId = ctx?.params.tournamentId ?? null;
    this.matchId = ctx?.params.matchId ?? null;
    // this.round = null;
    this.leftPlayer = null;
    this.rightPlayer = null;
    // this.status = null;
    this.ws = new WebSocket("ws://localhost:3001/ws");
    this.winnerId = null;
    //試合終了の時間
    this.finishTime = null;
    //試合終了後の画面遷移時間
    this.redirectDelay = 5000;
  }

  public init = async () => {
    // let match;
    // if (this.tournamentId && this.matchId) {
    //   match = await this.getMatchInfo();
    // } else {
    //   match = null;
    // }
    const match = await this.getMatchInfo();
    this.leftPlayer = match?.leftPlayer ?? null;
    this.rightPlayer = match?.rightPlayer ?? null;
    this.ballSpeed = match?.gameOptions?.ballSpeed ?? 3;
    this.ballRadius = match?.gameOptions?.ballRadius ?? 12;
    this.ws.onopen = (): void => {
      this.ws.send(
        JSON.stringify({
          type: "Connect successfully!!",
        }),
      );
      console.log("Connection Success!!");
      //初期情報をgame serverに対して送信しておく
      this.ws.send(
        JSON.stringify({
          type: "init",
          payload: {
            width: this.width,
            height: this.height,
            paddleWidth: this.paddleWidth,
            paddleHeight: this.paddleHeight,
            paddleMargin: this.paddleMargin,
            ballRadius: this.ballRadius,
            ballSpeed: this.ballSpeed,
            ballAccel: this.ballAccel,
            winScore: this.winScore,
            tournamentId: this.tournamentId,
            matchId: this.matchId,
            leftPlayer: this.leftPlayer,
            rightPlayer: this.rightPlayer,
          } as MatchData,
        }),
      );
    };
    this.ws.onmessage = (event) => {
      try {
        const data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        this.onReceive(data as WsMessage);
      } catch (e) {
        console.error("WS parse error:", e, event.data);
      }
    };
    //closeの処理
    this.ws.onclose = () => {
      console.log("Connection Closed");
    };

    //一応エラーの処理も書いておく
    this.ws.onerror = (e) => console.error("WS error", e);
  };

  private getMatchInfo = async (): Promise<Match | null> => {
    if (!this.tournamentId || !this.matchId) return null;
    const res = await fetch(
      `/api/tournaments/${this.tournamentId}/matches/${this.matchId}`,
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

  public start = (): void => {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.loop();
  };

  public stop = async (): Promise<void> => {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  };

  private onReceive = (data: WsMessage): void => {
    switch (data.type) {
      case "snapshot":
        this.updateState(data.payload as MatchState);
        break;
      case "result":
        this.finishGame(data.payload as MatchResult);
        break;
    }
  };

  private finishGame = (data: MatchResult): void => {
    this.leftScore = data.leftScore;
    this.rightScore = data.rightScore;
    this.winnerId = data.winnerId;
    //isFinishフラグを上げる。
    this.isFinish = data.isFinish;
    //終了時間を記録
    this.finishTime = performance.now();
    //一旦ルートへ
    setTimeout(() => {
      navigateTo(`/tournaments/${this.tournamentId}/matches`);
    }, this.redirectDelay);
  };

  private updateState = (data: MatchState): void => {
    this.ballX = data.ballX;
    this.ballY = data.ballY;
    // this.ballVelX = data.ballVelX;
    // this.ballVelY = data.ballVelY;
    this.paddleLeftY = data.paddleLeftY;
    this.paddleRightY = data.paddleRightY;
    this.leftScore = data.leftScore;
    this.rightScore = data.rightScore;
    this.isFinish = data.isFinish;
    this.isRunning = data.isRunning;
    this.isPaused = data.isPaused;
    // this.lastScored = data.lastScored;
  };

  public loop = (): void => {
    this.render();
    this.animationId = requestAnimationFrame(this.loop);
  };

  public registerKeyEvent = (): void => {
    if (this.onKeyUpRef || this.onKeyDownRef) return;
    let keyflag = false;

    this.onKeyDownRef = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW":
          this.leftInput.up = true;
          keyflag = true;
          e.preventDefault();
          break;
        case "KeyS":
          this.leftInput.down = true;
          keyflag = true;
          e.preventDefault();
          break;
        case "ArrowUp":
          this.rightInput.up = true;
          keyflag = true;
          e.preventDefault();
          break;
        case "ArrowDown":
          this.rightInput.down = true;
          keyflag = true;
          e.preventDefault();
          break;
        case "Space":
          keyflag = true;
          if (!this.spaceDown) {
            this.spaceDown = true;
            this.handleSpace();
          }
          e.preventDefault();
          break;
      }
      if (keyflag)
        this.ws.send(
          JSON.stringify({
            type: "input",
            payload: {
              leftup: this.leftInput.up,
              leftdown: this.leftInput.down,
              rightup: this.rightInput.up,
              rightdown: this.rightInput.down,
            },
          }),
        );
    };

    this.onKeyUpRef = (e: KeyboardEvent) => {
      let keyflag = false;
      switch (e.code) {
        case "KeyW":
          this.leftInput.up = false;
          keyflag = true;
          break;
        case "KeyS":
          this.leftInput.down = false;
          keyflag = true;
          break;
        case "ArrowUp":
          this.rightInput.up = false;
          keyflag = true;
          break;
        case "ArrowDown":
          this.rightInput.down = false;
          keyflag = true;
          break;
        case "Space":
          this.spaceDown = false;
          keyflag = true;
          break;
      }
      if (keyflag)
        this.ws.send(
          JSON.stringify({
            type: "input",
            payload: {
              leftup: this.leftInput.up,
              leftdown: this.leftInput.down,
              rightup: this.rightInput.up,
              rightdown: this.rightInput.down,
            },
          }),
        );
    };

    window.addEventListener("keydown", this.onKeyDownRef, { passive: false });
    window.addEventListener("keyup", this.onKeyUpRef, { passive: true });
  };

  public unregisterKeyEvent = (): void => {
    if (this.onKeyDownRef)
      window.removeEventListener("keydown", this.onKeyDownRef);
    if (this.onKeyUpRef) window.removeEventListener("keyup", this.onKeyUpRef);
    this.onKeyDownRef = undefined;
    this.onKeyUpRef = undefined;

    this.leftInput.up = this.leftInput.down = false;
    this.rightInput.up = this.rightInput.down = false;
  };

  private handleSpace = (): void => {
    if (this.isFinish) {
      navigateTo(`/tournaments/${this.tournamentId}/matches`);
    }
    if (this.ws && this.ws.readyState === this.ws.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "pause",
        }),
      );
    } else {
      console.warn("WS not open. drop:");
    }
    //spaceは状況の変更は特にせずに送る。
  };

  public render = (): void => {
    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;
    const width = this.width;
    const height = this.height;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);

    //枠線
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, width - 4, height - 4);

    //中央線
    //最初に線の色と幅を決める。
    ctx.strokeStyle = "#11632F";
    ctx.lineWidth = 2;
    //描画する線の長さと
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(
      this.paddleMargin,
      this.paddleLeftY,
      this.paddleWidth,
      this.paddleHeight,
    );
    ctx.fillRect(
      this.width - this.paddleMargin - this.paddleWidth,
      this.paddleRightY,
      this.paddleWidth,
      this.paddleHeight,
    );
    ctx.beginPath();
    ctx.arc(this.ballX, this.ballY, this.ballRadius, 0, Math.PI * 2);
    ctx.fill();

    //scoreの描画
    ctx.save();
    ctx.fillStyle = "#22c553";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font =
      "bold 28px ui-sans-serif, system-ui, --apple-system, Segoe UI, Roboto";

    ctx.fillText(String(this.leftScore), width * 0.25, 16);
    ctx.fillText(String(this.rightScore), width * 0.75, 16);
    ctx.restore();

    //Pause画面用のウィンドウ
    if (this.isPaused && !this.isFinish) {
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 48px ui-sans-serif, system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("PAUSED", width / 2, height / 2);
      ctx.restore();
    }

    if (this.isFinish) {
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const titleFont = "bold 48px ui-sans-serif, system-ui";
      const bodyFont = "bold 36px ui-sans-serif, system-ui";
      const smallFont = "bold 24px ui-sans-serif, system-ui";
      const lineGap = 16;

      const titleSize = 48;
      const bodySize = 36;
      const smallSize = 24;

      const totalHeight = titleSize + bodySize + smallSize + lineGap * 2;
      const centerY = height / 2;
      let y = centerY - totalHeight / 2;

      // 1行目: タイトル
      ctx.font = titleFont;
      ctx.fillText("Winner", width / 2, y + titleSize / 2);
      y += titleSize + lineGap;

      // 2行目: Winner ID
      ctx.font = bodyFont;
      ctx.fillText(String(this.winnerId ?? ""), width / 2, y + bodySize / 2);
      y += bodySize + lineGap;

      // 3行目: カウントダウン表示
      if (this.finishTime) {
        const elapsed = performance.now() - this.finishTime;
        const remaining = Math.max(0, this.redirectDelay - elapsed);
        const seconds = Math.ceil(remaining / 1000);
        ctx.font = smallFont;
        ctx.fillStyle = "#aaa";
        ctx.fillText(
          `Returning in ${seconds}s...`,
          width / 2,
          y + smallSize / 2,
        );
      }

      ctx.restore();
    }
  };
}
