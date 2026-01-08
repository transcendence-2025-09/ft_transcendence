import { componentFactory, type ElComponent, eh } from "@/factory";

export const pongBackGroundFactory = (): ElComponent => {
  const root = eh("div", {
    className:
      "h-dvh flex flex-col items-center justify-center text-white diagonal-bg overflow-hidden",
  });

  const content = eh("div", {
    className:
      "w-full h-full flex flex-col items-center justify-center px-4 sm:px-6 gap-4",
    id: "pong-container",
  });
  const slotAnchor = document.createComment("pong-slot");
  content.appendChild(slotAnchor);
  root.appendChild(content);
  ensureDiagonalBgStyle();
  const base = componentFactory(root);
  return base;
};

//背景のグラデーション
const ensureDiagonalBgStyle = () => {
  const id = "pong-diagonal-bg-style";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = `
		.diagonal-bg {
			background-image:
			repeating-linear-gradient(
					45deg,
					#031409 0,
					#031409 500px,
					#000000 500px,
					#000000 1000px 
				);
			background-blend-mode: overlay; /* 下地と帯をミックス */
		}
	`;
  document.head.appendChild(style);
};
