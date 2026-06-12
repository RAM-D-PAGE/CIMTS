export function generateId(): string {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function formatDate(dateStr: string, locale: string = 'th'): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(dateStr: string, locale: string = 'th'): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString(locale === 'th' ? 'th-TH' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(dateStr: string, locale: string = 'th'): string {
  return `${formatDate(dateStr, locale)} ${formatTime(dateStr, locale)}`;
}

export function formatDuration(ms: number): { hours: number; minutes: number } {
  const totalMinutes = Math.floor(ms / 60000);
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  };
}

export function formatDurationString(ms: number): string {
  const { hours, minutes } = formatDuration(ms);
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export function isSameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function daysBetween(a: Date, b: Date): number {
  const diff = Math.abs(b.getTime() - a.getTime());
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function isImageFile(type: string): boolean {
  return type.startsWith('image/');
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    task: '#6366F1',
    learning: '#10B981',
    problem: '#EF4444',
    idea: '#F59E0B',
    meeting: '#8B5CF6',
    other: '#6B7280',
  };
  return colors[category] || colors.other;
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: '#10B981',
    medium: '#F59E0B',
    high: '#EF4444',
  };
  return colors[priority] || colors.medium;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    todo: '#6B7280',
    in_progress: '#3B82F6',
    done: '#10B981',
  };
  return colors[status] || colors.todo;
}
