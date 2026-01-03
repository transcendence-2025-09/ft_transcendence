import { eh } from "@/factory";

export const modalOverlayEl = eh("div", {
  className:
    "fixed inset-0 z-50 hidden flex items-center justify-center bg-black/40 px-4 py-8 backdrop-blur-sm",
});

const modalContainerEl = eh("div", {
  className: "relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl",
});

const modalCloseButtonEl = eh(
  "button",
  {
    type: "button",
    className:
      "absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
    ariaLabel: "閉じる",
  },
  "×",
);

const modalTitleEl = eh(
  "h2",
  { className: "text-lg font-semibold text-gray-900" },
  "",
);

const modalBodyEl = eh("div", { className: "mt-4" });

modalContainerEl.append(modalCloseButtonEl, modalTitleEl, modalBodyEl);
modalOverlayEl.append(modalContainerEl);

export const closeModal = () => {
  modalOverlayEl.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
};

modalCloseButtonEl.addEventListener("click", closeModal);

modalOverlayEl.addEventListener("click", (event) => {
  if (event.target === modalOverlayEl) {
    closeModal();
  }
});

export const openModal = (title: string, content: HTMLElement) => {
  modalTitleEl.textContent = title;
  modalBodyEl.replaceChildren(content);
  modalOverlayEl.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
};
