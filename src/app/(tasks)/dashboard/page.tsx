// src/app/(tasks)/dashboard/page.tsx
"use client";

import { useEffect, useState, useRef, Fragment } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Task, TaskType } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// Вспомогательная функция для эмодзи
const getEmoji = (type: TaskType) => {
  switch (type) {
    case "lightning":
      return "⚡";
    case "cloud":
      return "☁️";
    case "question":
      return "❓";
    default:
      return "❓";
  }
};

// Компонент выбора типа задачи
const TypeSelector = ({
  task,
  onUpdateType,
}: {
  task: { id: string; type: TaskType };
  onUpdateType: (id: string, newType: TaskType) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const ALL_TYPES: TaskType[] = ["lightning", "cloud", "question"];

  const handleEmojiClick = () => {
    setIsOpen((prev) => !prev);
  };

  const handleOptionSelect = (newType: TaskType) => {
    if (newType !== task.type) {
      onUpdateType(task.id, newType);
    }
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, {
      passive: true,
    });

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const renderButton = (type: TaskType) => {
    const isActive = type === task.type;
    const emoji = getEmoji(type);
    const labels: Record<TaskType, string> = {
      lightning: "Срочное — молния",
      cloud: "Идея — облако",
      question: "Неотсортировано — вопрос",
    };

    return (
      <button
        key={type}
        onClick={() => handleOptionSelect(type)}
        className={`text-xl w-12 h-12 flex items-center justify-center rounded-full border shadow-md transition-all touch-manipulation ${
          isActive
            ? "bg-primary/10 scale-110 shadow-lg"
            : "bg-background hover:bg-muted active:scale-95"
        }`}
        aria-label={labels[type]}
      >
        {emoji}
      </button>
    );
  };

  return (
    <div className="relative flex items-center justify-center" ref={menuRef}>
      {!isOpen && (
        <button
          onClick={handleEmojiClick}
          className="text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted active:bg-muted/70 transition-colors touch-manipulation"
          aria-label={`Тип задачи: ${task.type}. Нажмите, чтобы изменить.`}
        >
          {getEmoji(task.type)}
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute mb-13 ml-7 left-1/2 transform -translate-x-1/2 z-[60]"
          >
            <div className="flex flex-col items-center">
              {/* Верх: первая альтернатива */}
              {renderButton(ALL_TYPES.filter((t) => t !== task.type)[0])}

              {/* Низ: текущий (слева) + вторая альтернатива (справа) */}
              <div className="flex gap-2">
                {renderButton(task.type)}
                {renderButton(ALL_TYPES.filter((t) => t !== task.type)[1])}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isOpen && <div className="w-8 h-8" />}
    </div>
  );
};

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const router = useRouter();

  // Проверка авторизации
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/login");
        return;
      }
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  // Загрузка задач
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      setShowEmptyState(false);
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
      setTimeout(() => {
        setLoading(false);
        if (!data || data.length === 0) {
          setShowEmptyState(true);
        }
      }, 300);
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

  // Удаление задачи
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

  // Обновление типа задачи
  const updateTaskType = async (id: string, newType: TaskType) => {
    const { error } = await supabase
      .from("tasks")
      .update({ type: newType })
      .eq("id", id);

    if (error) {
      console.error("Ошибка обновления типа:", error);
      toast.error("Не удалось изменить тип задачи");
    } else {
      setTasks((prev) =>
        prev.map((task) => (task.id === id ? { ...task, type: newType } : task))
      );
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <h1 className="text-2xl font-bold mb-6">Мои идеи</h1>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-primary/30 animate-ping opacity-20"></div>
            </div>
            <p className="mt-4 text-muted-foreground text-sm">
              Загрузка идей...
            </p>
          </div>
        ) : showEmptyState ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Нет идей. Добавь первую!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                whileTap={{
                  scale: 0.985,
                  backgroundColor: "hsl(var(--muted))",
                }}
                className="rounded-lg"
                onContextMenu={(e) => e.preventDefault()}
              >
                <Card className="p-4 border-0">
                  <div className="flex items-start gap-3">
                    <TypeSelector task={task} onUpdateType={updateTaskType} />
                    <div
                      className="flex-1 min-w-0 cursor-pointer select-none"
                      onTouchStart={(e) => e.preventDefault()}
                      onPointerDown={(e) => {
                        const timeout = setTimeout(async () => {
                          try {
                            await navigator.clipboard.writeText(task.title);
                            toast.success("Скопировано!", { duration: 1200 });
                          } catch {
                            toast.error("Не удалось скопировать");
                          }
                        }, 500);

                        const cleanup = () => {
                          clearTimeout(timeout);
                          window.removeEventListener("pointerup", cleanup);
                          window.removeEventListener("pointercancel", cleanup);
                        };

                        window.addEventListener("pointerup", cleanup);
                        window.addEventListener("pointercancel", cleanup);
                      }}
                    >
                      <p
                        className={`text-lg break-words ${
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
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* FAB-кнопка */}
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
