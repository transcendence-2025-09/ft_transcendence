//このクラスではpong gameのゲームそのもののデータ・状況を管理する。
//このクラスでは誰がプレイヤーかなどは管理しない。あくまでその時のゲームのデータ・状況のみ

import type {
  Match,
  Player,
  // MatchRound,
  // MatchStatus,
} from "../../pages/tournaments/types";
import { navigateTo } from "../../pages/tournaments/utils";
import type { RouteCtx } from "../../routing/routeList";

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

export class PongGame {
  //基本定数(固定値)
  private width: number;
  private height: number;
  private paddleWidth: number;
  private paddleHeight: number;
  private paddleMargin: number;
  private paddleSpeed: number;
  private ballRadius: number;
  private ballSpeed: number;
  private ballAccel: number;
  private ballMaxSpeed: number;
  //状態データ
  private ballX: number;
  private ballY: number;
  private ballVelX: number;
  private ballVelY: number;
  private paddleLeftY: number;
  private paddleRightY: number;
  private leftScore: number;
  private rightScore: number;
  private leftInput: { up: boolean; down: boolean };
  private rightInput: { up: boolean; down: boolean };
  private winScore: number;
  private isFinish: boolean;
  //制御データ
  private canvas: HTMLCanvasElement;
  private isRunning: boolean;
  private isPaused: boolean;
  private animationId: number | null;
  private lastScored: "left" | "right" | null;
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
    this.paddleSpeed = opt?.paddleSpeed ?? 3;
    this.ballRadius = opt?.ballRadius ?? 12;
    this.ballSpeed = opt?.ballSpeed ?? 3;
    this.ballAccel = opt?.ballAccel ?? 1.03;
    this.ballMaxSpeed = 8;
    this.ballX = this.width / 2;
    this.ballY = this.height / 2;
    this.ballVelX = 0;
    this.ballVelY = 0;
    this.paddleLeftY = (this.height - this.paddleHeight) / 2;
    this.paddleRightY = (this.height - this.paddleHeight) / 2;
    this.leftScore = 0;
    this.rightScore = 0;
    this.leftInput = { up: false, down: false };
    this.rightInput = { up: false, down: false };
    this.winScore = opt?.winScore ?? 5;
    this.isFinish = false;
    this.canvas = canvas;
    this.isRunning = false;
    this.isPaused = false;
    this.animationId = null;
    this.lastScored = null;
    this.spaceDown = false;
    this.tournamentId = ctx?.params.tournamentId ?? null;
    this.matchId = ctx?.params.matchId ?? null;
    // this.round = null;
    this.leftPlayer = null;
    this.rightPlayer = null;
    // this.status = null;
  }

  public init = async () => {
    const match = await this.getMatchInfo();
    this.leftPlayer = match?.player1 ?? null;
    this.rightPlayer = match?.player2 ?? null;
    // this.round = match?.round ?? null;
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
    const match: Match = await res.json();
    return match;
  };

  public start = (): void => {
    if (this.isRunning) return;
    this.isRunning = false;
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

  public loop = (): void => {
    if (this.isPaused) {
      this.render();
    } else {
      this.update();
      this.render();
    }
    this.animationId = requestAnimationFrame(this.loop);
  };

  private getWinner = () => {
    if (this.lastScored === "left") return this.leftPlayer;
    else if (this.lastScored === "right") return this.rightPlayer;
    else return null;
  };

  private finishGame = async (): Promise<void> => {
    const winId = this.getWinner()?.userId;

    const res = await fetch(
      `/api/tournaments/${this.tournamentId}/matches/${this.matchId}/result`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          winnerId: winId,
          score: {
            player1: this.leftScore,
            player2: this.rightScore,
          },
        }),
      },
    );

    this.isFinish = true;
    if (!res.ok) {
      throw new Error("Failed to post result");
    }
    this.render();
  };

  public update = (): void => {
    if (this.leftInput.up) this.paddleLeftY -= this.paddleSpeed;
    if (this.leftInput.down) this.paddleLeftY += this.paddleSpeed;
    if (this.rightInput.up) this.paddleRightY -= this.paddleSpeed;
    if (this.rightInput.down) this.paddleRightY += this.paddleSpeed;

    this.paddleLeftY = Math.max(
      0,
      Math.min(this.paddleLeftY, this.height - this.paddleHeight),
    );

    this.paddleRightY = Math.max(
      0,
      Math.min(this.paddleRightY, this.height - this.paddleHeight),
    );

    this.ballX += this.ballVelX;
    this.ballY += this.ballVelY;

    if (
      this.ballY - this.ballRadius <= 0 ||
      this.ballY + this.ballRadius >= this.height
    )
      this.ballVelY *= -1;

    //左パドルの当たり判定
    //ボールの左側の座標が左パドルの右側面の座標よりも小さくなったら反射している
    //paddleの右サイドの座標
    const lpRightSide = this.paddleMargin + this.paddleWidth;
    if (
      this.ballX - this.ballRadius <= lpRightSide &&
      this.ballY >= this.paddleLeftY &&
      this.ballY <= this.paddleLeftY + this.paddleHeight
    ) {
      //めり込み処理。lpRightSideにボールの半径分だけx座標を足しておく
      this.ballX = lpRightSide + this.ballRadius;
      //速度ベクトルの向きを更新
      this.ballVelX = Math.abs(this.ballVelX);
      //ボールを加速
      this.boostBallSpeed();
    }

    //右パドルの当たり判定
    //左とロジックは同じ(右向き)
    const rpLeftSide = this.width - this.paddleMargin - this.paddleWidth;
    if (
      this.ballX + this.ballRadius >= rpLeftSide &&
      this.ballY >= this.paddleRightY &&
      this.ballY <= this.paddleRightY + this.paddleHeight
    ) {
      //めり込み処理
      this.ballX = rpLeftSide - this.ballRadius;
      //速度ベクトルの変更(左向きに)
      this.ballVelX = -Math.abs(this.ballVelX);
      //ボールを加速
      this.boostBallSpeed();
    }

    //得点処理
    if (this.ballX + this.ballRadius < 0) {
      this.rightScore += 1;
      this.lastScored = "right";
    } else if (this.ballX + this.ballRadius > this.width) {
      this.leftScore += 1;
      this.lastScored = "left";
    }
    //試合終了かどうかを判断
    if (this.rightScore === this.winScore || this.leftScore === this.winScore) {
      this.finishGame();
    } else {
      this.serveFrom();
    }
  };

  private boostBallSpeed = (): void => {
    const vx = this.ballVelX;
    const vy = this.ballVelY;
    const speed = Math.hypot(vx, vy);
    if (speed === 0) return;
    const newSpeed = Math.min(this.ballMaxSpeed, speed * this.ballAccel);

    const nx = vx / speed;
    const ny = vy / speed;

    this.ballVelX = nx * newSpeed;
    this.ballVelY = ny * newSpeed;
  };

  public serveFrom = (): void => {
    this.ballX = this.width / 2;
    this.ballY = this.height / 2;
    this.ballVelX = 0;
    this.ballVelY = 0;
    this.isRunning = false;
  };

  public registerKeyEvent = (): void => {
    if (this.onKeyUpRef || this.onKeyDownRef) return;

    this.onKeyDownRef = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW":
          this.leftInput.up = true;
          e.preventDefault();
          break;
        case "KeyS":
          this.leftInput.down = true;
          e.preventDefault();
          break;
        case "ArrowUp":
          this.rightInput.up = true;
          e.preventDefault();
          break;
        case "ArrowDown":
          this.rightInput.down = true;
          e.preventDefault();
          break;
        case "Space":
          if (!this.spaceDown) {
            this.spaceDown = true;
            this.handleSpace();
          }
          e.preventDefault();
          break;
      }
    };

    this.onKeyUpRef = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW":
          this.leftInput.up = false;
          break;
        case "KeyS":
          this.leftInput.down = false;
          break;
        case "ArrowUp":
          this.rightInput.up = false;
          break;
        case "ArrowDown":
          this.rightInput.down = false;
          break;
        case "Space":
          this.spaceDown = false;
          break;
      }
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
      navigateTo("/");
    }
    if (this.isRunning) {
      this.isPaused = !this.isPaused;
      this.render();
      return;
    }

    const dirX =
      this.lastScored === "left"
        ? -1
        : this.lastScored === "right"
          ? 1
          : Math.random() < 0.5
            ? 1
            : -1;

    const dirY = Math.random() < 0.5 ? 1 : -1;
    this.ballVelX = dirX * this.ballSpeed;
    this.ballVelY = dirY * this.ballSpeed;

    this.isPaused = false;
    this.isRunning = true;
    if (this.animationId === null)
      this.animationId = requestAnimationFrame(this.loop);
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
    if (this.isPaused) {
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
      ctx.font = "bold 48px ui-sans-serif, system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Winner", width / 2, height / 2);
      ctx.fillText(`${this.getWinner()?.alias}`, width / 2, height / 2);
      ctx.fillText("Press Space", width / 2, height / 2);
      ctx.restore();
    }
  };
}
