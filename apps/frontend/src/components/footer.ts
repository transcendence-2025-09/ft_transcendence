import type { ElComponent } from "../factory/componentFactory";
import { componentFactory } from "../factory/componentFactory";
import { eh } from "../factory/elementFactory";

const FooterEl = eh<"footer">(
  "footer",
  {
    className: "p-3 border-t text-sm text-gray-600",
  },
  "© 2025 R.Matsuba",
);

export const Footer: ElComponent = componentFactory(FooterEl);
