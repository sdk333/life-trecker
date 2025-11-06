"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Декларация типов для нестандартных свойств
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
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Обновлённая логика автофокуса с новыми методами
  useEffect(() => {
    if (!isLoading) {
      const isPWA =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true;
      const isMobile = /Mobi|Android/i.test(navigator.userAgent);

      if (isMobile && isPWA && inputRef.current) {
        const focusInput = () => {
          const input = inputRef.current;
          if (!input) return;

          // Шаг 1: Прокрутка в вид (хак для viewport)
          input.scrollIntoView({ behavior: "smooth", block: "center" });

          // Шаг 2: Используем requestAnimationFrame для синхронизации с рендером
          requestAnimationFrame(() => {
            // Шаг 3: Программный клик (старый хак) + select вместо focus
            input.click();
            setTimeout(() => {
              input.select(); // Выделяет текст и фокусирует (альтернатива focus)
            }, 50);
          });
        };

        // Фокус после полной загрузки страницы (document.readyState)
        if (document.readyState === "complete") {
          setTimeout(focusInput, 100);
        } else {
          window.addEventListener("load", () => setTimeout(focusInput, 100));
        }

        // Дополнительно: фокус при активации PWA (visibilitychange)
        const handleVisibilityChange = () => {
          if (document.visibilityState === "visible") {
            setTimeout(focusInput, 200);
          }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
          document.removeEventListener(
            "visibilitychange",
            handleVisibilityChange
          );
          window.removeEventListener("load", () => {});
        };
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
    // После сохранения: фокус с select
    setTimeout(() => inputRef.current?.select(), 100);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col">
      <div className="max-w-md mx-auto w-full mt-10">
        <h1 className="text-xl font-semibold mb-4">
          Какая мысль пришла сегодня?
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg"
            disabled={isSaving}
            autoFocus // Добавлено: атрибут autofocus для попытки фокуса
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
