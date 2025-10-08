// src/app/quick-task/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function QuickTaskPage() {
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Проверяем авторизацию при загрузке
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

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
  };

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col">
      <div className="max-w-md mx-auto w-full mt-10">
        <h1 className="text-xl font-semibold mb-4">Что пришло в голову?</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: купить молоко"
            className="text-lg"
            disabled={isSaving}
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
              Отмена
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
