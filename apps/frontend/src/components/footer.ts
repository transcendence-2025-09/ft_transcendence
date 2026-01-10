import { componentFactory, type ElComponent, eh } from "@/factory";

const FooterEl = eh<"footer">(
  "footer",
  {
    className: "p-3 border-t text-sm text-gray-600",
  },
  "© 2025 yootsubo, syamasaw, rmatsuba, yxu",
);

export const Footer: ElComponent = componentFactory(FooterEl);
