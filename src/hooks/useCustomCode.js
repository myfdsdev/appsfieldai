import { useEffect } from "react";

// Injects a store owner's custom code (e.g. FB/Google pixel, analytics scripts)
// into the document head and/or end of body. Runs scripts by re-creating <script>
// tags (innerHTML alone won't execute them). Cleans up on unmount / change.
function injectHtml(container, html) {
  if (!html) return;
  const temp = document.createElement("div");
  temp.innerHTML = html;
  const nodes = [];
  Array.from(temp.childNodes).forEach((node) => {
    let el = node;
    if (node.tagName === "SCRIPT") {
      el = document.createElement("script");
      Array.from(node.attributes).forEach((a) => el.setAttribute(a.name, a.value));
      el.text = node.text;
    } else {
      el = node.cloneNode(true);
    }
    container.appendChild(el);
    nodes.push(el);
  });
  return nodes;
}

export function useCustomCode(headCode, bodyCode) {
  useEffect(() => {
    const headNodes = injectHtml(document.head, headCode) || [];
    const bodyNodes = injectHtml(document.body, bodyCode) || [];
    return () => {
      [...headNodes, ...bodyNodes].forEach((n) => n?.parentNode?.removeChild(n));
    };
  }, [headCode, bodyCode]);
}