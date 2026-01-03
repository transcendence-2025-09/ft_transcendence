import { componentFactory, type ElComponent, eh, pageFactory } from "@/factory";

const titleEl = eh<"div">("div", { className: "p-4" }, "This is ABOUT page.");
const textEl = eh<"div">(
  "div",
  { className: "p-4" },
  "Switch via header buttons.",
);

const linkEl = eh<"a">(
  "a",
  { href: "/", className: "text-blue-500", target: "_self" },
  "Home Page",
);
const Title: ElComponent = componentFactory(titleEl);
const Text: ElComponent = componentFactory(textEl);
const Link: ElComponent = componentFactory(linkEl);

export const About = pageFactory([Title, Text, Link]);
