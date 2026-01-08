import type { ElComponent } from "./componentFactory";
import { eh } from "./elementFactory";
import type { MainSlot } from "./mainSlotFactory";

export type LayoutProps = {
  header: ElComponent;
  main: MainSlot;
};

export type Layout = ElComponent & {
  setPage: (page: ElComponent | Promise<ElComponent>) => void;
};

//propsとして渡されるmainはmainFactoryで作られたもの。layoutの中ではsetPageでページを変更する。
export const layoutFactory = (props: LayoutProps): Layout => {
  const container: HTMLElement = eh<"div">("div", {
    className: "min-h-dvh flex flex-col",
    id: "layout",
  });
  let mounted: boolean = false;
  let currentPage: ElComponent | null = null;

  return {
    el: container,
    mount(target, anchor = null) {
      if (mounted) return;
      //まずはcontainerにheader, mainを積む
      container.append(props.header.el, props.main.el);
      //それをtarget(#app)にinsert
      target.insertBefore(container, anchor);
      //各componentをmount
      props.header.mount(container);
      props.main.mount(container);
      mounted = true;
    },
    unmount() {
      if (!mounted) return;
      //unmountは逆順に行なっていく
      currentPage?.unmount();
      props.main.unmount();
      props.header.unmount();
      container.remove();
      currentPage = null;
      mounted = false;
    },

    setPage(next: ElComponent | Promise<ElComponent>) {
      if (currentPage) {
        currentPage.unmount();
        currentPage = null;
      }
      Promise.resolve(next).then((resolved) => {
        resolved.mount(props.main.el, props.main.slotAnchor);
        //非同期が終わった要素だけ代入
        currentPage = resolved;
      });
    },
  };
};
