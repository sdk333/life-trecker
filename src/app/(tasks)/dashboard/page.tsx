// src/app/(tasks)/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Task } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

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
        toast.error("Не удалось загрузить задачи");
      } else {
        setTasks(data || []);
      }
      setLoading(false);
    };

    fetchTasks();

    const channel = supabase
      .channel("tasks-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => fetchTasks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleTask = async (id: string, currentDone: boolean) => {
    const { error } = await supabase
      .from("tasks")
      .update({ done: !currentDone })
      .eq("id", id);

    if (error) {
      console.error("Ошибка обновления:", error);
      toast.error("Не удалось обновить задачу");
    } else {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === id ? { ...task, done: !currentDone } : task
        )
      );
    }
  };

  const deleteTask = async (id: string, title: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      console.error("Ошибка удаления:", error);
      toast.error("Не удалось удалить задачу");
    } else {
      setTasks((prev) => prev.filter((task) => task.id !== id));
      toast.success(`«${title}» удалена`, {
        duration: 2000,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {" "}
      {/* отступ снизу под FAB */}
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <h1 className="text-2xl font-bold mb-6">Мои задачи</h1>

        {loading ? (
          <div className="text-center py-10">Загрузка задач...</div>
        ) : tasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
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
                  <button
                    onClick={() => deleteTask(task.id, task.title)}
                    className="text-destructive hover:text-red-400 transition-colors p-1 rounded"
                    aria-label="Удалить задачу"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      {/* Стильная FAB-кнопка внизу */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => router.push("/new")}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow z-50"
        aria-label="Добавить задачу"
      >
        <Plus className="h-6 w-6" />
      </motion.button>
    </div>
  );
}
