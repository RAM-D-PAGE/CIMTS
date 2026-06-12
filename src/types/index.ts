/* ============================
   CIMTS Type Definitions
   ============================ */

export interface Profile {
  name: string;
  company: string;
  department: string;
  position: string;
  avatarUrl?: string;
  internshipStart?: string;
  internshipEnd?: string;
}

export type NoteCategory = 'task' | 'learning' | 'problem' | 'idea' | 'meeting' | 'other';

export interface Note {
  id: string;
  title: string;
  content: string; // HTML from TipTap
  category: NoteCategory;
  tags: string[];
  date: string; // ISO date string
  createdAt: string;
  updatedAt: string;
}

export interface MediaFile {
  id: string;
  name: string;
  type: string; // MIME type
  size: number;
  dataUrl: string; // Base64 data URL for localStorage
  thumbnailUrl?: string;
  noteId?: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string; // ISO datetime
  endTime?: string;
  color: string;
  reminderMinutes?: number;
  createdAt: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  clockIn: string; // ISO datetime
  clockOut?: string;
  note?: string;
  createdAt: string;
}

export interface AppData {
  profile: Profile;
  notes: Note[];
  media: MediaFile[];
  events: CalendarEvent[];
  tasks: Task[];
  timeEntries: TimeEntry[];
}
