export type Task = {
  id: string;
  title: string;
  done: boolean;
  created_at: string; // ISO string
  type: TaskType;
};

export type TaskType = "question" | "lightning" | "cloud";

export type MoodEntry = {
  date: string; // YYYY-MM-DD
  mood: number; // 1-10
  sleep_time: string; // "23:30"
  note: string;
};
