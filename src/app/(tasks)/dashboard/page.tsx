// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Task } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Проверка авторизации
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  // Загрузка задач
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Ошибка загрузки задач:", error);
      } else {
        setTasks(data || []);
      }
      setLoading(false);
    };

    fetchTasks();

    // Подписка на реальные изменения (опционально, но круто)
    const channel = supabase
      .channel("tasks-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          fetchTasks(); // перезагружаем при любом изменении
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Переключение статуса задачи
  const toggleTask = async (id: string, currentDone: boolean) => {
    const { error } = await supabase
      .from("tasks")
      .update({ done: !currentDone })
      .eq("id", id);

    if (error) {
      console.error("Ошибка обновления:", error);
    } else {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === id ? { ...task, done: !currentDone } : task
        )
      );
    }
  };

  // Удаление задачи
  const deleteTask = async (id: string) => {
    if (!confirm("Удалить задачу?")) return;

    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      console.error("Ошибка удаления:", error);
    } else {
      setTasks((prev) => prev.filter((task) => task.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Мои задачи</h1>
          <Button onClick={() => router.push("/new")}>+ Быстро добавить</Button>
        </div>

        {loading ? (
          <div className="text-center py-10">Загрузка задач...</div>
        ) : tasks.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Нет задач. Добавь первую!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <Card key={task.id} className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={task.done}
                    onCheckedChange={() => toggleTask(task.id, task.done)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-lg ${
                        task.done ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(task.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTask(task.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
