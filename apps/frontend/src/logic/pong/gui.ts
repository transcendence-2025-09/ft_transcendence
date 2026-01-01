import * as GUI from "@babylonjs/gui";
import * as BABYLON from "@babylonjs/core";

export const makeGUI = (scene: BABYLON.Scene) => {
  const gui = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);
  return gui;
};

export const makeScorebarGUI = () => {
  const scoreBar = new GUI.Rectangle("scoreBar");
  scoreBar.width = "60%";
  scoreBar.height = "64px";
  scoreBar.cornerRadius = 18;
  scoreBar.thickness = 0;
  scoreBar.background = "rgba(15,23,42,0.85)"; // #0f172a 相当
  scoreBar.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
  scoreBar.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
  scoreBar.top = "16px";
  return scoreBar;
};

export const makeScoreGridGUI = () => {
  const scoreGrid = new GUI.Grid("scoreGrid");
  scoreGrid.width = "100%";
  scoreGrid.height = "100%";
  scoreGrid.addRowDefinition(0.62);
  scoreGrid.addRowDefinition(0.38);
  scoreGrid.addColumnDefinition(1);
  return scoreGrid;
};

export const makeScoreRowGUI = () => {
  const scoreRow = new GUI.Grid("scoreRow");
  scoreRow.addColumnDefinition(0.5);
  scoreRow.addColumnDefinition(0.5);
  return scoreRow;
};

export const makeLeftScoreContanerGUI = () => {
  const leftScoreContainer = new GUI.Rectangle("leftScoreContainer");
  leftScoreContainer.thickness = 0;
  leftScoreContainer.background = "transparent";
  leftScoreContainer.horizontalAlignment =
    GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
  return leftScoreContainer;
};

export const makeRightScoreContanerGUI = () => {
  const rightScoreContainer = new GUI.Rectangle("rightScoreContainer");
  rightScoreContainer.thickness = 0;
  rightScoreContainer.background = "transparent";
  rightScoreContainer.horizontalAlignment =
    GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
  return rightScoreContainer;
};

export const makeReadyRowGUI = () => {
  const readyRow = new GUI.Grid("readyRow");
  readyRow.width = "100%";
  readyRow.height = "100%";
  readyRow.addColumnDefinition(0.5);
  readyRow.addColumnDefinition(0.5);
  return readyRow;
};

export const makeLeftReadyTextGUI = () => {
  const leftReadyText = new GUI.TextBlock("leftReadyText", "");
  leftReadyText.fontSize = 18;
  leftReadyText.fontWeight = "700";
  leftReadyText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
  leftReadyText.paddingLeft = "24px";
  return leftReadyText;
};

export const makeRightReadyTextGUI = () => {
  const rightReadyText = new GUI.TextBlock("rightReadyText", "");
  rightReadyText.fontSize = 18;
  rightReadyText.fontWeight = "700";
  rightReadyText.textHorizontalAlignment =
    GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
  rightReadyText.paddingRight = "24px";
  return rightReadyText;
};

export const makeLeftScoreTextGUI = () => {
  const leftScoreText = new GUI.TextBlock("leftScore");
  leftScoreText.text = "0";
  leftScoreText.color = "#4ade80";
  leftScoreText.fontSize = 32;
  leftScoreText.fontWeight = "700";
  leftScoreText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
  leftScoreText.paddingLeft = "24px";
  return leftScoreText;
};

export const makeRightScoreTextGUI = () => {
  const rightScoreText = new GUI.TextBlock("rightScore");
  rightScoreText.text = "0";
  rightScoreText.color = "#22d3ee"; // cyan系
  rightScoreText.fontSize = 32;
  rightScoreText.fontWeight = "700";
  rightScoreText.textHorizontalAlignment =
    GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
  rightScoreText.paddingRight = "24px";
  return rightScoreText;
};

export const makeWinnerOverlayGUI = () => {
  const winnerOverlay = new GUI.Rectangle("winnerOverlay");
  winnerOverlay.width = "100%";
  winnerOverlay.height = "100%";
  winnerOverlay.thickness = 0;
  winnerOverlay.background = "rgba(15,23,42,0.90)";
  winnerOverlay.isVisible = false;
  return winnerOverlay;
};

export const makeWinnerTitleGUI = () => {
  const winnerTitle = new GUI.TextBlock("winnerTitle", "Winner");
  winnerTitle.color = "#e5e7eb";
  winnerTitle.fontSize = 40;
  winnerTitle.fontWeight = "700";
  winnerTitle.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
  winnerTitle.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
  winnerTitle.top = "-32px";
  return winnerTitle;
};

export const makeWinnerNameGUI = () => {
  const winnerName = new GUI.TextBlock("winnerName", "");
  winnerName.color = "#f97316";
  winnerName.fontSize = 32;
  winnerName.fontWeight = "700";
  winnerName.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
  winnerName.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
  winnerName.top = "10px";
  return winnerName;
};

export const makeWinnerCountdownGUI = () => {
  const winnerCountdown = new GUI.TextBlock("winnerCountdown", "");
  winnerCountdown.color = "#9ca3af";
  winnerCountdown.fontSize = 22;
  winnerCountdown.textHorizontalAlignment =
    GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
  winnerCountdown.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
  winnerCountdown.top = "52px";
  return winnerCountdown;
};
