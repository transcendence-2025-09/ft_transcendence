import type { ElComponent } from "../factory/componentFactory";
import { componentFactory } from "../factory/componentFactory";
import { eh } from "../factory/elementFactory";
import { pageFactory } from "../factory/pageFactory";

const titleEl = eh<"div">("div", { className: "p-4" }, "This is ABOUT page.");
const textEl = eh<"div">(
  "div",
  { className: "p-4" },
  "Switch via header buttons.",
);

const Title: ElComponent = componentFactory(titleEl);
const Text: ElComponent = componentFactory(textEl);

export const About = pageFactory([Title, Text]);
