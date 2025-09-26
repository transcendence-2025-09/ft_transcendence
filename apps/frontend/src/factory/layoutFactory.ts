import type { ElComponent } from "./componentFactory";
import { eh } from "./elementFactory";
import type { MainSlot } from "./mainSlotFactory";

export type LayoutProps = {
  header: ElComponent;
  main: MainSlot;
  footer: ElComponent;
};

export type Layout = ElComponent & {
  setPage: (page: ElComponent) => void;
};

//propsとして渡されるmainはmainFactoryで作られたもの。layoutの中ではsetPageでページを変更する。
export const layoutFactory = (props: LayoutProps): Layout => {
  const container: HTMLElement = eh<"div">("div", { id: "layout" });
  let mounted: boolean = false;
  let currentPage: ElComponent | null = null;

  return {
    el: container,
    mount(target, anchor = null) {
      if (mounted) return;
      //まずはcontainerにheader, main, footerを積む
      container.append(props.header.el, props.main.el, props.footer.el);
      //それをtarget(#app)にinsert
      target.insertBefore(container, anchor);
      //各componentをmount
      props.header.mount(container);
      props.main.mount(container);
      props.footer.mount(container);
      mounted = true;
    },
    unmount() {
      if (!mounted) return;
      //unmountは逆順に行なっていく
      currentPage?.unmount();
      props.footer.unmount();
      props.main.unmount();
      props.header.unmount();
      container.remove();
      currentPage = null;
      mounted = false;
    },

    setPage(next: ElComponent) {
      if (currentPage) currentPage.unmount();
      next.mount(props.main.el, props.main.slotAnchor);
      currentPage = next;
    },
  };
};
