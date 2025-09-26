import type { ElComponent } from "./componentFactory";

export const pageFactory = (children: ElComponent[]): ElComponent => {
  const container: HTMLDivElement = document.createElement("div");
  let mounted: boolean = false;

  return {
    el: container,
    mount(target: Element, anchor = null) {
      if (mounted) return;
      target.insertBefore(container, anchor);
      for (const child of children) {
        child.mount(container);
      }
      mounted = true;
    },

    unmount() {
      if (!mounted) return;
      for (const child of children) {
        child.unmount();
      }
      container.remove();
      mounted = false;
    },
  };
};
