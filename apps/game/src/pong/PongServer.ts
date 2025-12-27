// PongServer.ts
import { randomUUID } from "crypto";
import type {
  MatchData,
  MatchResult,
  MatchState,
  Player,
  PlayerInput,
  WsMessage,
} from "src/types/pong";
import type { WebSocket } from "ws";
import { internalApiClient } from "../utils/internalApiClient.js";

export class PongServer {
  // 通信
  private clients = new Set<WebSocket>();
  private initialize = false;
  // private isReady = false;
  private isLeftReady = false;
  private isRightReady = false;

  // 基本定数
  private width = 0;
  private height = 0;
  private paddleWidth = 12;
  private paddleHeight = 110;
  private paddleMargin = 24;
  private paddleSpeed = 3;
  private ballRadius = 12;
  private ballSpeed = 3;
  private ballAccel = 1.03;
  private ballMaxSpeed = 8;

  // 状態
  private ballX = 0;
  private ballY = 0;
  private ballVelX = 0;
  private ballVelY = 0;
  private paddleLeftY = 0;
  private paddleRightY = 0;
  private leftScore = 0;
  private rightScore = 0;
  private leftInput = { up: false, down: false };
  private rightInput = { up: false, down: false };
  private winScore = 5;
  private isFinish = false;
  private isRunning = false;
  private lastScored: "left" | "right" | null = null;
  private scoreLogs: Array<{
    left: number;
    right: number;
    elapsedSeconds: number;
  }> = [];
  private matchStartTime: number | null = null;

  // メタ
  private tournamentId: string | null = null;
  private matchId: string | null = null;
  private leftPlayer: Player | null = null;
  private rightPlayer: Player | null = null;

  //ループ処理
  private tickTimer: NodeJS.Timeout | null = null;
  private snapShotTimer: NodeJS.Timeout | null = null;

  readonly id = randomUUID();

  //とりあえず初期化。この時はクライアントからの情報はまだ受け取っていない
  constructor() {
    console.log(`room created: ${this.id}`);
  }

  public isRoomReady(): boolean {
    if (this.clients.size >= 2) {
      return true;
    }
    return false;
  }

  public join = (ws: WebSocket): void => {
    console.log(`client joined room: ${this.id}`);
    this.clients.add(ws);
    if (this.initialize) {
      // this.isReady = true;
      console.log(`room is ready: ${this.id}`);
    }
  };

  public leave = (ws: WebSocket): void => {
    console.log(`client left room: ${this.id}`);
    this.clients.delete(ws);
  };

  public isEmpty = (): boolean => {
    return this.clients.size === 0;
  };

  private broadcast = (data: WsMessage): void => {
    const message = JSON.stringify(data);
    for (const client of this.clients) {
      try {
        client.send(message);
      } catch (_e) {}
    }
  };

  private broadcastReadyState = (): void => {
    this.broadcast({
      type: "ready",
      payload: {
        leftReady: this.isLeftReady,
        rightReady: this.isRightReady,
      },
    });
  };

  //ここがwsのソケットの入り口。ここでどんなリクエストなのかを判断して処理を選ぶ。
  public onUpdate = (data: WsMessage) => {
    switch (data.type) {
      case "init":
        if (!this.initialize) {
          const firstClient = this.clients.values().next().value;
          if (!firstClient) return;
          firstClient.send(JSON.stringify({ type: "connection" }));
          this.initialize = true;
          console.log("sent left connection");
        } else {
          const secondClient = Array.from(this.clients)[1];
          if (!secondClient) return;
          secondClient.send(JSON.stringify({ type: "connection" }));
          console.log("sent right connection");
          this.init(data.payload);
          console.log("sent start to both");
        }
        break;
      case "start":
        if (data.payload.position === "left") this.isLeftReady = true;
        else if (data.payload.position === "right") this.isRightReady = true;
        this.broadcastReadyState();

        if (this.isLeftReady && this.isRightReady && !this.isRunning) {
          setTimeout(() => {
            // 3秒後時点でまだ両者がいる＆Readyのままなら開始
            if (this.isLeftReady && this.isRightReady && !this.isRunning) {
              if (this.matchStartTime === null) {
                this.matchStartTime = Date.now();
              }
              this.handleSpace();
              // 開始したら、以後UIは isRunning=true で隠れるのでOK
            }
          }, 3000);
        }
        break;
      case "input":
        this.updateInput(data.payload as PlayerInput);
        break;
      case "pause":
        this.handleSpace();
        break;
      case "close":
        this.stop();
        for (const client of this.clients) {
          client.close(1000, "client request closed");
        }
        break;
      case "ping":
        this.printMatchState();
        break;
    }
  };

  //ここでclientからの試合状況を受け取って入れておく
  public init = (arg: MatchData) => {
    // ここでバリデーション（最低限のチェック）
    if (
      !arg ||
      typeof arg.width !== "number" ||
      typeof arg.height !== "number"
    ) {
      throw new Error("Invalid MatchData");
    }
    this.width = arg.width;
    this.height = arg.height;
    this.paddleWidth = arg.paddleWidth ?? this.paddleWidth;
    this.paddleHeight = arg.paddleHeight ?? this.paddleHeight;
    this.paddleMargin = arg.paddleMargin ?? this.paddleMargin;
    this.paddleSpeed = arg.paddleSpeed ?? this.paddleSpeed;
    this.ballRadius = arg.ballRadius ?? this.ballRadius;
    this.ballSpeed = arg.ballSpeed ?? this.ballSpeed;
    this.ballAccel = arg.ballAccel ?? this.ballAccel;
    this.winScore = arg.winScore ?? this.winScore;
    this.tournamentId = arg.tournamentId ?? null;
    this.matchId = arg.matchId ?? null;
    this.leftPlayer = arg.leftPlayer;
    this.rightPlayer = arg.rightPlayer;

    // 位置の初期化
    this.ballX = this.width / 2;
    this.ballY = this.height / 2;
    this.paddleLeftY = (this.height - this.paddleHeight) / 2;
    this.paddleRightY = (this.height - this.paddleHeight) / 2;

    this.start();
    // 必要ならクライアントへ
    console.log("server send init");
  };

  //処理のスタート
  private start = (): void => {
    if (this.tickTimer) return;

    //60Hzでデータ更新
    this.tickTimer = setInterval(() => {
      if (this.isFinish) return;
      this.statusUpdate();
    }, 1000 / 60);

    //20Hzでデータの送信。
    this.snapShotTimer = setInterval(() => {
      this.sendData();
    }, 1000 / 30);
  };

  //ソケットを閉じるときに呼ぶ
  private stop = (): void => {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    if (this.snapShotTimer) {
      clearInterval(this.snapShotTimer);
      this.snapShotTimer = null;
    }
  };

  public statusUpdate = (): void => {
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
      const elapsedSeconds = this.matchStartTime
        ? Math.floor((Date.now() - this.matchStartTime) / 1000)
        : 0;
      this.scoreLogs.push({
        left: this.leftScore,
        right: this.rightScore,
        elapsedSeconds,
      });
      //試合終了かどうかを判断
      if (this.rightScore === this.winScore) {
        this.finishGame();
      } else {
        this.serveFrom();
      }
    } else if (this.ballX - this.ballRadius > this.width) {
      this.leftScore += 1;
      this.lastScored = "left";
      const elapsedSeconds = this.matchStartTime
        ? Math.floor((Date.now() - this.matchStartTime) / 1000)
        : 0;
      this.scoreLogs.push({
        left: this.leftScore,
        right: this.rightScore,
        elapsedSeconds,
      });
      //試合終了かどうかを判断
      if (this.leftScore === this.winScore) {
        this.finishGame();
      } else {
        this.serveFrom();
      }
    }
  };

  //反射によるボールの加速。パドルとあたった時だけ
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

  //点が入った後の初期位置へのリセット
  public serveFrom = (): void => {
    this.ballX = this.width / 2;
    this.ballY = this.height / 2;
    this.ballVelX = 0;
    this.ballVelY = 0;
    this.isRunning = false;

    this.isLeftReady = false;
    this.isRightReady = false;
    this.broadcastReadyState();

    this.broadcast({
      type: "pause",
    });
  };

  //勝者判定
  private getWinnerId = (): number | undefined => {
    if (this.lastScored === "left") return this.leftPlayer?.userId;
    else if (this.lastScored === "right") return this.rightPlayer?.userId;
  };

  //試合終了処理。先にbackendに試合の記録を送って、送った後にフロントに対してそれを通知
  private finishGame = async (): Promise<void> => {
    const winId = this.getWinnerId();

    //先にゲームを止めておく
    this.isFinish = true;

    // 先にbackendサーバーに内部APIでpostしてデータを保存しておく
    if (this.tournamentId && this.matchId && winId) {
      try {
        await internalApiClient.submitMatchResult({
          tournamentId: this.tournamentId,
          matchId: this.matchId,
          winnerId: winId,
          score: {
            leftPlayer: this.leftScore,
            rightPlayer: this.rightScore,
          },
          ballSpeed: this.ballSpeed,
          ballRadius: this.ballRadius,
          scoreLogs: this.scoreLogs,
        });
        console.log("Match result successfully submitted to backend");
      } catch (error) {
        console.error("Failed to submit match result to backend:", error);
        // エラーでも試合は続行（フロントには結果を返す）
      }
    } else {
      console.warn(
        "Missing tournament/match ID or winner ID, skipping result submission",
      );
    }

    //その処理が終わってからフロント側に返す。
    this.broadcast({
      type: "result",
      payload: {
        leftScore: this.leftScore,
        rightScore: this.rightScore,
        winnerId: winId,
        isFinish: true,
      } as MatchResult,
    });
    for (const client of this.clients) {
      client.close(1000, "game finish");
    }
  };

  private updateInput = (palyload: PlayerInput): void => {
    if (palyload.leftorRight === "left") {
      this.leftInput.up = palyload.up;
      this.leftInput.down = palyload.down;
      console.log(
        `Left Input Updated: up=${palyload.up}, down=${palyload.down}`,
      );
    } else if (palyload.leftorRight === "right") {
      this.rightInput.up = palyload.up;
      this.rightInput.down = palyload.down;
      console.log(
        `Right Input Updated: up=${palyload.up}, down=${palyload.down}`,
      );
    }
    // this.leftInput.up = palyload.leftup;
    // this.leftInput.down = palyload.leftdown;
    // this.rightInput.up = palyload.rightup;
    // this.rightInput.down = palyload.rightdown;
  };

  public sendData = (): void => {
    try {
      this.broadcast({
        type: "snapshot",
        payload: {
          width: this.width,
          height: this.height,
          ballX: this.ballX,
          ballY: this.ballY,
          ballVelX: this.ballVelX,
          ballVelY: this.ballVelY,
          paddleLeftY: this.paddleLeftY,
          paddleRightY: this.paddleRightY,
          leftScore: this.leftScore,
          rightScore: this.rightScore,
          winScore: this.winScore,
          isFinish: this.isFinish,
          isRunning: this.isRunning,
          lastScored: this.lastScored,
        } as MatchState,
      });
    } catch (_e) {}
  };

  private handleSpace = (): void => {
    if (this.isRunning) {
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

    // 試合開始時刻を記録（初回のみ）
    // if (this.matchStartTime === null) {
    //   this.matchStartTime = Date.now();
    // }

    this.isRunning = true;
  };

  private printMatchState = (): void => {
    console.log("=== Pong Match State ===");
    console.log(`Session ID: ${this.id}`);
    console.log("--- 定数 ---");
    console.table({
      width: this.width,
      height: this.height,
      paddleWidth: this.paddleWidth,
      paddleHeight: this.paddleHeight,
      paddleMargin: this.paddleMargin,
      paddleSpeed: this.paddleSpeed,
      ballRadius: this.ballRadius,
      ballSpeed: this.ballSpeed,
      ballAccel: this.ballAccel,
      ballMaxSpeed: this.ballMaxSpeed,
      winScore: this.winScore,
    });

    console.log("--- State ---");
    console.table({
      ballX: this.ballX,
      ballY: this.ballY,
      ballVelX: this.ballVelX,
      ballVelY: this.ballVelY,
      paddleLeftY: this.paddleLeftY,
      paddleRightY: this.paddleRightY,
      leftScore: this.leftScore,
      rightScore: this.rightScore,
      leftInput: JSON.stringify(this.leftInput),
      rightInput: JSON.stringify(this.rightInput),
      isRunning: this.isRunning,
      isFinish: this.isFinish,
      lastScored: this.lastScored,
    });

    console.log("--- Meta data ---");
    console.table({
      tournamentId: this.tournamentId,
      matchId: this.matchId,
      leftPlayer: this.leftPlayer
        ? `${this.leftPlayer.alias} (#${this.leftPlayer.userId})`
        : null,
      rightPlayer: this.rightPlayer
        ? `${this.rightPlayer.alias} (#${this.rightPlayer.userId})`
        : null,
    });
    console.log("========================\n");
  };

  // public getPlaterNames(): { leftPlayerName: string; rightPlayerName: string } {
  //   return {
  //     leftPlayerName: this.leftPlayer ? this.leftPlayer.alias : "TBD",
  //     rightPlayerName: this.rightPlayer ? this.rightPlayer.alias : "TBD",
  //   };
  // }
}
