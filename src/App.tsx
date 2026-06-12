import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './features/dashboard/Dashboard';
import NotesPage from './features/notes/NotesPage';
import MediaPage from './features/media/MediaPage';
import CalendarPage from './features/calendar/CalendarPage';
import TimeTrackerPage from './features/timetracker/TimeTrackerPage';
import SettingsPage from './features/settings/SettingsPage';
import { useDataStore } from './stores/useDataStore';

export default function App() {
  const fetchFromSupabase = useDataStore((s) => s.fetchFromSupabase);

  useEffect(() => {
    fetchFromSupabase();
  }, [fetchFromSupabase]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/media" element={<MediaPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/time-tracker" element={<TimeTrackerPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
