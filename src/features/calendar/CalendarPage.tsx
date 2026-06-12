import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Check,
  Trash2,
} from 'lucide-react';
import { useDataStore } from '../../stores/useDataStore';
import { generateId, getPriorityColor } from '../../utils/helpers';
import type { CalendarEvent, Task, TaskStatus } from '../../types';
import styles from './CalendarPage.module.css';

const eventColors = ['#6366F1', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#14B8A6'];

export default function CalendarPage() {
  const { t } = useTranslation();
  const { events, tasks, addEvent, deleteEvent, addTask, updateTask, deleteTask } = useDataStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Event form
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventStart, setEventStart] = useState('');
  const [eventEnd, setEventEnd] = useState('');
  const [eventColor, setEventColor] = useState('#6366F1');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = t('calendar.months', { returnObjects: true }) as string[];
  const weekdayNames = t('calendar.weekdays', { returnObjects: true }) as string[];

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month - 1, daysInPrevMonth - i), isCurrentMonth: false });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ date: new Date(year, month, d), isCurrentMonth: true });
    }

    // Next month days
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({ date: new Date(year, month + 1, d), isCurrentMonth: false });
    }

    return days;
  }, [year, month]);

  const isToday = (date: Date) => date.toDateString() === new Date().toDateString();

  const getEventsForDate = (date: Date) => {
    return events.filter((e) => new Date(e.startTime).toDateString() === date.toDateString());
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const openNewEvent = useCallback((date?: Date) => {
    const d = date || new Date();
    const isoDate = d.toISOString().slice(0, 16);
    setEventTitle('');
    setEventDesc('');
    setEventStart(isoDate);
    setEventEnd('');
    setEventColor('#6366F1');
    setShowEventModal(true);
  }, []);

  const saveEvent = useCallback(() => {
    if (!eventTitle.trim() || !eventStart) return;
    const ev: CalendarEvent = {
      id: generateId(),
      title: eventTitle,
      description: eventDesc,
      startTime: new Date(eventStart).toISOString(),
      endTime: eventEnd ? new Date(eventEnd).toISOString() : undefined,
      color: eventColor,
      createdAt: new Date().toISOString(),
    };
    addEvent(ev);
    setShowEventModal(false);
  }, [eventTitle, eventDesc, eventStart, eventEnd, eventColor, addEvent]);

  const handleAddTask = useCallback(() => {
    if (!newTaskTitle.trim()) return;
    addTask({
      id: generateId(),
      title: newTaskTitle,
      status: 'todo',
      priority: 'medium',
      createdAt: new Date().toISOString(),
    });
    setNewTaskTitle('');
  }, [newTaskTitle, addTask]);

  const cycleStatus = useCallback((task: Task) => {
    const cycle: Record<TaskStatus, TaskStatus> = { todo: 'in_progress', in_progress: 'done', done: 'todo' };
    updateTask(task.id, { status: cycle[task.status] });
  }, [updateTask]);

  return (
    <div className={styles.calendarPage}>
      {/* Calendar Main */}
      <div className={styles.calendarMain}>
        <div className={styles.calendarHeader}>
          <div className={styles.calendarNav}>
            <button className={styles.navBtn} onClick={prevMonth}><ChevronLeft size={18} /></button>
            <span className={styles.monthTitle}>{monthNames[month]} {year}</span>
            <button className={styles.navBtn} onClick={nextMonth}><ChevronRight size={18} /></button>
            <button className={styles.todayBtn} onClick={goToday}>{t('calendar.today')}</button>
          </div>
          <button className={styles.newEventBtn} onClick={() => openNewEvent()}>
            <Plus size={16} />
            {t('calendar.newEvent')}
          </button>
        </div>

        <div className={styles.calendarGrid}>
          <div className={styles.weekdayRow}>
            {weekdayNames.map((d: string) => (
              <div key={d} className={styles.weekdayCell}>{d}</div>
            ))}
          </div>
          <div className={styles.daysGrid}>
            {calendarDays.map((day, i) => {
              const dayEvents = getEventsForDate(day.date);
              return (
                <div
                  key={i}
                  className={`${styles.dayCell} ${!day.isCurrentMonth ? styles.otherMonth : ''} ${isToday(day.date) ? styles.today : ''}`}
                  onClick={() => openNewEvent(day.date)}
                >
                  <div className={styles.dayNumber}>{day.date.getDate()}</div>
                  <div className={styles.dayEvents}>
                    {dayEvents.slice(0, 3).map((ev) => (
                      <div
                        key={ev.id}
                        className={styles.dayEvent}
                        style={{ background: ev.color }}
                        onClick={(e) => { e.stopPropagation(); deleteEvent(ev.id); }}
                      >
                        {ev.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Task Sidebar */}
      <div className={styles.taskSidebar}>
        <div className={styles.taskSidebarHeader}>
          <span className={styles.taskSidebarTitle}>{t('calendar.tasks')}</span>
          <button className={styles.addTaskBtn} onClick={() => document.getElementById('taskInput')?.focus()}>
            <Plus size={16} />
          </button>
        </div>
        <div className={styles.taskList}>
          {tasks.length === 0 ? (
            <div className={styles.emptyTasks}>{t('calendar.noEvents')}</div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className={styles.taskItem}>
                <div
                  className={`${styles.taskCheckbox} ${task.status === 'done' ? styles.done : ''} ${task.status === 'in_progress' ? styles.inProgress : ''}`}
                  onClick={() => cycleStatus(task)}
                >
                  {task.status === 'done' && <Check size={12} />}
                </div>
                <div className={styles.taskContent}>
                  <div className={`${styles.taskTitle} ${task.status === 'done' ? styles.done : ''}`}>
                    {task.title}
                  </div>
                  <div className={styles.taskMeta}>
                    <span className={styles.taskPriority} style={{ background: getPriorityColor(task.priority) }}>
                      {t(`calendar.priority.${task.priority}`)}
                    </span>
                  </div>
                </div>
                <button className={styles.taskDeleteBtn} onClick={() => deleteTask(task.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
        <div className={styles.addTaskRow}>
          <input
            id="taskInput"
            className={styles.addTaskInput}
            placeholder={t('calendar.addTask')}
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
          />
          <button className={styles.addTaskSubmit} onClick={handleAddTask}>
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div className={styles.eventOverlay} onClick={() => setShowEventModal(false)}>
          <div className={styles.eventModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.eventModalHeader}>
              <span className={styles.eventModalTitle}>{t('calendar.newEvent')}</span>
              <button className={styles.eventModalClose} onClick={() => setShowEventModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.eventModalBody}>
              <div className={styles.eventField}>
                <label>{t('calendar.eventTitle')}</label>
                <input
                  className={styles.eventInput}
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div className={styles.eventField}>
                <label>{t('calendar.description')}</label>
                <input
                  className={styles.eventInput}
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                />
              </div>
              <div className={styles.eventRow}>
                <div className={styles.eventField}>
                  <label>{t('calendar.startTime')}</label>
                  <input
                    className={styles.eventInput}
                    type="datetime-local"
                    value={eventStart}
                    onChange={(e) => setEventStart(e.target.value)}
                  />
                </div>
                <div className={styles.eventField}>
                  <label>{t('calendar.endTime')}</label>
                  <input
                    className={styles.eventInput}
                    type="datetime-local"
                    value={eventEnd}
                    onChange={(e) => setEventEnd(e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.eventField}>
                <label>Color</label>
                <div className={styles.colorPicker}>
                  {eventColors.map((c) => (
                    <div
                      key={c}
                      className={`${styles.colorSwatch} ${eventColor === c ? styles.active : ''}`}
                      style={{ background: c }}
                      onClick={() => setEventColor(c)}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.eventModalFooter}>
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setShowEventModal(false)}>
                {t('common.cancel')}
              </button>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={saveEvent}>
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
