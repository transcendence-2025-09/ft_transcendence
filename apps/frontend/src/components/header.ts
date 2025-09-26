import type { ElComponent } from "../factory/componentFactory";
import { componentFactory } from "../factory/componentFactory";
import { eh } from "../factory/elementFactory";

const HeaderEl = eh<"header">(
  "header",
  { className: "p-3 border-b flex items-center justify-between" },
  eh("h1", { className: "text-xl font-bold" }, "Demo Layout"),
  eh(
    "nav",
    { className: "flex gap-2" },
    eh(
      "button",
      { className: "px-3 py-1 border rounded", "data-page": "home" },
      "Home",
    ),
    eh(
      "button",
      { className: "px-3 py-1 border rounded", "data-page": "about" },
      "About",
    ),
  ),
);

export const Header: ElComponent = componentFactory(HeaderEl);
