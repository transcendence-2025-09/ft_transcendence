import type { ElComponent } from "../factory/componentFactory";
import { componentFactory } from "../factory/componentFactory";
import { eh } from "../factory/elementFactory";
import { pageFactory } from "../factory/pageFactory";

const titleEl = eh<"div">("div", { className: "p-4" }, "This is HOME page.");
const textEl = eh<"div">(
  "div",
  { className: "p-4" },
  "Mount / Unmount test is working",
);

const Title: ElComponent = componentFactory(titleEl);
const Text: ElComponent = componentFactory(textEl);

export const Home = pageFactory([Title, Text]);
