import { Colors } from "@/constants/theme";

export function useTheme() {
  const theme = Colors.dark;

  return {
    theme,
    isDark: true,
    colors: Colors,
  };
}
