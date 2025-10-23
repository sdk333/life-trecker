// src/app/(tasks)/new/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Session } from "@supabase/supabase-js";

export default function QuickTaskPage() {
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Проверяем авторизацию
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/login");
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  // Фокус + открытие клавиатуры после загрузки
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      // Небольшая задержка для надёжности в PWA
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        // На некоторых Android-устройствах помогает принудительный вызов
        if (typeof window !== "undefined" && "scrollIntoView" in window) {
          inputRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 300);

      return () => clearTimeout(timer);
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
    // Опционально: снова фокус после сохранения
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col">
      <div className="max-w-md mx-auto w-full mt-10">
        <h1 className="text-xl font-semibold mb-4">Что нужно зафиксировать?</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg py-6 px-4"
            disabled={isSaving}
            // Убираем placeholder — он мешает фокусу на некоторых устройствах
          />
          <div className="flex gap-2">
            <Button
              type="submit"
              className="flex-1"
              disabled={isSaving || !title.trim()}
            >
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
