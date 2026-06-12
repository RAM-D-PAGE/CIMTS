import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Note, MediaFile, CalendarEvent, Task, TimeEntry, Profile } from '../types';

const STORAGE_KEY = 'cimts-data';
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';

interface DataStore {
  profile: Profile;
  notes: Note[];
  media: MediaFile[];
  events: CalendarEvent[];
  tasks: Task[];
  timeEntries: TimeEntry[];

  // Supabase sync
  fetchFromSupabase: () => Promise<void>;

  // Profile
  updateProfile: (profile: Partial<Profile>) => Promise<void>;

  // Notes
  addNote: (note: Note) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  // Media
  addMedia: (file: MediaFile) => Promise<void>;
  deleteMedia: (id: string) => Promise<void>;

  // Events
  addEvent: (event: CalendarEvent) => Promise<void>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;

  // Tasks
  addTask: (task: Task) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Time Entries
  addTimeEntry: (entry: TimeEntry) => Promise<void>;
  updateTimeEntry: (id: string, updates: Partial<TimeEntry>) => Promise<void>;
  deleteTimeEntry: (id: string) => Promise<void>;

  // Data management
  exportData: () => string;
  importData: (json: string) => boolean;
  clearAllData: () => Promise<void>;
}

const defaultProfile: Profile = {
  name: 'Intern',
  company: 'Company Name',
  department: 'IT Department',
  position: 'Intern',
  internshipStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days ago
  internshipEnd: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 75 days from now
};

// Database mapping functions
const mapNoteToDb = (n: Note) => ({
  id: n.id,
  title: n.title,
  content: n.content,
  category: n.category,
  tags: n.tags,
  date: n.date,
  created_at: n.createdAt,
  updated_at: n.updatedAt
});

const mapNoteFromDb = (n: any): Note => ({
  id: n.id,
  title: n.title,
  content: n.content,
  category: n.category,
  tags: n.tags || [],
  date: n.date,
  createdAt: n.created_at,
  updatedAt: n.updated_at
});

const mapProfileToDb = (p: Profile) => ({
  id: DEFAULT_USER_ID,
  name: p.name,
  company: p.company,
  department: p.department,
  position: p.position,
  avatar_url: p.avatarUrl,
  internship_start: p.internshipStart,
  internship_end: p.internshipEnd
});

const mapProfileFromDb = (p: any): Profile => ({
  name: p.name || '',
  company: p.company || '',
  department: p.department || '',
  position: p.position || '',
  avatarUrl: p.avatar_url || undefined,
  internshipStart: p.internship_start || undefined,
  internshipEnd: p.internship_end || undefined
});

const mapMediaToDb = (m: MediaFile) => ({
  id: m.id,
  name: m.name,
  type: m.type,
  size: m.size,
  data_url: m.dataUrl,
  created_at: m.createdAt
});

const mapMediaFromDb = (m: any): MediaFile => ({
  id: m.id,
  name: m.name,
  type: m.type,
  size: m.size,
  dataUrl: m.data_url,
  createdAt: m.created_at
});

const mapEventToDb = (e: CalendarEvent) => ({
  id: e.id,
  title: e.title,
  description: e.description,
  start_time: e.startTime,
  end_time: e.endTime,
  color: e.color,
  reminder_minutes: e.reminderMinutes,
  created_at: e.createdAt
});

const mapEventFromDb = (e: any): CalendarEvent => ({
  id: e.id,
  title: e.title,
  description: e.description || undefined,
  startTime: e.start_time,
  endTime: e.end_time || undefined,
  color: e.color,
  reminderMinutes: e.reminder_minutes || undefined,
  createdAt: e.created_at
});

const mapTaskToDb = (t: Task) => ({
  id: t.id,
  title: t.title,
  description: t.description,
  status: t.status,
  priority: t.priority,
  due_date: t.dueDate,
  created_at: t.createdAt
});

const mapTaskFromDb = (t: any): Task => ({
  id: t.id,
  title: t.title,
  description: t.description || undefined,
  status: t.status,
  priority: t.priority,
  dueDate: t.due_date || undefined,
  createdAt: t.created_at
});

const mapTimeEntryToDb = (te: TimeEntry) => ({
  id: te.id,
  clock_in: te.clockIn,
  clock_out: te.clockOut,
  note: te.note,
  created_at: te.createdAt
});

const mapTimeEntryFromDb = (te: any): TimeEntry => ({
  id: te.id,
  clockIn: te.clock_in,
  clockOut: te.clock_out || undefined,
  note: te.note || undefined,
  createdAt: te.created_at
});

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

  // Supabase sync load
  fetchFromSupabase: async () => {
    try {
      const [
        { data: profileData },
        { data: notesData },
        { data: mediaData },
        { data: eventsData },
        { data: tasksData },
        { data: timeEntriesData }
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', DEFAULT_USER_ID).maybeSingle(),
        supabase.from('notes').select('*').order('created_at', { ascending: false }),
        supabase.from('media').select('*').order('created_at', { ascending: false }),
        supabase.from('events').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('time_entries').select('*').order('created_at', { ascending: false })
      ]);

      const updates: Partial<DataStore> = {};
      if (profileData) updates.profile = mapProfileFromDb(profileData);
      if (notesData) updates.notes = notesData.map(mapNoteFromDb);
      if (mediaData) updates.media = mediaData.map(mapMediaFromDb);
      if (eventsData) updates.events = eventsData.map(mapEventFromDb);
      if (tasksData) updates.tasks = tasksData.map(mapTaskFromDb);
      if (timeEntriesData) updates.timeEntries = timeEntriesData.map(mapTimeEntryFromDb);

      if (Object.keys(updates).length > 0) {
        set(updates);
        saveToStorage(get());
      }
    } catch (error) {
      console.error('Failed to sync from Supabase:', error);
    }
  },

  // Profile
  updateProfile: async (updates) => {
    set((s) => ({ profile: { ...s.profile, ...updates } }));
    saveToStorage(get());
    try {
      const dbProfile = mapProfileToDb(get().profile);
      await supabase.from('profiles').upsert(dbProfile);
    } catch (error) {
      console.error('Failed to save profile to Supabase:', error);
    }
  },

  // Notes
  addNote: async (note) => {
    set((s) => ({ notes: [note, ...s.notes] }));
    saveToStorage(get());
    try {
      await supabase.from('notes').insert(mapNoteToDb(note));
    } catch (error) {
      console.error('Failed to add note to Supabase:', error);
    }
  },
  updateNote: async (id, updates) => {
    set((s) => ({
      notes: s.notes.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n)),
    }));
    saveToStorage(get());
    try {
      const updatedNote = get().notes.find((n) => n.id === id);
      if (updatedNote) {
        await supabase.from('notes').upsert(mapNoteToDb(updatedNote));
      }
    } catch (error) {
      console.error('Failed to update note in Supabase:', error);
    }
  },
  deleteNote: async (id) => {
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
    saveToStorage(get());
    try {
      await supabase.from('notes').delete().eq('id', id);
    } catch (error) {
      console.error('Failed to delete note from Supabase:', error);
    }
  },

  // Media
  addMedia: async (file) => {
    set((s) => ({ media: [file, ...s.media] }));
    saveToStorage(get());
    try {
      await supabase.from('media').insert(mapMediaToDb(file));
    } catch (error) {
      console.error('Failed to add media to Supabase:', error);
    }
  },
  deleteMedia: async (id) => {
    set((s) => ({ media: s.media.filter((m) => m.id !== id) }));
    saveToStorage(get());
    try {
      await supabase.from('media').delete().eq('id', id);
    } catch (error) {
      console.error('Failed to delete media from Supabase:', error);
    }
  },

  // Events
  addEvent: async (event) => {
    set((s) => ({ events: [...s.events, event] }));
    saveToStorage(get());
    try {
      await supabase.from('events').insert(mapEventToDb(event));
    } catch (error) {
      console.error('Failed to add event to Supabase:', error);
    }
  },
  updateEvent: async (id, updates) => {
    set((s) => ({
      events: s.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
    saveToStorage(get());
    try {
      const updatedEvent = get().events.find((e) => e.id === id);
      if (updatedEvent) {
        await supabase.from('events').upsert(mapEventToDb(updatedEvent));
      }
    } catch (error) {
      console.error('Failed to update event in Supabase:', error);
    }
  },
  deleteEvent: async (id) => {
    set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
    saveToStorage(get());
    try {
      await supabase.from('events').delete().eq('id', id);
    } catch (error) {
      console.error('Failed to delete event from Supabase:', error);
    }
  },

  // Tasks
  addTask: async (task) => {
    set((s) => ({ tasks: [...s.tasks, task] }));
    saveToStorage(get());
    try {
      await supabase.from('tasks').insert(mapTaskToDb(task));
    } catch (error) {
      console.error('Failed to add task to Supabase:', error);
    }
  },
  updateTask: async (id, updates) => {
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
    saveToStorage(get());
    try {
      const updatedTask = get().tasks.find((t) => t.id === id);
      if (updatedTask) {
        await supabase.from('tasks').upsert(mapTaskToDb(updatedTask));
      }
    } catch (error) {
      console.error('Failed to update task in Supabase:', error);
    }
  },
  deleteTask: async (id) => {
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
    saveToStorage(get());
    try {
      await supabase.from('tasks').delete().eq('id', id);
    } catch (error) {
      console.error('Failed to delete task from Supabase:', error);
    }
  },

  // Time Entries
  addTimeEntry: async (entry) => {
    set((s) => ({ timeEntries: [entry, ...s.timeEntries] }));
    saveToStorage(get());
    try {
      await supabase.from('time_entries').insert(mapTimeEntryToDb(entry));
    } catch (error) {
      console.error('Failed to add time entry to Supabase:', error);
    }
  },
  updateTimeEntry: async (id, updates) => {
    set((s) => ({
      timeEntries: s.timeEntries.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
    saveToStorage(get());
    try {
      const updatedEntry = get().timeEntries.find((t) => t.id === id);
      if (updatedEntry) {
        await supabase.from('time_entries').upsert(mapTimeEntryToDb(updatedEntry));
      }
    } catch (error) {
      console.error('Failed to update time entry in Supabase:', error);
    }
  },
  deleteTimeEntry: async (id) => {
    set((s) => ({ timeEntries: s.timeEntries.filter((t) => t.id !== id) }));
    saveToStorage(get());
    try {
      await supabase.from('time_entries').delete().eq('id', id);
    } catch (error) {
      console.error('Failed to delete time entry from Supabase:', error);
    }
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
      const updates = {
        profile: data.profile || defaultProfile,
        notes: data.notes || [],
        media: data.media || [],
        events: data.events || [],
        tasks: data.tasks || [],
        timeEntries: data.timeEntries || [],
      };
      set(updates);
      saveToStorage(get());

      // Sync all imported data to Supabase asynchronously
      (async () => {
        try {
          const dbProfile = mapProfileToDb(updates.profile);
          await supabase.from('profiles').upsert(dbProfile);

          if (updates.notes.length > 0) {
            await supabase.from('notes').upsert(updates.notes.map(mapNoteToDb));
          }
          if (updates.media.length > 0) {
            await supabase.from('media').upsert(updates.media.map(mapMediaToDb));
          }
          if (updates.events.length > 0) {
            await supabase.from('events').upsert(updates.events.map(mapEventToDb));
          }
          if (updates.tasks.length > 0) {
            await supabase.from('tasks').upsert(updates.tasks.map(mapTaskToDb));
          }
          if (updates.timeEntries.length > 0) {
            await supabase.from('time_entries').upsert(updates.timeEntries.map(mapTimeEntryToDb));
          }
        } catch (err) {
          console.error('Failed to sync imported data to Supabase:', err);
        }
      })();

      return true;
    } catch {
      return false;
    }
  },
  clearAllData: async () => {
    set({
      profile: defaultProfile,
      notes: [],
      media: [],
      events: [],
      tasks: [],
      timeEntries: [],
    });
    localStorage.removeItem(STORAGE_KEY);
    try {
      await Promise.all([
        supabase.from('profiles').upsert(mapProfileToDb(defaultProfile)),
        supabase.from('notes').delete().neq('id', DEFAULT_USER_ID),
        supabase.from('media').delete().neq('id', DEFAULT_USER_ID),
        supabase.from('events').delete().neq('id', DEFAULT_USER_ID),
        supabase.from('tasks').delete().neq('id', DEFAULT_USER_ID),
        supabase.from('time_entries').delete().neq('id', DEFAULT_USER_ID)
      ]);
    } catch (error) {
      console.error('Failed to clear data from Supabase:', error);
    }
  },
}));
