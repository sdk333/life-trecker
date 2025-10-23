// src/app/quick-task/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function QuickTaskPage() {
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null); // ← ссылка на input

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

  // Устанавливаем фокус на поле ввода после загрузки
  useEffect(() => {
    if (!isLoading) {
      // Небольшая задержка повышает шансы на появление клавиатуры на iOS (лишним не будет)
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
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
    alert("Задача сохранена!");
    // После сохранения снова фокусируемся на поле (удобно для быстрого ввода следующей задачи)
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col">
      <div className="max-w-md mx-auto w-full mt-10">
        <h1 className="text-xl font-semibold mb-4">Что нужно зафиксировать?</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            ref={inputRef} // ← привязываем ref
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg"
            disabled={isSaving}
            placeholder="Например: купить молоко"
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
