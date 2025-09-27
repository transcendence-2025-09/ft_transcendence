import type { ElComponent } from "../factory/componentFactory";
import { componentFactory } from "../factory/componentFactory";
import { eh } from "../factory/elementFactory";
import { pageFactory } from "../factory/pageFactory";

const titleEl = eh<"div">("div", {}, eh<"p">("p", {}, "404 Not Found."));

const Title: ElComponent = componentFactory(titleEl);

export const NotFound = pageFactory([Title]);

export const NotFoundFactory = () => {
  return pageFactory([Title]);
};
