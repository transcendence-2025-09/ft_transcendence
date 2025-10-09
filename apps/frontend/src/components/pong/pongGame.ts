import type { ElComponent } from "../../factory/componentFactory";
import { componentFactory } from "../../factory/componentFactory";
import { eh } from "../../factory/elementFactory";

export const pongGame = (): ElComponent => {
  const canvas = eh("canvas", {
    width: "1000",
    height: "700",
    id: "game",
    className: "mx-auto block bg-black rounded-lg shadow-lg",
  });

  const base = componentFactory(canvas);
  return {
    ...base,
    mount(target: Element, anchor = null) {
      base.mount(target, anchor);
      renderScene(canvas);
    },
  };
};

export type RenderOption = {
  leftY?: number;
  rightY?: number;
  ballX?: number;
  ballY?: number;
  paddleW?: number;
  paddleH?: number;
  paddleMargin?: number;
  ballSize?: number;
};

export const renderScene = (canvas: HTMLCanvasElement, opts?: RenderOption) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  //塗りつぶし
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

  const paddleW = opts?.paddleW ?? 12;
  const paddleH = opts?.paddleH ?? 96;
  const paddleGap = opts?.paddleMargin ?? 24;
  const ballSize = opts?.ballSize ?? 12;

  const defaultPaddleY = (height - paddleH) / 2;
  const leftY = opts?.leftY ?? defaultPaddleY;
  const rightY = opts?.rightY ?? defaultPaddleY;

  const defaulBallX = width / 2;
  const defaulBallY = height / 2;

  const ballX = opts?.ballX ?? defaulBallX;
  const ballY = opts?.ballY ?? defaulBallY;

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(paddleGap, leftY, paddleW, paddleH);
  ctx.fillRect(width - paddleGap - paddleW, rightY, paddleW, paddleH);
  //ボールの描画
  ctx.beginPath();
  ctx.arc(ballX, ballY, ballSize, 0, Math.PI * 2);
  ctx.fill();
};
