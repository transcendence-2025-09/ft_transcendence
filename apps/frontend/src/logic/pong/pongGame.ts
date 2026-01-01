import * as BABYLON from "@babylonjs/core";
import type { Match, Player } from "../../pages/tournaments/types";
import { navigateTo } from "../../pages/tournaments/utils";
import type { RouteCtx } from "../../routing/routeList";
import {
  makeBall,
  makeBallMaterial,
  makeBallShadow,
  makeBallShadowMaterial,
  makeCamera,
  makeDashLine,
  makeDirLight,
  makeEngine,
  makeGlowLight,
  makeGround,
  makeGroundMaterial,
  makeHemiSphereLight,
  makePaddle,
  makePaddleMaterial,
  makeScene,
} from "./babylon";
import { clamp, lerp } from "./calculate";
import {
  makeGUI,
  makeLeftReadyTextGUI,
  makeLeftScoreContanerGUI,
  makeLeftScoreTextGUI,
  makeReadyRowGUI,
  makeRightReadyTextGUI,
  makeRightScoreContanerGUI,
  makeRightScoreTextGUI,
  makeScorebarGUI,
  makeScoreGridGUI,
  makeScoreRowGUI,
  makeWinnerCountdownGUI,
  makeWinnerNameGUI,
  makeWinnerOverlayGUI,
  makeWinnerTitleGUI,
} from "./gui";
import type {
  MatchData,
  MatchResult,
  MatchState,
  Snap,
  WsMessage,
} from "./types";

export class PongGame {
  private width: number;
  private height: number;
  private worldWidth: number = 1500;
  private worldHeight: number = 1100;
  private paddleWidth: number = 12;
  private paddleHeight: number = 110;
  private paddleMargin: number = 24;
  private ballRadius: number = 12;
  private ballSpeed: number = 3;
  private ballAccel: number = 1.03;
  private ballX: number;
  private ballY: number;
  private paddleLeftY: number;
  private paddleRightY: number;
  private leftScore: number = 0;
  private rightScore: number = 0;
  private clientInput: { up: boolean; down: boolean } = {
    up: false,
    down: false,
  };
  private clientPosition: "left" | "right" | null = null;
  private winScore: number = 3;
  private winnerId: number | null = null;
  private isFinish: boolean = false;
  private canStart: boolean = false;
  private canvas: HTMLCanvasElement;
  private isRunning: boolean = false;
  private animationId: number | null = null;
  private isLeftReady: boolean = false;
  private isRightReady: boolean = false;
  private onKeyDownRef?: (e: KeyboardEvent) => void;
  private onKeyUpRef?: (e: KeyboardEvent) => void;
  private spaceDown: boolean = false;
  private tournamentId: string | null;
  private matchId: string | null;
  private leftPlayer: Player | null;
  private rightPlayer: Player | null;
  private ws: WebSocket;
  private finishTime: number | null = null;
  private redirectDelay: number = 5000;
  private prevSnap: Snap | null = null;
  private lastSnap: Snap | null = null;
  private interpDelay: number = 120;
  private engine: BABYLON.Engine | null = null;
  private scene: BABYLON.Scene | null = null;
  private camera: BABYLON.ArcRotateCamera | null = null;
  private meshes: {
    leftPaddle: BABYLON.Mesh;
    rightPaddle: BABYLON.Mesh;
    ball: BABYLON.Mesh;
  } | null = null;

  //canvasはPongGameの描画用、ctxはルーティング情報、matchは試合情報
  constructor(
    canvas: HTMLCanvasElement,
    ctx?: RouteCtx | null,
    match?: Match | null,
  ) {
    this.width = this.worldWidth;
    this.height = this.worldHeight;
    this.ballX = this.width / 2;
    this.ballY = this.height / 2;
    this.paddleLeftY = (this.height - this.paddleHeight) / 2;
    this.paddleRightY = (this.height - this.paddleHeight) / 2;
    this.canvas = canvas;
    this.tournamentId = ctx?.params.tournamentId ?? null;
    this.matchId = ctx?.params.matchId ?? null;
    this.leftPlayer = match?.leftPlayer ?? null;
    this.rightPlayer = match?.rightPlayer ?? null;
    this.ballSpeed = match?.gameOptions?.ballSpeed ?? 3;
    this.ballRadius = match?.gameOptions?.ballRadius ?? 12;
    this.ws = this.createWebSocket();
  }

  private createWebSocket = (): WebSocket => {
    const scheme = location.protocol === "https:" ? "wss" : "ws";
    // tournamentIdとmatchIdが存在する場合にのみ接続を試みる
    if (this.tournamentId !== null && this.matchId !== null) {
      console.log(
        `Connecting to WS with tournamentId=${this.tournamentId} & matchId=${this.matchId}`,
      );
      // URLSearchParamsを使ってクエリパラメータを生成
      const paramStr = new URLSearchParams({
        tournamentId: this.tournamentId,
        matchId: this.matchId,
      });
      //クエリパラメータを付与してWebSocket接続を作成
      return new WebSocket(
        `${scheme}://${location.host}/ws?${paramStr.toString()}`,
      );
    } else {
      return null as unknown as WebSocket;
    }
  };

  private async waitForOpen(ws: WebSocket): Promise<void> {
    if (ws.readyState === WebSocket.OPEN) return;
    await new Promise<void>((resolve) => {
      const onOpen = () => {
        ws.removeEventListener("open", onOpen);
        resolve();
      };
      ws.addEventListener("open", onOpen);
    });
  }

  //Gameサーバーへの初期データを送信し、WebScocketのメッセージ受信処理を登録する
  public init = async () => {
    //最初にソケットの通信が確立されることをまつ
    await this.waitForOpen(this.ws);
    //現在のユーザー情報を取得しておく
    const res = await fetch("/api/user/me", {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Unauthorized");
    const data = await res.json();
    //自分がleftかrightか、どちらのプレイヤーかを確認
    if (this.leftPlayer?.userId === data.id) this.clientPosition = "left";
    else if (this.rightPlayer?.userId === data.id)
      this.clientPosition = "right";
    console.log("Client Connection Success!!");

    //初期データを送信
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
    //キーイベントの登録
    this.registerKeyEvent();
    //メッセージ受信の処理
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
    //3Dの初期化
    this.init3D();
  };

  //ゲームループ開始
  public start = (): void => {
    if (this.isRunning) return;
    this.loop();
  };

  //ゲームループ停止
  public stop = async (): Promise<void> => {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.unregisterKeyEvent();
    this.dispose3D();
  };

  //サーバーからのメッセージ受信時の処理
  private onReceive = (data: WsMessage): void => {
    switch (data.type) {
      case "connection":
        console.log("Connection Start.");
        this.canStart = true;
        break;
      case "ready": {
        const readyInfo = data.payload as {
          leftReady: boolean;
          rightReady: boolean;
        };
        this.isLeftReady = readyInfo.leftReady;
        this.isRightReady = readyInfo.rightReady;
        break;
      }
      case "snapshot":
        this.updateState(data.payload as MatchState);
        break;
      case "result":
        this.finishGame(data.payload as MatchResult);
        break;
    }
  };

  //ゲーム終了時の処理
  private finishGame = (data: MatchResult): void => {
    //Gameサーバーから送られてきた試合結果情報を元に状態を更新
    this.leftScore = data.leftScore;
    this.rightScore = data.rightScore;
    this.winnerId = Number(data.winnerId);
    this.isFinish = data.isFinish;
    //終了時間を記録
    this.finishTime = performance.now();
    //一旦ルートへ
    setTimeout(() => {
      navigateTo(`/tournaments/${this.tournamentId}/matches`);
    }, this.redirectDelay);
  };

  //サーバーから送られてきた最新の試合状態でローカルの状態を更新
  private updateState = (data: MatchState): void => {
    const now = performance.now();
    this.prevSnap = this.lastSnap;
    this.lastSnap = {
      time: now,
      ballX: data.ballX,
      ballY: data.ballY,
      paddleLeftY: data.paddleLeftY,
      paddleRightY: data.paddleRightY,
    };

    this.ballX = data.ballX;
    this.ballY = data.ballY;
    this.paddleLeftY = data.paddleLeftY;
    this.paddleRightY = data.paddleRightY;
    this.leftScore = data.leftScore;
    this.rightScore = data.rightScore;
    this.isFinish = data.isFinish;
    this.isRunning = data.isRunning;
  };

  //ゲームループ本体
  private loop = (): void => {
    this.animationId = requestAnimationFrame(this.loop);
  };

  //キーイベントの登録
  private registerKeyEvent = (): void => {
    if (this.onKeyUpRef || this.onKeyDownRef) return;
    let keyflag = false;

    this.onKeyDownRef = (e: KeyboardEvent) => {
      switch (e.code) {
        case "ArrowUp":
          e.preventDefault();
          this.clientInput.up = true;
          keyflag = true;
          break;
        case "ArrowDown":
          e.preventDefault();
          this.clientInput.down = true;
          keyflag = true;
          break;
        case "Space":
          e.preventDefault();
          keyflag = true;
          if (!this.spaceDown) {
            this.spaceDown = true;
            this.handleSpace();
          }
          break;
      }
      if (keyflag)
        this.ws.send(
          JSON.stringify({
            type: "input",
            payload: {
              up: this.clientInput.up,
              down: this.clientInput.down,
              leftorRight: this.clientPosition,
            },
          }),
        );
    };

    this.onKeyUpRef = (e: KeyboardEvent) => {
      let keyflag = false;
      switch (e.code) {
        case "ArrowUp":
          this.clientInput.up = false;
          keyflag = true;
          break;
        case "ArrowDown":
          this.clientInput.down = false;
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
              up: this.clientInput.up,
              down: this.clientInput.down,
              leftorRight: this.clientPosition,
            },
          }),
        );
    };

    window.addEventListener("keydown", this.onKeyDownRef, {
      capture: true,
      passive: false,
    });
    window.addEventListener("keyup", this.onKeyUpRef, {
      capture: true,
      passive: false,
    });
    console.log("Register key event success");
  };

  //キーイベントの登録解除
  private unregisterKeyEvent = (): void => {
    if (this.onKeyDownRef)
      window.removeEventListener("keydown", this.onKeyDownRef);
    if (this.onKeyUpRef) window.removeEventListener("keyup", this.onKeyUpRef);
    this.onKeyDownRef = undefined;
    this.onKeyUpRef = undefined;
    this.clientInput.up = this.clientInput.down = false;
  };

  //スペースキー押下時の処理
  private handleSpace = (): void => {
    //まだ開始できない場合は無視
    if (!this.canStart) return;
    //試合終了後ならマッチ一覧へ遷移
    if (this.isFinish) {
      navigateTo(`/tournaments/${this.tournamentId}/matches`);
    }

    //試合中なら無視、まだ開始していないなら開始要求をサーバーに送信
    if (!this.isRunning && !(this.isLeftReady && this.isRightReady)) {
      this.ws.send(
        JSON.stringify({
          type: "start",
          payload: {
            position: this.clientPosition,
          },
        }),
      );
    }
  };

  //ターゲット時間における位置をスナップショットから補間して取得
  private samplePosition(targettime: number): {
    ballX: number;
    ballY: number;
    paddleLeftY: number;
    paddleRightY: number;
  } | null {
    if (!this.prevSnap || !this.lastSnap) return null;
    console.log("Sample get!");

    const A = this.prevSnap;
    const B = this.lastSnap;
    const dt = B.time - A.time;
    if (dt <= 0) {
      return {
        ballX: B.ballX,
        ballY: B.ballY,
        paddleLeftY: B.paddleLeftY,
        paddleRightY: B.paddleRightY,
      };
    }
    const t = clamp((targettime - A.time) / dt);
    return {
      ballX: lerp(A.ballX, B.ballX, t),
      ballY: lerp(A.ballY, B.ballY, t),
      paddleLeftY: lerp(A.paddleLeftY, B.paddleLeftY, t),
      paddleRightY: lerp(A.paddleRightY, B.paddleRightY, t),
    };
  }

  private init3D = (): void => {
    this.resizeCanvasToDisplaySize();
    const canvas = this.canvas;
    this.engine = makeEngine(canvas);
    this.scene = makeScene(this.engine);
    this.camera = makeCamera(this.scene, this.width, this.height);
    const _hemiLight = makeHemiSphereLight(this.scene);
    const _dirLight = makeDirLight(this.scene);
    const _glow = makeGlowLight(this.scene);
    const _ground = makeGround(this.scene, this.width, this.height);
    const _groundMat = makeGroundMaterial(this.scene);
    _ground.material = _groundMat;
    const _centerDashLine = makeDashLine(this.scene, this.height);
    const leftPaddle = makePaddle(
      this.scene,
      this.paddleWidth,
      this.paddleHeight,
      "left",
    );
    const rightPaddle = leftPaddle.clone("right") as BABYLON.Mesh;
    const paddleMat = makePaddleMaterial(this.scene);
    leftPaddle.material = paddleMat;
    rightPaddle.material = paddleMat;
    const ball = makeBall(this.scene, this.ballRadius);
    const ballMat = makeBallMaterial(this.scene);
    ball.material = ballMat;
    const ballShadow = makeBallShadow(this.scene, this.ballRadius);
    const shadowMat = makeBallShadowMaterial(this.scene);
    ballShadow.material = shadowMat;
    this.meshes = { leftPaddle, rightPaddle, ball };
    //こっからGUIの作成
    const gui = makeGUI(this.scene);
    const scoreBar = makeScorebarGUI();
    gui.addControl(scoreBar);
    const scoreGrid = makeScoreGridGUI();
    scoreBar.addControl(scoreGrid);
    const scoreRow = makeScoreRowGUI();
    scoreGrid.addControl(scoreRow, 0, 0);
    const leftScoreContainer = makeLeftScoreContanerGUI();
    const rightScoreContainer = makeRightScoreContanerGUI();
    scoreRow.addControl(leftScoreContainer, 0, 0);
    scoreRow.addControl(rightScoreContainer, 0, 1);
    const readyRow = makeReadyRowGUI();
    scoreGrid.addControl(readyRow, 1, 0);
    const leftReadyText = makeLeftReadyTextGUI();
    const rightReadyText = makeRightReadyTextGUI();
    readyRow.addControl(leftReadyText, 0, 0);
    readyRow.addControl(rightReadyText, 0, 1);
    const leftScoreText = makeLeftScoreTextGUI();
    const rightScoreText = makeRightScoreTextGUI();
    leftScoreContainer.addControl(leftScoreText);
    rightScoreContainer.addControl(rightScoreText);
    const winnerOverlay = makeWinnerOverlayGUI();
    gui.addControl(winnerOverlay);
    const winnerTitle = makeWinnerTitleGUI();
    const winnerName = makeWinnerNameGUI();
    const winnerCountdown = makeWinnerCountdownGUI();
    winnerOverlay.addControl(winnerTitle);
    winnerOverlay.addControl(winnerName);
    winnerOverlay.addControl(winnerCountdown);

    //レンダーループの設定
    this.scene.onBeforeRenderObservable.add(() => {
      const targettime = performance.now() - this.interpDelay;
      const shot = this.samplePosition(targettime);
      this.syncMeshes({
        ballX: shot?.ballX ?? this.ballX,
        ballY: shot?.ballY ?? this.ballY,
        paddleLeftY: shot?.paddleLeftY ?? this.paddleLeftY,
        paddleRightY: shot?.paddleRightY ?? this.paddleRightY,
      });

      if (!this.meshes) return;
      ballShadow.position.x = this.meshes.ball.position.x;
      ballShadow.position.z = this.meshes.ball.position.z;

      leftScoreText.text = String(this.leftScore);
      rightScoreText.text = String(this.rightScore);

      // isRunning=false かつ isFinish=false のときだけ表示
      if (!this.isFinish && !this.isRunning) {
        if (this.isLeftReady) {
          leftReadyText.text = "READY";
          leftReadyText.color = "#4ade80";
        } else {
          leftReadyText.text = "Press SPACE";
          leftReadyText.color = "#f87171";
        }

        if (this.isRightReady) {
          rightReadyText.text = "READY";
          rightReadyText.color = "#4ade80";
        } else {
          rightReadyText.text = "Press SPACE";
          rightReadyText.color = "#f87171";
        }
      } else {
        leftReadyText.text = "";
        rightReadyText.text = "";
      }

      // 勝者オーバーレイの表示更新
      winnerOverlay.isVisible = this.isFinish;
      if (this.isFinish) {
        winnerName.text = String(
          this.winnerId != null && this.winnerId === this.leftPlayer?.userId
            ? this.leftPlayer?.alias
            : this.rightPlayer?.alias,
        );
        if (this.finishTime) {
          const elapsed = performance.now() - this.finishTime;
          const remaining = Math.max(0, this.redirectDelay - elapsed);
          const seconds = Math.ceil(remaining / 1000);
          winnerCountdown.text = `Returning in ${seconds}s…`;
        } else {
          winnerCountdown.text = "";
        }
      } else {
        winnerName.text = "";
        winnerCountdown.text = "";
      }
    });

    // エンジンのレンダーループ開始
    this.engine.runRenderLoop(() => {
      this.scene?.render();
    });

    // リサイズイベントの登録
    window.addEventListener("resize", () => {
      this.resizeCanvasToDisplaySize();
      this.engine?.resize();
    });
  };

  private dispose3D = (): void => {
    this.camera?.dispose();
    this.scene?.dispose();
    this.engine?.dispose();
    this.scene = null;
    this.engine = null;
    this.camera = null;
    this.meshes = null;
  };

  //canvasとBabylonjsで座標原点が異なるから中身を揃える処理を加える
  private twoDtothreeD = (
    x2d: number,
    y2d: number,
    yHeight = 0.5,
  ): BABYLON.Vector3 => {
    return new BABYLON.Vector3(
      x2d - this.width / 2,
      yHeight,
      this.height / 2 - y2d,
    );
  };

  //サーバーから送られてきた状態に基づいて3Dメッシュの位置を更新する
  private syncMeshes = (
    shot: {
      ballX: number;
      ballY: number;
      paddleLeftY: number;
      paddleRightY: number;
    } | null,
  ): void => {
    if (shot === null || this.meshes === null) return;
    const ballX = shot.ballX ?? this.ballX;
    const ballY = shot.ballY ?? this.ballY;
    const paddleLeftY = shot.paddleLeftY ?? this.paddleLeftY;
    const paddleRightY = shot.paddleRightY ?? this.paddleRightY;

    const leftX2d = this.paddleMargin + this.paddleWidth / 2;
    const leftZ2d = paddleLeftY + this.paddleHeight / 2;
    this.meshes.leftPaddle.position = this.twoDtothreeD(leftX2d, leftZ2d);
    const rightX2d = this.width - this.paddleMargin - this.paddleWidth / 2;
    const rightZ2d = paddleRightY + this.paddleHeight / 2;
    this.meshes.rightPaddle.position = this.twoDtothreeD(rightX2d, rightZ2d);
    this.meshes.ball.position = this.twoDtothreeD(ballX, ballY, 1.0);
  };

  // canvasの表示サイズに合わせて解像度を調整する;
  private resizeCanvasToDisplaySize = () => {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.floor(rect.width * dpr);
    const h = Math.floor(rect.height * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  };
}
