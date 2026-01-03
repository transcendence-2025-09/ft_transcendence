import { componentFactory, type ElComponent, eh } from "@/factory";

export const pongHeader = (): ElComponent => {
  const header = eh("div", {
    className:
      "w-full flex justify-start items-center h-12 px-4 sm:px-6 \
		border-b border-white/10",
  });

  const button = eh("button", {
    className:
      "text-sm text-white/70 hover:text-white transition \
		inline-flex items-center gap-1",
  });

  const arrow = document.createTextNode("←");
  const text = document.createTextNode("Back");
  button.append(arrow, text);
  button.addEventListener("click", () => {
    history.back();
  });

  header.appendChild(button);
  return componentFactory(header);
};
