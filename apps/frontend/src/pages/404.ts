import { componentFactory, type ElComponent, eh, pageFactory } from "@/factory";

const titleEl = eh<"div">("div", {}, eh<"p">("p", {}, "404 Not Found."));

const Title: ElComponent = componentFactory(titleEl);

export const NotFound = pageFactory([Title]);

export const NotFoundFactory = () => {
  return pageFactory([Title]);
};
