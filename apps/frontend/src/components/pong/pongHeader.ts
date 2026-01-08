import { componentFactory, type ElComponent, eh } from "@/factory";

export const pongHeader = (): ElComponent => {
  const header = eh("div", {
    className:
      "w-full flex justify-start items-center h-12 px-0 flex-shrink-0 border-b border-white/10",
  });

  const button = eh("button", {
    className:
      "text-sm text-white/70 hover:text-white transition inline-flex items-center gap-1",
  });

  button.append(document.createTextNode("←Back"));
  button.addEventListener("click", () => {
    const confirmed = confirm("ゲームを終了しますか?(敗北になります)");
    if (confirmed) {
      history.back();
    }
  });

  header.appendChild(button);
  return componentFactory(header);
};
