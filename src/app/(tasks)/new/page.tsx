"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

export default function QuickTaskPage() {
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null); // Добавлено для рефа инпута

  // Проверяем авторизацию при загрузке
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  // Новая логика автофокуса: только на мобильном в PWA-режиме с хаком
  useEffect(() => {
    if (!isLoading) {
      const isPWA =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true; // Теперь без any — используем декларацию выше
      const isMobile = /Mobi|Android/i.test(navigator.userAgent); // Детекция мобильного

      if (isMobile && isPWA && inputRef.current) {
        // Хак: программный клик для симуляции взаимодействия, затем фокус
        const focusInput = () => {
          inputRef.current?.click(); // Симулирует тап (обходит блокировку)
          setTimeout(() => inputRef.current?.focus(), 50); // Небольшая задержка после клика
        };

        // Фокус сразу после загрузки (для start_url)
        setTimeout(focusInput, 100); // Даём время на рендер

        // Дополнительно: фокус при активации PWA (из фона или после сворачивания)
        const handleVisibilityChange = () => {
          if (document.visibilityState === "visible") {
            setTimeout(focusInput, 200); // Задержка для стабильности
          }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () =>
          document.removeEventListener(
            "visibilitychange",
            handleVisibilityChange
          );
      }
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Проверка сессии...
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    const { error } = await supabase.from("tasks").insert({ title });
    setIsSaving(false);

    if (error) {
      console.error("Ошибка:", error);
      alert("Не удалось сохранить задачу: " + error.message);
      return;
    }

    setTitle("");
    toast.success("Идея сохранена!");
    // После сохранения снова фокусируемся (теперь с рефом)
    setTimeout(() => inputRef.current?.focus(), 100);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col">
      <div className="max-w-md mx-auto w-full mt-10">
        <h1 className="text-xl font-semibold mb-4">Что нужно зафиксировать?</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            ref={inputRef} // Добавлено для доступа к DOM-элементу
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg"
            disabled={isSaving}
            // placeholder="Например: купить молоко"
          />
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={isSaving}>
              {isSaving ? "Сохраняю..." : "Сохранить"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.push("/dashboard")}
            >
              В меню
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
