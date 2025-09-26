import type { ElComponent } from "./componentFactory";
import { componentFactory } from "./componentFactory";
import { eh } from "./elementFactory";

export type MainSlot = ElComponent & {
  slotAnchor: Comment;
};

export const mainSlotFactory = (): MainSlot => {
  const el = eh<"main">("main", { tabindex: -1 });
  const slotAnchor = document.createComment("page-slot");
  el.appendChild(slotAnchor);

  const base = componentFactory(el);
  return { ...base, slotAnchor };
};
