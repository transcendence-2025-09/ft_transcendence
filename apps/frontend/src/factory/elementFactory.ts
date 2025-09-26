//HTML tagの型を取得
export type TagName = keyof HTMLElementTagNameMap;
export type Attr = string | number | boolean | undefined | null;

//引数の型定義
export type PropsType = Readonly<Record<string, Attr>>;
export type ChildType = string | number | Node;

//型ジェネリクスを使って作成する要素ごとに違う型で生成する。propsはtailwindcssのclassNameとかを同じような感じで追加できる。
//他の属性も可能。childには再帰的にchを呼び出して追加していけるし、普通にテキストの追加もできる
//ehはelementHelperの略です
export const eh = <K extends TagName>(
  type: K,
  props?: PropsType,
  ...children: ChildType[]
): HTMLElementTagNameMap[K] => {
  const el: HTMLElementTagNameMap[K] = document.createElement(type);

  //propsの処理
  if (props) {
    for (const [key, value] of Object.entries(props)) {
      if (value === null || value === undefined || value === false) continue;
      else if (value === true) {
        el.setAttribute(key, "");
      } else if (key === "className") {
        el.setAttribute("class", String(value));
      } else {
        el.setAttribute(key, String(value));
      }
    }
  }

  for (const child of children) {
    if (typeof child === "string" || typeof child === "number")
      el.appendChild(document.createTextNode(String(child)));
    else {
      el.appendChild(child);
    }
  }
  return el;
};
