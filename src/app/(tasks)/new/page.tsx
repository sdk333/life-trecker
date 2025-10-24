// components/SmartAutoFocus.tsx
"use client";

import { useEffect, useRef, useState } from "react";

export default function QuickTaskPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Определяем мобильное устройство
    const checkMobile = () => {
      return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    };

    setIsMobile(checkMobile());
  }, []);

  useEffect(() => {
    if (!inputRef.current || !isMobile) return;

    const focusInput = () => {
      const input = inputRef.current;
      if (!input) return;

      // Пытаемся сфокусироваться
      input.focus();

      // Для iOS иногда нужно дополнительное действие
      setTimeout(() => {
        input.focus();

        // Создаем и диспатчим событие touchstart для iOS
        const touchEvent = new TouchEvent("touchstart", {
          bubbles: true,
          cancelable: true,
        });
        input.dispatchEvent(touchEvent);
      }, 100);
    };

    // Фокус при загрузке
    focusInput();

    // Также фокус при клике на страницу (для PWA)
    const handlePageClick = () => {
      setTimeout(focusInput, 50);
    };

    document.addEventListener("click", handlePageClick);

    return () => {
      document.removeEventListener("click", handlePageClick);
    };
  }, [isMobile]);

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="text" // Указываем тип клавиатуры для мобильных
      enterKeyHint="done" // Подсказка для кнопки Enter
      className="w-full p-4 text-base border-2 border-blue-300 rounded-xl focus:outline-none focus:border-blue-500"
      placeholder="Начните вводить текст..."
    />
  );
}
