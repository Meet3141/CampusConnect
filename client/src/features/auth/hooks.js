import { useEffect } from "react";

export const useSyneFont = () => {
  useEffect(() => {
    if (document.getElementById("syne-font")) return;
    const link = document.createElement("link");
    link.id = "syne-font";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap";
    document.head.appendChild(link);
  }, []);
};