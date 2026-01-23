'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';
import { LiquidButton } from '@/components/ui/LiquidButton';

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  type: 'session' | 'meeting' | 'assessment' | 'holiday';
  studentName?: string;
  teacherName?: string;
  subject?: string;
  location?: string;
}

interface CalendarSchedulerProps {
  events: CalendarEvent[];
  currentDate?: Date;
  onAddEvent?: () => void;
  onEditEvent?: (eventId: string) => void;
  onDeleteEvent?: (eventId: string) => void;
  onViewDay?: (date: string) => void;
  className?: string;
}

export default function CalendarScheduler({
  events,
  currentDate = new Date(),
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
  onViewDay,
  className = '',
}: CalendarSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'session':
        return 'bg-blue-500/80';
      case 'meeting':
        return 'bg-purple-500/80';
      case 'assessment':
        return 'bg-orange-500/80';
      case 'holiday':
        return 'bg-green-500/80';
      default:
        return 'bg-gray-500/80';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'session':
        return '📚';
      case 'meeting':
        return '👥';
      case 'assessment':
        return '📝';
      case 'holiday':
        return '🎉';
      default:
        return '📅';
    }
  };

  // Get events for a specific date
  const getEventsForDate = (date: string) => {
    return events.filter(event => event.date === date);
  };

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty slots for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({ day, dateStr, events: getEventsForDate(dateStr) });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const monthName = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-3xl ${className}`}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/optimized/communication/calendar-scheduler.webp"
          alt="Calendar Scheduler"
          fill
          className="object-cover"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/90 via-pink-900/85 to-rose-900/90" />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-white/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -70, 0],
              x: [0, Math.random() * 50 - 25, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.7, 1],
            }}
            transition={{
              duration: 7 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">
              📅 Calendar & Schedule
            </h3>
            <p className="text-pink-100">{monthName}</p>
          </div>

          {onAddEvent && (
            <LiquidButton
              variant="primary"
              size="sm"
              onClick={onAddEvent}
              className="bg-white text-purple-900 hover:bg-pink-50"
            >
              + Add Event
            </LiquidButton>
          )}
        </div>

        {/* Calendar Grid */}
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/20 mb-4">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-3">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-pink-100"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((dayData, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.01 }}
                className={`aspect-square ${
                  dayData
                    ? 'backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 cursor-pointer'
                    : ''
                } rounded-lg p-1 transition-colors relative`}
                onClick={() => dayData && setSelectedDate(dayData.dateStr)}
              >
                {dayData && (
                  <>
                    <div className="text-xs font-semibold text-white text-center">
                      {dayData.day}
                    </div>
                    {dayData.events.length > 0 && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {dayData.events.slice(0, 3).map((event, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${getEventTypeColor(event.type)}`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/20 mb-4">
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            🔔 Upcoming Events
          </h4>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {events.slice(0, 5).map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="backdrop-blur-xl bg-white/10 rounded-xl p-3 border border-white/20 hover:bg-white/20 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg ${getEventTypeColor(event.type)} flex items-center justify-center text-xl flex-shrink-0`}
                  >
                    {getEventTypeIcon(event.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">
                      {event.title}
                    </div>
                    <div className="text-xs text-pink-100 mt-1">
                      {event.date} • {event.startTime} - {event.endTime}
                    </div>
                    {event.studentName && (
                      <div className="text-xs text-pink-100 mt-1">
                        👤 {event.studentName}
                        {event.teacherName && ` • 👨‍🏫 ${event.teacherName}`}
                      </div>
                    )}
                    {event.subject && (
                      <div className="text-xs text-pink-100">
                        📚 {event.subject}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1 flex-shrink-0">
                    {onEditEvent && (
                      <button
                        onClick={() => onEditEvent(event.id)}
                        className="w-7 h-7 rounded-lg backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white text-xs transition-colors"
                      >
                        ✏️
                      </button>
                    )}
                    {onDeleteEvent && (
                      <button
                        onClick={() => onDeleteEvent(event.id)}
                        className="w-7 h-7 rounded-lg backdrop-blur-xl bg-white/10 hover:bg-red-500/50 border border-white/20 flex items-center justify-center text-white text-xs transition-colors"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {events.length === 0 && (
              <div className="text-center text-pink-100 text-sm py-8">
                No upcoming events scheduled
              </div>
            )}
          </div>
        </div>

        {/* Event Type Legend */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { type: 'session', label: 'Sessions' },
            { type: 'meeting', label: 'Meetings' },
            { type: 'assessment', label: 'Assessments' },
            { type: 'holiday', label: 'Holidays' },
          ].map(item => (
            <div
              key={item.type}
              className="backdrop-blur-xl bg-white/10 rounded-lg p-2 border border-white/20 flex items-center gap-2"
            >
              <div
                className={`w-3 h-3 rounded-full ${getEventTypeColor(item.type)}`}
              />
              <span className="text-xs text-white">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-4 text-xs text-pink-100 text-center"
        >
          💡 Click on a day to view or add events
        </motion.div>
      </div>

      {/* Decorative Gradient Orbs */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-400 rounded-full blur-3xl opacity-20" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-pink-400 rounded-full blur-3xl opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-rose-400 rounded-full blur-3xl opacity-10" />
    </motion.div>
  );
}
