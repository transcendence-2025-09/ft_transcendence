import * as BABYLON from "@babylonjs/core";

export const makeEngine = (canvas: HTMLCanvasElement) => {
  const engine = new BABYLON.Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
  });
  return engine;
};

export const makeScene = (engine: BABYLON.Engine): BABYLON.Scene => {
  const scene = new BABYLON.Scene(engine);
  //暗めの背景色
  scene.clearColor = new BABYLON.Color4(0.02, 0.04, 0.1, 1.0);
  return scene;
};

export const makeCamera = (
  scene: BABYLON.Scene,
  width: number,
  height: number,
): BABYLON.ArcRotateCamera => {
  const camera = new BABYLON.ArcRotateCamera(
    "camera",
    //元の alpha（横方向の角度）
    -Math.PI / 2,
    //元の beta（縦方向の角度）
    Math.PI / 10,
    //元の半径（距離）
    Math.max(width, height) * 1.2,
    // 注視点 (シーンの中心)
    new BABYLON.Vector3(0, 1, 0),
    scene,
  );
  camera.lowerRadiusLimit = Math.max(width, height) * 1.1;
  camera.upperRadiusLimit = Math.max(width, height) * 1.8;
  camera.wheelDeltaPercentage = 0.01;
  camera.panningSensibility = 2000;
  return camera;
};

export const makeHemiSphereLight = (scene: BABYLON.Scene) => {
  const hemiLight = new BABYLON.HemisphericLight(
    "hemi",
    new BABYLON.Vector3(0, 1, 0),
    scene,
  );
  hemiLight.intensity = 0.6;
  return hemiLight;
};

export const makeDirLight = (scene: BABYLON.Scene) => {
  const dirLight = new BABYLON.DirectionalLight(
    "dir",
    new BABYLON.Vector3(-0.5, -1, -0.2),
    scene,
  );
  dirLight.position = new BABYLON.Vector3(0, 20, 0);
  dirLight.intensity = 0.45;
  return dirLight;
};

export const makeGlowLight = (scene: BABYLON.Scene) => {
  const glow = new BABYLON.GlowLayer("glow", scene);
  glow.intensity = 0.7;
  return glow;
};

export const makeGround = (
  scene: BABYLON.Scene,
  width: number,
  height: number,
) => {
  const ground = BABYLON.MeshBuilder.CreateGround(
    "ground",
    { width: width, height: height },
    scene,
  );
  return ground;
};

export const makeGroundMaterial = (scene: BABYLON.Scene) => {
  const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
  groundMat.diffuseColor = new BABYLON.Color3(0.05, 0.08, 0.14);
  groundMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
  groundMat.emissiveColor = new BABYLON.Color3(0.02, 0.04, 0.08);
  return groundMat;
};

export const makeDashLine = (scene: BABYLON.Scene, height: number) => {
  const dashedLine = BABYLON.MeshBuilder.CreateDashedLines(
    "dashedLine",
    {
      points: [
        new BABYLON.Vector3(0, 1.01, -height / 2),
        new BABYLON.Vector3(0, 1.01, height / 2),
      ],
      dashSize: height / 28,
      gapSize: height / 60,
      dashNb: 28,
    },
    scene,
  );
  dashedLine.color = new BABYLON.Color3(0.5, 0.5, 0.8);
  return dashedLine;
};

export const makePaddle = (
  scene: BABYLON.Scene,
  width: number,
  height: number,
  name: string,
) => {
  const yThickness = 1.0;
  const paddle = BABYLON.MeshBuilder.CreateBox(
    name,
    { width: width, height: yThickness, depth: height },
    scene,
  );
  return paddle;
};

export const makePaddleMaterial = (scene: BABYLON.Scene) => {
  const paddleMat = new BABYLON.StandardMaterial("paddleMat", scene);
  paddleMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.25);
  paddleMat.emissiveColor = new BABYLON.Color3(0.2, 0.9, 0.6);
  paddleMat.specularPower = 64;
  return paddleMat;
};

export const makeBall = (scene: BABYLON.Scene, ballRadius: number) => {
  const ball = BABYLON.MeshBuilder.CreateSphere(
    "ball",
    {
      diameter: ballRadius * 2,
      segments: 24,
    },
    scene,
  );
  return ball;
};

export const makeBallMaterial = (scene: BABYLON.Scene) => {
  const ballMat = new BABYLON.StandardMaterial("ballMat", scene);
  ballMat.diffuseColor = new BABYLON.Color3(0.95, 0.95, 1.0);
  ballMat.emissiveColor = new BABYLON.Color3(1.0, 0.8, 0.3); // ちょいオレンジ系
  ballMat.specularPower = 96;
  return ballMat;
};

export const makeBallShadow = (scene: BABYLON.Scene, ballRadius: number) => {
  const ballShadow = BABYLON.MeshBuilder.CreateDisc(
    "ballShadow",
    { radius: ballRadius * 0.9, tessellation: 24 },
    scene,
  );
  ballShadow.rotation.x = Math.PI / 2;
  ballShadow.position.y = 0.01;
  return ballShadow;
};

export const makeBallShadowMaterial = (scene: BABYLON.Scene) => {
  const shadowMat = new BABYLON.StandardMaterial("shadowMat", scene);
  shadowMat.diffuseColor = new BABYLON.Color3(0, 0, 0);
  shadowMat.alpha = 0.35;
  return shadowMat;
};
