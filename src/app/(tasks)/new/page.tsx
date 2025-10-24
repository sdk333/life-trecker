"use client";

import { useRef, useLayoutEffect } from "react";

export default function QuickTaskPage() {
  const inputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (
            entry.isIntersecting &&
            /Mobi|Android/i.test(navigator.userAgent)
          ) {
            // Фокус только на мобильных и при видимости
            setTimeout(() => inputRef.current?.focus(), 200);
          }
        });
      },
      { threshold: 0.5 } // Фокус, когда 50% элемента видно
    );

    if (inputRef.current) observer.observe(inputRef.current);
    return () => observer.disconnect();
  }, []);

  return <input ref={inputRef} type="text" placeholder="Введите текст" />;
}
