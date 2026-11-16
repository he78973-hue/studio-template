import { useEffect } from "react";

export function useInputModality() {
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.dataset.focusModality;
    const set = (mode) => {
      if (root.dataset.focusModality !== mode)
        root.dataset.focusModality = mode;
    };
    const pointer = () => set("pointer");
    const keyboard = (event) => {
      if (!["Shift", "Control", "Alt", "Meta"].includes(event.key))
        set("keyboard");
    };
    set("keyboard");
    document.addEventListener("pointerdown", pointer, true);
    document.addEventListener("keydown", keyboard, true);
    return () => {
      document.removeEventListener("pointerdown", pointer, true);
      document.removeEventListener("keydown", keyboard, true);
      if (previous === undefined) delete root.dataset.focusModality;
      else root.dataset.focusModality = previous;
    };
  }, []);
}
