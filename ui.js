export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export function setText(element, value) {
  if (element) element.textContent = value;
}

export function toggleHidden(element, hidden) {
  if (element) element.hidden = hidden;
}

export function restartCssAnimation(element, className) {
  if (!element) return;
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
}
