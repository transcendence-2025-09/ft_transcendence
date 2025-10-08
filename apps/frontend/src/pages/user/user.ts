import type { ElComponent } from "../../factory/componentFactory";
import { componentFactory } from "../../factory/componentFactory";
import { eh } from "../../factory/elementFactory";
import { pageFactory } from "../../factory/pageFactory";
import type { RouteCtx } from "../../routing/routeList";

export const User = (ctx: RouteCtx): ElComponent => {
  console.log(ctx.params);
  console.log(ctx.query.get("tab"));
  console.log(ctx.query.get("page"));
  const titleEl = eh<"div">(
    "div",
    { className: "p-4" },
    `ID is ${ctx.params.id}`,
    `query tab is ${ctx.query.get("tab")}`,
    `query page is ${ctx.query.get("page")}`,
  );

  const Title: ElComponent = componentFactory(titleEl);
  return pageFactory([Title]);
};
