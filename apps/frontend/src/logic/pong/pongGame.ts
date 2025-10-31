//このクラスはあくまで描画の管理のみ。データの変更などはAPIを通じて行う.
//
// import WebSocket from "ws";

// import * as BABYLON from "babylonjs";
import * as BABYLON from "@babylonjs/core";
import * as GUI from "@babylonjs/gui";
import type {
  Match,
  Player,
  // MatchRound,
  // MatchStatus,
} from "../../pages/tournaments/types";
import { navigateTo } from "../../pages/tournaments/utils";
import type { RouteCtx } from "../../routing/routeList";
import type { MatchData, MatchResult, MatchState, WsMessage } from "./types";

type Snap = {
  time: number;
  ballX: number;
  ballY: number;
  paddleLeftY: number;
  paddleRightY: number;
};

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
  private ballRadius: number;
  private ballSpeed: number;
  private ballAccel: number;
  //状態データ
  private ballX: number;
  private ballY: number;
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
  //key管理関係
  private onKeyDownRef?: (e: KeyboardEvent) => void;
  private onKeyUpRef?: (e: KeyboardEvent) => void;
  private spaceDown: boolean;
  //試合に関する情報
  private tournamentId: string | null;
  private matchId: string | null;
  //APIから取得するデータ
  private leftPlayer: Player | null;
  private rightPlayer: Player | null;
  // private status: MatchStatus | null;
  private ws: WebSocket;
  private finishTime: number | null;
  private redirectDelay: number;
  //snapをとって描画の線形補完をする
  private prevSnap: Snap | null;
  private lastSnap: Snap | null;
  private interpDelay: number;
  //3Dレンダリングの必要要素
  private engine: BABYLON.Engine | null;
  private scene: BABYLON.Scene | null;
  private camera: BABYLON.ArcRotateCamera | null;
  private meshes: {
    left: BABYLON.Mesh;
    right: BABYLON.Mesh;
    ball: BABYLON.Mesh;
  } | null;

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
    this.ballRadius = opt?.ballRadius ?? 12;
    this.ballSpeed = opt?.ballSpeed ?? 3;
    this.ballAccel = opt?.ballAccel ?? 1.03;
    this.ballX = this.width / 2;
    this.ballY = this.height / 2;
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
    this.spaceDown = false;
    this.tournamentId = ctx?.params.tournamentId ?? null;
    this.matchId = ctx?.params.matchId ?? null;
    this.leftPlayer = null;
    this.rightPlayer = null;
    this.ws = new WebSocket("ws://localhost:3001/ws");
    this.winnerId = null;
    //試合終了の時間
    this.finishTime = null;
    //試合終了後の画面遷移時間
    this.redirectDelay = 5000;
    this.prevSnap = null;
    this.lastSnap = null;
    this.interpDelay = 120;
    this.engine = null;
    this.scene = null;
    this.camera = null;
    this.meshes = null;
  }

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

  public init = async () => {
    //最初にソケットの通信が確立されることをまつ
    await this.waitForOpen(this.ws);
    //

    const match = await this.getMatchInfo();
    this.leftPlayer = match?.leftPlayer ?? null;
    this.rightPlayer = match?.rightPlayer ?? null;
    this.ballSpeed = match?.gameOptions?.ballSpeed ?? 3;
    this.ballRadius = match?.gameOptions?.ballRadius ?? 12;
    console.log("Client Connection Success!!");
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
    // this.registerKeyEvent();
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
      case "init":
        console.log("Connection Start.");
        this.registerKeyEvent();
        break;
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

  private loop = (): void => {
    // this.render();
    this.animationId = requestAnimationFrame(this.loop);
  };

  public registerKeyEvent = (): void => {
    if (this.onKeyUpRef || this.onKeyDownRef) return;
    let keyflag = false;

    this.onKeyDownRef = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW":
          e.preventDefault();
          this.leftInput.up = true;
          keyflag = true;
          break;
        case "KeyS":
          e.preventDefault();
          this.leftInput.down = true;
          keyflag = true;
          break;
        case "ArrowUp":
          e.preventDefault();
          this.rightInput.up = true;
          keyflag = true;
          break;
        case "ArrowDown":
          e.preventDefault();
          this.rightInput.down = true;
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

  private lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
  }

  private clamp(x: number) {
    return Math.max(0, Math.min(1, x));
  }

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
    const t = this.clamp((targettime - A.time) / dt);
    return {
      ballX: this.lerp(A.ballX, B.ballX, t),
      ballY: this.lerp(A.ballY, B.ballY, t),
      paddleLeftY: this.lerp(A.paddleLeftY, B.paddleLeftY, t),
      paddleRightY: this.lerp(A.paddleRightY, B.paddleRightY, t),
    };
  }

  private init3D = (): void => {
    const canvas = this.canvas;
    //描画エンジンの作成
    this.engine = new BABYLON.Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });
    //Sceneの作成
    this.scene = new BABYLON.Scene(this.engine);
    this.scene.clearColor = new BABYLON.Color4(1, 1, 1, 1.0);
    //Cameraの作成
    this.camera = new BABYLON.ArcRotateCamera(
      "camera",
      -Math.PI / 2,
      Math.PI / 10,
      Math.max(this.width, this.height) * 1.2,
      new BABYLON.Vector3(0, 1, 0),
      this.scene,
    );
    //cameraをcanvasにアタッチする
    this.camera.attachControl(canvas, true);
    //lightの作成
    const light = new BABYLON.HemisphericLight(
      "light",
      new BABYLON.Vector3(0, 1, 0),
      this.scene,
    );
    light.intensity = 0.9;

    //Groundの作成
    const ground = BABYLON.MeshBuilder.CreateGround(
      "ground",
      { width: this.width, height: this.height },
      this.scene,
    );
    const groundMat = new BABYLON.StandardMaterial("groundMat", this.scene);
    groundMat.diffuseColor = new BABYLON.Color3(0, 0, 0);
    ground.material = groundMat;

    //center lineの作成
    const dashedLine = BABYLON.MeshBuilder.CreateDashedLines(
      "dashedLine",
      {
        points: [
          new BABYLON.Vector3(0, 1, -this.height / 2),
          new BABYLON.Vector3(0, 1, this.height / 2),
        ],
        dashSize: this.height / 25,
        gapSize: this.height / 50,
        dashNb: 20,
      },
      this.scene,
    );
    dashedLine.color = new BABYLON.Color3(1, 1, 1);

    //paddleの作成
    //左側パドル
    const yThicness = 1.0;
    const left = BABYLON.MeshBuilder.CreateBox(
      "left",
      {
        width: this.paddleWidth,
        height: yThicness,
        depth: this.paddleHeight,
      },
      this.scene,
    );

    //右側パドル(左側のコピー)
    const right = left.clone("right") as BABYLON.Mesh;
    const lmat = new BABYLON.StandardMaterial("lmat", this.scene);
    lmat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    left.material = lmat;
    right.material = lmat;

    //ball
    const ball = BABYLON.MeshBuilder.CreateSphere(
      "ball",
      {
        diameter: this.ballRadius * 2,
      },
      this.scene,
    );
    const bmat = new BABYLON.StandardMaterial("bmat", this.scene);
    bmat.diffuseColor = new BABYLON.Color3(1, 1, 1);
    ball.material = bmat;

    this.meshes = { left: left, right: right, ball: ball };

    //babylonGUIを使ってscoreやpause, 試合終了時のテキストの描画
    const gui = GUI.AdvancedDynamicTexture.CreateFullscreenUI(
      "UI",
      true,
      this.scene,
    );

    // スコア（左）
    const leftScoreText = new GUI.TextBlock("leftScore");
    leftScoreText.text = "0";
    leftScoreText.color = "#22c553";
    leftScoreText.fontSize = 28;
    leftScoreText.textHorizontalAlignment =
      GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    leftScoreText.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    leftScoreText.top = "16px";
    leftScoreText.left = "-25%"; // 画面幅の25%左側（= 左寄り）
    gui.addControl(leftScoreText);

    // スコア（右）
    const rightScoreText = new GUI.TextBlock("rightScore");
    rightScoreText.text = "0";
    rightScoreText.color = "#22c553";
    rightScoreText.fontSize = 28;
    rightScoreText.textHorizontalAlignment =
      GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    rightScoreText.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    rightScoreText.top = "16px";
    rightScoreText.left = "25%"; // 画面幅の25%右側
    gui.addControl(rightScoreText);

    //pauseの描画
    //pauseを描画するための背景の作成
    const pauseOverlay = new GUI.Rectangle("pauseOverlay");
    pauseOverlay.width = "100%";
    pauseOverlay.height = "100%";
    pauseOverlay.thickness = 0;
    pauseOverlay.background = "rgba(0,0,0,0.75)";
    //pauseではないときは非表示
    pauseOverlay.isVisible = false;
    gui.addControl(pauseOverlay);

    //pauseのテキストを表示
    const pauseText = new GUI.TextBlock("pauseText", "PAUSED");
    pauseText.color = "#FFFFFF";
    pauseText.fontSize = 48;
    pauseText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    pauseText.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    pauseOverlay.addControl(pauseText);

    //試合が買った時のテキストの背景
    const winnerOverlay = new GUI.Rectangle("winnerOverlay");
    winnerOverlay.width = "100%";
    winnerOverlay.height = "100%";
    winnerOverlay.thickness = 0;
    winnerOverlay.background = "rgba(0,0,0,0.75)";
    winnerOverlay.isVisible = false;
    gui.addControl(winnerOverlay);

    // タイトル行
    const winnerTitle = new GUI.TextBlock("winnerTitle", "Winner");
    winnerTitle.color = "#FFFFFF";
    winnerTitle.fontSize = 48;
    winnerTitle.textHorizontalAlignment =
      GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    winnerTitle.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    winnerTitle.top = "-40px";
    winnerOverlay.addControl(winnerTitle);

    // Winner名
    const winnerName = new GUI.TextBlock("winnerName", "");
    winnerName.color = "#FFFFFF";
    winnerName.fontSize = 36;
    winnerName.textHorizontalAlignment =
      GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    winnerName.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    winnerName.top = "10px";
    winnerOverlay.addControl(winnerName);

    // カウントダウン（任意）
    const winnerCountdown = new GUI.TextBlock("winnerCountdown", "");
    winnerCountdown.color = "#AAAAAA";
    winnerCountdown.fontSize = 24;
    winnerCountdown.textHorizontalAlignment =
      GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    winnerCountdown.textVerticalAlignment =
      GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    winnerCountdown.top = "56px";
    winnerOverlay.addControl(winnerCountdown);

    this.scene.onBeforeRenderObservable.add(() => {
      const targettime = performance.now() - this.interpDelay;
      const shot = this.samplePosition(targettime);
      this.syncMeshes({
        ballX: shot?.ballX ?? this.ballX,
        ballY: shot?.ballY ?? this.ballY,
        paddleLeftY: shot?.paddleLeftY ?? this.paddleLeftY,
        paddleRightY: shot?.paddleRightY ?? this.paddleRightY,
      });

      //scoreの更新
      leftScoreText.text = String(this.leftScore);
      rightScoreText.text = String(this.rightScore);

      // Pause表示（試合中のみ）
      pauseOverlay.isVisible = this.isPaused && !this.isFinish;
      // Winner表示（試合終了時）
      winnerOverlay.isVisible = this.isFinish;
      if (this.isFinish) {
        winnerName.text = String(this.winnerId ?? "");
        if (this.finishTime) {
          const elapsed = performance.now() - this.finishTime;
          const remaining = Math.max(0, this.redirectDelay - elapsed);
          const seconds = Math.ceil(remaining / 1000);
          winnerCountdown.text = `Returning in ${seconds}s...`;
        } else {
          winnerCountdown.text = "";
        }
      } else {
        winnerName.text = "";
        winnerCountdown.text = "";
      }
    });
    this.engine?.runRenderLoop(() => this.scene?.render());
    window.addEventListener("resize", () => this.engine?.resize());
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
    this.meshes.left.position = this.twoDtothreeD(leftX2d, leftZ2d);
    const rightX2d = this.width - this.paddleMargin - this.paddleWidth / 2;
    const rightZ2d = paddleRightY + this.paddleHeight / 2;
    this.meshes.right.position = this.twoDtothreeD(rightX2d, rightZ2d);

    // ボール中心
    this.meshes.ball.position = this.twoDtothreeD(ballX, ballY, 1.0);
  };
}
