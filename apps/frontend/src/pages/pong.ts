import { pongBackGroundFactory } from "../components/pong/pongBackGround";
import { pongGame } from "../components/pong/pongGame";
import { pongHeader } from "../components/pong/pongHeader";
import { pongPlayerRow } from "../components/pong/pongPlayerRow";
import { pageFactory } from "../factory/pageFactory";

//pong pageを積むためのbackground
const pongBg = pongBackGroundFactory();

//pongBgの中にあるコンテナ
const content = pongBg.el.querySelector("#pong-container") as HTMLDivElement;
const header = pongHeader();
const playerLow = pongPlayerRow();
const canvas = pongGame();

header.mount(content);
playerLow.mount(content);
canvas.mount(content);

export const pongPage = pageFactory([pongBg]);
