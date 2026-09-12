export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export function nextFrame(callback) {
  requestAnimationFrame(callback);
}

export function transitionPosition(element, { x, y, duration }) {
  if (!element) return Promise.resolve();

  element.style.transition =
    "left " + duration + "ms cubic-bezier(.2,.8,.2,1), " +
    "top " + duration + "ms cubic-bezier(.2,.8,.2,1)";

  requestAnimationFrame(() => {
    element.style.left = x + "%";
    element.style.top = y + "%";
  });

  return sleep(duration + 40).then(() => {
    element.style.transition = "";
  });
}
