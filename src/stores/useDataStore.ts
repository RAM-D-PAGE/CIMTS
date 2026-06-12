import { create } from 'zustand';
import type { Note, MediaFile, CalendarEvent, Task, TimeEntry, Profile } from '../types';

const STORAGE_KEY = 'cimts-data';

interface DataStore {
  profile: Profile;
  notes: Note[];
  media: MediaFile[];
  events: CalendarEvent[];
  tasks: Task[];
  timeEntries: TimeEntry[];

  // Profile
  updateProfile: (profile: Partial<Profile>) => void;

  // Notes
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;

  // Media
  addMedia: (file: MediaFile) => void;
  deleteMedia: (id: string) => void;

  // Events
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;

  // Tasks
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  // Time Entries
  addTimeEntry: (entry: TimeEntry) => void;
  updateTimeEntry: (id: string, updates: Partial<TimeEntry>) => void;
  deleteTimeEntry: (id: string) => void;

  // Data management
  exportData: () => string;
  importData: (json: string) => boolean;
  clearAllData: () => void;
}

const defaultProfile: Profile = {
  name: 'Intern',
  company: 'Company Name',
  department: 'IT Department',
  position: 'Intern',
  internshipStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days ago
  internshipEnd: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 75 days from now
};

function loadFromStorage(): Partial<DataStore> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore parse errors
  }
  return {};
}

function saveToStorage(state: DataStore) {
  const data = {
    profile: state.profile,
    notes: state.notes,
    media: state.media,
    events: state.events,
    tasks: state.tasks,
    timeEntries: state.timeEntries,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const saved = loadFromStorage();

export const useDataStore = create<DataStore>((set, get) => ({
  profile: saved.profile || defaultProfile,
  notes: saved.notes || [],
  media: saved.media || [],
  events: saved.events || [],
  tasks: saved.tasks || [],
  timeEntries: saved.timeEntries || [],

  // Profile
  updateProfile: (updates) => {
    set((s) => ({ profile: { ...s.profile, ...updates } }));
    saveToStorage(get());
  },

  // Notes
  addNote: (note) => {
    set((s) => ({ notes: [note, ...s.notes] }));
    saveToStorage(get());
  },
  updateNote: (id, updates) => {
    set((s) => ({
      notes: s.notes.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n)),
    }));
    saveToStorage(get());
  },
  deleteNote: (id) => {
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
    saveToStorage(get());
  },

  // Media
  addMedia: (file) => {
    set((s) => ({ media: [file, ...s.media] }));
    saveToStorage(get());
  },
  deleteMedia: (id) => {
    set((s) => ({ media: s.media.filter((m) => m.id !== id) }));
    saveToStorage(get());
  },

  // Events
  addEvent: (event) => {
    set((s) => ({ events: [...s.events, event] }));
    saveToStorage(get());
  },
  updateEvent: (id, updates) => {
    set((s) => ({
      events: s.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
    saveToStorage(get());
  },
  deleteEvent: (id) => {
    set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
    saveToStorage(get());
  },

  // Tasks
  addTask: (task) => {
    set((s) => ({ tasks: [...s.tasks, task] }));
    saveToStorage(get());
  },
  updateTask: (id, updates) => {
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
    saveToStorage(get());
  },
  deleteTask: (id) => {
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
    saveToStorage(get());
  },

  // Time Entries
  addTimeEntry: (entry) => {
    set((s) => ({ timeEntries: [entry, ...s.timeEntries] }));
    saveToStorage(get());
  },
  updateTimeEntry: (id, updates) => {
    set((s) => ({
      timeEntries: s.timeEntries.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
    saveToStorage(get());
  },
  deleteTimeEntry: (id) => {
    set((s) => ({ timeEntries: s.timeEntries.filter((t) => t.id !== id) }));
    saveToStorage(get());
  },

  // Data management
  exportData: () => {
    const state = get();
    return JSON.stringify({
      profile: state.profile,
      notes: state.notes,
      media: state.media,
      events: state.events,
      tasks: state.tasks,
      timeEntries: state.timeEntries,
    }, null, 2);
  },
  importData: (json) => {
    try {
      const data = JSON.parse(json);
      set({
        profile: data.profile || defaultProfile,
        notes: data.notes || [],
        media: data.media || [],
        events: data.events || [],
        tasks: data.tasks || [],
        timeEntries: data.timeEntries || [],
      });
      saveToStorage(get());
      return true;
    } catch {
      return false;
    }
  },
  clearAllData: () => {
    set({
      profile: defaultProfile,
      notes: [],
      media: [],
      events: [],
      tasks: [],
      timeEntries: [],
    });
    localStorage.removeItem(STORAGE_KEY);
  },
}));
