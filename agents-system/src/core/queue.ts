import { taskStore } from "./task-store.js";
import type { Task } from "./types.js";

export const queue = {
  async getNextTasks(limit: number): Promise<Task[]> {
    return queue.getNext(limit);
  },

  async getNext(limit: number): Promise<Task[]> {
    taskStore.resetStaleRunning();
    const pending = taskStore
      .list()
      .filter((t) => t.state === "pending")
      .sort((a, b) => b.priority - a.priority)
      .slice(0, limit);
    for (const t of pending) {
      t.state = "running";
      taskStore.upsert(t);
    }
    return pending;
  },

  async requeue(task: Task, reason: string): Promise<void> {
    task.state = "pending";
    task.attempts += 1;
    if (task.attempts >= 3) task.state = "rejected";
    taskStore.upsert(task);
    void reason;
  },

  async complete(task: Task): Promise<void> {
    task.state = "completed";
    taskStore.upsert(task);
  },

  async block(task: Task): Promise<void> {
    task.state = "blocked";
    taskStore.upsert(task);
  },
};
