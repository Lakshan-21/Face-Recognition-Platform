import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true); // Default to dark mode

  useEffect(() => {
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem("theme");
    const initialTheme = savedTheme ? savedTheme === "dark" : true;
    setIsDark(initialTheme);
    updateTheme(initialTheme);
  }, []);

  const updateTheme = (dark: boolean) => {
    const root = document.documentElement;
    const body = document.body;
    
    if (dark) {
      root.classList.add("dark");
      body.style.backgroundColor = "#000000";
      body.style.color = "#ffffff";
    } else {
      root.classList.remove("dark");
      body.style.backgroundColor = "#ffffff";
      body.style.color = "#0f1419";
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
    updateTheme(newTheme);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className={`w-9 h-9 p-0 bg-transparent transition-colors duration-200 ${
        isDark 
          ? "text-[#ffffff] hover:bg-gray-800 hover:text-[#1d9bf0]" 
          : "text-[#0f1419] hover:bg-gray-100 hover:text-[#1d9bf0]"
      }`}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}