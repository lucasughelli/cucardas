import { create } from "zustand";

type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

export const useThemeStore = create<ThemeState>((set) => {
  const saved = localStorage.getItem("theme") as Theme | null;
  const initial = saved || "system";

  if (initial === "system") {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  } else {
    document.documentElement.setAttribute("data-theme", initial);
  }

  return {
    theme: initial,
    setTheme: (t) => {
      localStorage.setItem("theme", t);
      if (t === "system") {
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
      } else {
        document.documentElement.setAttribute("data-theme", t);
      }
      set({ theme: t });
    },
  };
});
