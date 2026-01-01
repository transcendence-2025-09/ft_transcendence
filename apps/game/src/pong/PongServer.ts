// PongServer.ts
import { randomUUID } from "crypto";
import type {
  MatchData,
  MatchResult,
  MatchState,
  Player,
  PlayerInput,
  readyPayload,
  WsMessage,
} from "src/types/pong";
import type { WebSocket } from "ws";
import { internalApiClient } from "../utils/internalApiClient.js";

export class PongServer {
  // 通信
  private clients = new Set<WebSocket>();
  private wsToSide = new Map<"left" | "right", WebSocket>();
  private leftClient: WebSocket | null = null;
  private rightClient: WebSocket | null = null;
  private initialize = false;
  private isLeftReady = false;
  private isRightReady = false;

  // 基本定数
  private width = 0;
  private height = 0;
  private paddleWidth = 12;
  private paddleHeight = 110;
  private paddleMargin = 24;
  private paddleSpeed = 6;
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
  private tournamentId: string | null = null;
  private matchId: string | null = null;
  private leftPlayer: Player | null = null;
  private rightPlayer: Player | null = null;
  private tickTimer: NodeJS.Timeout | null = null;
  private snapShotTimer: NodeJS.Timeout | null = null;
  readonly id = randomUUID();
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

    if (this.clients.size >= 2) {
      ws.close(1008, "room full");
      return;
    }
    this.clients.add(ws);
    //left rightの順番でクライアントを割り当てる
    let side: "left" | "right";
    if (!this.leftClient) {
      this.leftClient = ws;
      side = "left";
    } else if (!this.rightClient) {
      this.rightClient = ws;
      side = "right";
    } else {
      ws.close(1008, "room full");
      return;
    }
    this.wsToSide.set(side, ws);
    console.log(`assigned side=${side}`);

    //closeとerrorイベントのハンドリング
    ws.on("close", (code, reason) => {
      console.log(
        `ws closed side=${side} code=${code} reason=${reason.toString()}`,
      );
      this.onClientDisconnect(ws);
    });
    ws.on("error", (err) => {
      console.log(`ws error side=${side}`, err);
      this.onClientDisconnect(ws);
    });
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
        this.init(data.payload);
        break;
      case "start":
        this.start(data.payload);
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
    }
  };

  //ここでclientからの試合状況を受け取って入れておく
  private init = (arg: MatchData) => {
    if (
      !arg ||
      typeof arg.width !== "number" ||
      typeof arg.height !== "number"
    ) {
      throw new Error("Invalid MatchData");
    }

    // 初回接続時にleftクライアントへ、2回目にrightクライアントへ接続通知を送る
    if (!this.initialize) {
      const firstClient = this.wsToSide.get("left");
      if (!firstClient) return;
      firstClient.send(JSON.stringify({ type: "connection" }));
      this.initialize = true;
      console.log("sent left connection");
      return;
    } else {
      const secondClient = this.wsToSide.get("right");
      if (!secondClient) return;
      secondClient.send(JSON.stringify({ type: "connection" }));
      console.log("sent right connection");
    }

    if (!this.initialize) {
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

    this.ballX = this.width / 2;
    this.ballY = this.height / 2;
    this.paddleLeftY = (this.height - this.paddleHeight) / 2;
    this.paddleRightY = (this.height - this.paddleHeight) / 2;

    this.setTimer();
    console.log("server send init");
  };

  private start = (data: readyPayload) => {
    //どっちのプレイヤーがReadyしたかを記録
    if (data.position === "left") this.isLeftReady = true;
    else if (data.position === "right") this.isRightReady = true;
    //両者のReady状態を全員に通知
    this.broadcastReadyState();
    //両者がReadyなら3秒後に試合開始
    if (this.isLeftReady && this.isRightReady && !this.isRunning) {
      setTimeout(() => {
        // 3秒後時点でまだ両者がいる＆Readyのままなら開始
        if (this.isLeftReady && this.isRightReady && !this.isRunning) {
          if (this.matchStartTime === null) {
            this.matchStartTime = Date.now();
          }
          this.handleSpace();
        }
      }, 3000);
    }
  };

  //処理のスタート
  private setTimer = (): void => {
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

  //毎フレームの状態更新
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
    //ボールの右側の座標が画面左端よりも小さくなったら右の得点
    if (this.ballX + this.ballRadius < 0) {
      this.rightScore += 1;
      this.lastScored = "right";
      //経過時間を計算してログに追加
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
      //ボールの左側の座標が画面右端よりも大きくなったら左の得点
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
    // 現在の速度を計算
    const speed = Math.hypot(vx, vy);
    if (speed === 0) return;
    // 加速後の速度を計算
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
    //得点後は両者のReady状態をリセットしてから通知
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

  private onClientDisconnect = (ws: WebSocket): void => {
    // すでに試合終了済みなら二重処理しない
    if (this.isFinish) return;

    let side: "left" | "right" | null = null;
    if (this.wsToSide.get("left") === ws) {
      side = "left";
    } else if (this.wsToSide.get("right") === ws) {
      side = "right";
    }
    if (!side) return;

    // 管理から外す
    this.clients.delete(ws);
    this.wsToSide.delete(side);

    if (side === "left") this.leftClient = null;
    if (side === "right") this.rightClient = null;

    // 切断した側の相手を勝者として試合終了処理へ
    const winnerSide = side === "left" ? "right" : "left";
    this.finishGameByDisconnect(winnerSide);
  };

  //試合終了処理。先にbackendに試合の記録を送って、送った後にフロントに対してそれを通知
  private finishGame = async (): Promise<void> => {
    const winId = this.getWinnerId();
    //先にゲームを止めておく
    this.isFinish = true;
    //game serverからbackendに試合結果を送る
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

  // 切断による試合終了処理
  private finishGameByDisconnect = async (winnerSide: "left" | "right") => {
    // 先に止める（二重を防ぐ）
    this.isFinish = true;
    this.isRunning = false;
    this.stop();

    const winnerId =
      winnerSide === "left"
        ? this.leftPlayer?.userId
        : this.rightPlayer?.userId;

    if (!winnerId) {
      console.warn("winnerId missing on disconnect");
    }

    // backend に保存（理由も渡せるなら渡すと良い）
    if (this.tournamentId && this.matchId && winnerId) {
      try {
        await internalApiClient.submitMatchResult({
          tournamentId: this.tournamentId,
          matchId: this.matchId,
          winnerId,
          score: { leftPlayer: this.leftScore, rightPlayer: this.rightScore },
          ballSpeed: this.ballSpeed,
          ballRadius: this.ballRadius,
          scoreLogs: this.scoreLogs,
        });
      } catch (e) {
        console.error("Failed to submit disconnect result:", e);
      }
    }

    // フロントに結果通知（今の WsMessage 仕様に合わせる）
    this.broadcast({
      type: "result",
      payload: {
        leftScore: this.leftScore,
        rightScore: this.rightScore,
        winnerId,
        isFinish: true,
      } as MatchResult,
    });

    // 残ってるクライアントも閉じる（画面遷移させたいので）
    for (const client of this.clients) {
      try {
        client.close(1000, "opponent disconnected");
      } catch {}
    }
  };

  private updateInput = (palyload: PlayerInput): void => {
    if (palyload.leftorRight === "left") {
      this.leftInput.up = palyload.up;
      this.leftInput.down = palyload.down;
    } else if (palyload.leftorRight === "right") {
      this.rightInput.up = palyload.up;
      this.rightInput.down = palyload.down;
    }
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
    this.isRunning = true;
  };
}
