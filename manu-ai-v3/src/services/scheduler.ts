import BackgroundTimer from 'react-native-background-timer';
import {useStore} from '../store/useStore';
import {speak} from './voice';

interface ScheduledTask {
  id: string;
  type: 'reminder' | 'weather' | 'news' | 'custom';
  time: number;
  message: string;
  repeat: boolean;
  interval?: number;
}

let activeTasks: Map<string, number> = new Map();

export function scheduleTask(task: ScheduledTask): void {
  const now = Date.now();
  const delay = Math.max(task.time - now, 1000);

  const timerId = BackgroundTimer.setTimeout(() => {
    executeTask(task);
    if (task.repeat && task.interval) {
      const nextTask = {...task, time: now + task.interval};
      scheduleTask(nextTask);
    }
    activeTasks.delete(task.id);
  }, delay);

  activeTasks.set(task.id, timerId);
}

export function cancelTask(taskId: string): void {
  const timerId = activeTasks.get(taskId);
  if (timerId) {
    BackgroundTimer.clearTimeout(timerId);
    activeTasks.delete(taskId);
  }
}

export function cancelAllTasks(): void {
  activeTasks.forEach((timerId) => BackgroundTimer.clearTimeout(timerId));
  activeTasks.clear();
}

async function executeTask(task: ScheduledTask): Promise<void> {
  try {
    await speak(task.message);
  } catch (e) {
    console.log('Task execution failed:', e);
  }
}

export function getActiveTasks(): string[] {
  return Array.from(activeTasks.keys());
}
