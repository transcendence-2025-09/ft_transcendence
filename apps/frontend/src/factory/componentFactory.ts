//この型がcomponentFactoryが返すオブジェクトの型。
//描画されるHTMLElementのelとそのmount, unmountを制御するmethodがプロパティとして存在する
export type ElComponent<T extends HTMLElement = HTMLElement> = {
  el: T;
  mount: (target: Element, anchor?: Node | null) => void;
  unmount: () => void;
};

//実際にコンポーネントを作成するアロー関数。
//先にelementFactoryでelを作っておいて引数に渡す

//この先ctxを受け取れるようにする必要あり。
export const componentFactory = <T extends HTMLElement = HTMLElement>(
  el: T,
): ElComponent<T> => {
  let mounted = false;
  let savedAnchor: Node | null = null;

  return {
    el,
    mount(target: Element, anchor?: Node | null) {
      if (!mounted) {
        if (anchor !== undefined) savedAnchor = anchor;
        if (!mounted) {
          target.insertBefore(el, savedAnchor ?? null);
          mounted = true;
        }
      }
    },
    unmount() {
      if (mounted) {
        el.remove();
        mounted = false;
      }
    },
  };
};
