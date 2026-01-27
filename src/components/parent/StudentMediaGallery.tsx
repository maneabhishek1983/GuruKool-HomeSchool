'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Liquid3DOrb } from '@/components/ui/Liquid3DOrb';
import { LiquidButton } from '@/components/ui/LiquidButton';

interface MediaItem {
  id: string;
  type: 'photo' | 'video';
  url: string;
  thumbnail?: string;
  title: string;
  description?: string;
  date: string;
  studentId: string;
  studentName: string;
  uploadedBy: 'teacher' | 'parent';
  uploaderName?: string;
  tags?: string[];
}

interface StudentInfo {
  id: string;
  name: string;
}

type ViewMode = 'carousel' | 'grid' | 'masonry' | 'timeline';
type FilterType = 'all' | 'photo' | 'video';
type SortOrder = 'newest' | 'oldest' | 'name';

interface StudentMediaGalleryProps {
  students?: StudentInfo[];
  studentId?: string;
  studentName?: string;
  mediaItems?: MediaItem[];
  onUpload?: () => void;
  onMediaAdded?: (media: MediaItem) => void;
  onMediaDeleted?: (mediaId: string) => void;
  className?: string;
}

// GuruKool brand colors for glassmorphism
const brandColors = {
  primary: 'rgba(37, 99, 235, 0.15)', // blue-600
  secondary: 'rgba(20, 184, 166, 0.15)', // teal-500
  accent: 'rgba(245, 158, 11, 0.15)', // amber-500
  gradient: 'from-blue-600 via-teal-500 to-amber-500',
};

// Statistics Panel Component
function StatisticsPanel({ media }: { media: MediaItem[] }) {
  const stats = useMemo(() => {
    const photos = media.filter(m => m.type === 'photo').length;
    const videos = media.filter(m => m.type === 'video').length;
    const byTeacher = media.filter(m => m.uploadedBy === 'teacher').length;
    const byParent = media.filter(m => m.uploadedBy === 'parent').length;
    const students = [...new Set(media.map(m => m.studentName))];
    const thisWeek = media.filter(m => {
      const date = new Date(m.date);
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return date >= weekAgo;
    }).length;

    return {
      photos,
      videos,
      byTeacher,
      byParent,
      students,
      thisWeek,
      total: media.length,
    };
  }, [media]);

  if (media.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 px-4 mb-6"
    >
      {[
        {
          label: 'Total',
          value: stats.total,
          icon: '📸',
          color: 'from-blue-500 to-blue-600',
        },
        {
          label: 'Photos',
          value: stats.photos,
          icon: '🖼️',
          color: 'from-teal-500 to-teal-600',
        },
        {
          label: 'Videos',
          value: stats.videos,
          icon: '🎬',
          color: 'from-amber-500 to-amber-600',
        },
        {
          label: 'This Week',
          value: stats.thisWeek,
          icon: '📅',
          color: 'from-green-500 to-green-600',
        },
        {
          label: 'By Teachers',
          value: stats.byTeacher,
          icon: '👩‍🏫',
          color: 'from-purple-500 to-purple-600',
        },
        {
          label: 'Students',
          value: stats.students.length,
          icon: '👦',
          color: 'from-pink-500 to-pink-600',
        },
      ].map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-all duration-300"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">{stat.icon}</span>
            <div>
              <p
                className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}
              >
                {stat.value}
              </p>
              <p className="text-xs text-slate-400">{stat.label}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// View Mode Toggle Component
function ViewModeToggle({
  viewMode,
  setViewMode,
}: {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}) {
  const modes: { id: ViewMode; icon: JSX.Element; label: string }[] = [
    {
      id: 'carousel',
      label: 'Carousel',
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      ),
    },
    {
      id: 'grid',
      label: 'Grid',
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      ),
    },
    {
      id: 'masonry',
      label: 'Masonry',
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
    },
    {
      id: 'timeline',
      label: 'Timeline',
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex items-center gap-1 bg-white/5 backdrop-blur-md rounded-lg p-1 border border-white/10">
      {modes.map(mode => (
        <button
          key={mode.id}
          onClick={() => setViewMode(mode.id)}
          title={mode.label}
          className={`p-2 rounded-md transition-all duration-200 ${
            viewMode === mode.id
              ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          {mode.icon}
        </button>
      ))}
    </div>
  );
}

// Filter Controls Component
function FilterControls({
  filter,
  setFilter,
  sortOrder,
  setSortOrder,
  searchQuery,
  setSearchQuery,
}: {
  filter: FilterType;
  setFilter: (f: FilterType) => void;
  sortOrder: SortOrder;
  setSortOrder: (s: SortOrder) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-[300px]">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search media..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
        />
      </div>

      {/* Type Filter */}
      <select
        value={filter}
        onChange={e => setFilter(e.target.value as FilterType)}
        className="px-3 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
      >
        <option value="all" className="bg-slate-800">
          All Types
        </option>
        <option value="photo" className="bg-slate-800">
          Photos Only
        </option>
        <option value="video" className="bg-slate-800">
          Videos Only
        </option>
      </select>

      {/* Sort Order */}
      <select
        value={sortOrder}
        onChange={e => setSortOrder(e.target.value as SortOrder)}
        className="px-3 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
      >
        <option value="newest" className="bg-slate-800">
          Newest First
        </option>
        <option value="oldest" className="bg-slate-800">
          Oldest First
        </option>
        <option value="name" className="bg-slate-800">
          By Name
        </option>
      </select>
    </div>
  );
}

// Grid View Component
function GridView({
  items,
  onItemClick,
  onDeleteItem,
}: {
  items: MediaItem[];
  onItemClick: (item: MediaItem) => void;
  onDeleteItem?: (item: MediaItem) => void;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 px-4">
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.03 }}
          onClick={() => onItemClick(item)}
          className="group cursor-pointer"
        >
          <div className="relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
            <div
              className="w-full h-full bg-cover bg-center"
              style={{
                backgroundImage: item.url.startsWith('/api/placeholder')
                  ? undefined
                  : `url(${item.thumbnail || item.url})`,
              }}
            >
              {item.url.startsWith('/api/placeholder') && (
                <div className="flex items-center justify-center h-full text-slate-500">
                  {item.type === 'video' ? '🎬' : '🖼️'}
                </div>
              )}
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
              <p className="text-white font-medium text-sm truncate">
                {item.title}
              </p>
              <p className="text-slate-300 text-xs">
                {new Date(item.date).toLocaleDateString()}
              </p>
            </div>

            {/* Delete & Type Badges */}
            <div className="absolute top-2 right-2 flex items-center gap-1.5">
              {onDeleteItem && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onDeleteItem(item);
                  }}
                  className="w-7 h-7 bg-red-500/80 backdrop-blur-md border border-red-400/50 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                  title="Delete"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full backdrop-blur-md ${
                  item.type === 'video'
                    ? 'bg-red-500/80 text-white'
                    : 'bg-blue-500/80 text-white'
                }`}
              >
                {item.type === 'video' ? '▶' : '📷'}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Masonry View Component
function MasonryView({
  items,
  onItemClick,
  onDeleteItem,
}: {
  items: MediaItem[];
  onItemClick: (item: MediaItem) => void;
  onDeleteItem?: (item: MediaItem) => void;
}) {
  const columns = 4;
  const columnItems: MediaItem[][] = Array.from({ length: columns }, () => []);

  items.forEach((item, index) => {
    const columnIndex = index % columns;
    const column = columnItems[columnIndex];
    if (column) {
      column.push(item);
    }
  });

  return (
    <div className="flex gap-4 px-4">
      {columnItems.map((column, colIndex) => (
        <div key={colIndex} className="flex-1 flex flex-col gap-4">
          {column.map((item, index) => {
            // Randomize heights for masonry effect
            const heights = ['h-48', 'h-56', 'h-64', 'h-72'];
            const heightClass =
              heights[
                Math.abs((item.id.charCodeAt(0) + index) % heights.length)
              ] || 'h-56';

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: (colIndex * column.length + index) * 0.03,
                }}
                onClick={() => onItemClick(item)}
                className={`group cursor-pointer ${heightClass}`}
              >
                <div className="relative h-full rounded-xl overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 hover:border-teal-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/20">
                  <div
                    className="w-full h-full bg-cover bg-center"
                    style={{
                      backgroundImage: item.url.startsWith('/api/placeholder')
                        ? undefined
                        : `url(${item.thumbnail || item.url})`,
                    }}
                  >
                    {item.url.startsWith('/api/placeholder') && (
                      <div className="flex items-center justify-center h-full text-slate-500 text-4xl">
                        {item.type === 'video' ? '🎬' : '🖼️'}
                      </div>
                    )}
                  </div>

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <p className="text-white font-semibold truncate">
                      {item.title}
                    </p>
                    <p className="text-slate-300 text-sm">{item.studentName}</p>
                    <p className="text-slate-400 text-xs mt-1">
                      {new Date(item.date).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Video indicator */}
                  {item.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg
                          className="w-5 h-5 text-white ml-0.5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Delete button */}
                  {onDeleteItem && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onDeleteItem(item);
                      }}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500/80 backdrop-blur-md border border-red-400/50 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100 z-10"
                      title="Delete"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// Timeline View Component
function TimelineView({
  items,
  onItemClick,
  onDeleteItem,
}: {
  items: MediaItem[];
  onItemClick: (item: MediaItem) => void;
  onDeleteItem?: (item: MediaItem) => void;
}) {
  // Group items by date
  const groupedByDate = items.reduce(
    (acc, item) => {
      const dateKey = new Date(item.date).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const existing = acc[dateKey];
      if (!existing) {
        acc[dateKey] = [item];
      } else {
        existing.push(item);
      }
      return acc;
    },
    {} as Record<string, MediaItem[]>
  );

  return (
    <div className="px-4 space-y-8">
      {Object.entries(groupedByDate).map(([date, dateItems], groupIndex) => (
        <motion.div
          key={date}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: groupIndex * 0.1 }}
          className="relative pl-8 border-l-2 border-gradient-to-b from-blue-500 via-teal-500 to-amber-500"
          style={{
            borderImage:
              'linear-gradient(to bottom, #2563eb, #14b8a6, #f59e0b) 1',
          }}
        >
          {/* Date marker */}
          <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-gradient-to-r from-blue-600 to-teal-500 flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full" />
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">{date}</h3>
            <p className="text-sm text-slate-400">
              {dateItems.length} item{dateItems.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {dateItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: groupIndex * 0.1 + index * 0.05 }}
                onClick={() => onItemClick(item)}
                className="group cursor-pointer w-[180px]"
              >
                <div className="relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 hover:border-amber-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/20">
                  <div
                    className="w-full h-full bg-cover bg-center"
                    style={{
                      backgroundImage: item.url.startsWith('/api/placeholder')
                        ? undefined
                        : `url(${item.thumbnail || item.url})`,
                    }}
                  >
                    {item.url.startsWith('/api/placeholder') && (
                      <div className="flex items-center justify-center h-full text-slate-500">
                        {item.type === 'video' ? '🎬' : '🖼️'}
                      </div>
                    )}
                  </div>

                  {item.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white ml-0.5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Delete button */}
                  {onDeleteItem && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onDeleteItem(item);
                      }}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 backdrop-blur-md border border-red-400/50 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100 z-10"
                      title="Delete"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="mt-2 text-white text-sm font-medium truncate">
                  {item.title}
                </p>
                <p className="text-slate-400 text-xs truncate">
                  {item.studentName}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Delete Confirmation Modal
function DeleteConfirmModal({
  item,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  item: MediaItem;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Delete Media</h3>
            <p className="text-sm text-slate-400">
              This action cannot be undone
            </p>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-16 h-12 rounded-lg bg-slate-700 flex items-center justify-center text-2xl">
              {item.type === 'video' ? '🎬' : '🖼️'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{item.title}</p>
              <p className="text-slate-400 text-sm">{item.studentName}</p>
            </div>
          </div>
        </div>

        <p className="text-slate-300 text-sm mb-6">
          Are you sure you want to delete &ldquo;{item.title}&rdquo;? This will
          permanently remove the {item.type} from the gallery.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// No sample data - gallery shows empty state until real media is uploaded

// Row component for Netflix-style horizontal scroll with watermorphism
function MediaRow({
  title,
  items,
  onItemClick,
  onDeleteItem,
}: {
  title: string;
  items: MediaItem[];
  onItemClick: (item: MediaItem) => void;
  onDeleteItem?: (item: MediaItem) => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const scrollAmount = 320;
      rowRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleScroll = () => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const ref = rowRef.current;
    if (ref) {
      ref.addEventListener('scroll', handleScroll);
      handleScroll();
      return () => ref.removeEventListener('scroll', handleScroll);
    }
    return undefined;
  }, []);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 group/row">
      <div className="flex items-center gap-3 mb-4 px-4">
        <div className="h-6 w-1 bg-gradient-to-b from-blue-500 via-teal-500 to-amber-500 rounded-full" />
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <span className="text-xs text-slate-400 bg-white/10 backdrop-blur-sm px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>
      <div className="relative">
        {/* Left Arrow with glass effect */}
        <AnimatePresence>
          {showLeftArrow && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onClick={() => scroll('left')}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 z-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-lg shadow-black/20 opacity-0 group-hover/row:opacity-100"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Media Items */}
        <div
          ref={rowRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide px-4 scroll-smooth pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((item, index) => (
            <MediaCard
              key={item.id}
              item={item}
              index={index}
              onClick={() => onItemClick(item)}
              {...(onDeleteItem ? { onDelete: onDeleteItem } : {})}
            />
          ))}
        </div>

        {/* Right Arrow with glass effect */}
        <AnimatePresence>
          {showRightArrow && (
            <motion.button
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onClick={() => scroll('right')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 z-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-lg shadow-black/20 opacity-0 group-hover/row:opacity-100"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Individual media card component with watermorphism
function MediaCard({
  item,
  index = 0,
  onClick,
  onDelete,
}: {
  item: MediaItem;
  index?: number;
  onClick: () => void;
  onDelete?: (item: MediaItem) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(item);
  };

  return (
    <motion.div
      className="flex-shrink-0 w-[200px] md:w-[280px] cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      whileHover={{ scale: 1.03, y: -5 }}
    >
      <div className="relative rounded-xl overflow-hidden aspect-video shadow-lg border border-white/10 hover:border-blue-500/50 transition-all duration-300 group">
        {/* Glass reflection effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />

        {/* Thumbnail/Image */}
        <div
          className="w-full h-full bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 flex items-center justify-center"
          style={{
            backgroundImage: item.url.startsWith('/api/placeholder')
              ? undefined
              : `url(${item.thumbnail || item.url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Placeholder content when no real image */}
          {item.url.startsWith('/api/placeholder') && (
            <div className="flex flex-col items-center justify-center text-slate-500">
              <motion.div
                animate={{ scale: isHovered ? 1.1 : 1 }}
                className="w-16 h-16 rounded-full bg-white/5 backdrop-blur-sm flex items-center justify-center"
              >
                {item.type === 'video' ? (
                  <span className="text-3xl">🎬</span>
                ) : (
                  <span className="text-3xl">🖼️</span>
                )}
              </motion.div>
              <span className="text-xs mt-3 text-slate-400">{item.title}</span>
            </div>
          )}
        </div>

        {/* Video play icon overlay with glass effect */}
        {item.type === 'video' && !item.url.startsWith('/api/placeholder') && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-14 h-14 bg-black/40 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center shadow-xl"
              animate={{ scale: isHovered ? 1.15 : 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <svg
                className="w-6 h-6 text-white ml-1"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </motion.div>
          </div>
        )}

        {/* Hover overlay with glass effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent backdrop-blur-[2px] p-4 flex flex-col justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.25 }}
        >
          <h4 className="text-white font-semibold text-sm truncate">
            {item.title}
          </h4>
          {item.description && (
            <p className="text-slate-300 text-xs truncate mt-1">
              {item.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-3">
            <span className="px-2 py-0.5 text-xs bg-white/10 backdrop-blur-sm rounded-full text-slate-300">
              {new Date(item.date).toLocaleDateString()}
            </span>
            <span className="px-2 py-0.5 text-xs bg-gradient-to-r from-blue-500/20 to-teal-500/20 backdrop-blur-sm rounded-full text-slate-200 capitalize">
              {item.uploadedBy}
            </span>
          </div>
        </motion.div>

        {/* Type badge with glass effect */}
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5">
          {onDelete && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: isHovered ? 1 : 0,
                scale: isHovered ? 1 : 0.8,
              }}
              onClick={handleDeleteClick}
              className="w-7 h-7 bg-red-500/80 backdrop-blur-md border border-red-400/50 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
              title="Delete"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </motion.button>
          )}
          <span
            className={`px-2.5 py-1 text-xs font-medium rounded-full backdrop-blur-md border ${
              item.type === 'video'
                ? 'bg-red-500/80 border-red-400/50 text-white'
                : 'bg-blue-500/80 border-blue-400/50 text-white'
            }`}
          >
            {item.type === 'video' ? '▶ Video' : '📷 Photo'}
          </span>
        </div>

        {/* Water shimmer effect on hover */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
            animate={isHovered ? { x: ['-100%', '100%'] } : { x: '-100%' }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>

      {/* Bottom info with subtle glass effect */}
      <div className="mt-3 px-1">
        <h4 className="text-white font-medium text-sm truncate">
          {item.title}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-teal-500 flex items-center justify-center text-[8px] text-white font-bold">
            {item.studentName.charAt(0)}
          </div>
          <p className="text-slate-400 text-xs truncate">{item.studentName}</p>
        </div>
      </div>
    </motion.div>
  );
}

// Full-screen media viewer modal with watermorphism
function MediaViewer({
  item,
  onClose,
  onDelete,
}: {
  item: MediaItem;
  onClose: () => void;
  onDelete?: (item: MediaItem) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
      style={{
        background: `
          radial-gradient(ellipse at center, rgba(15, 23, 42, 0.98) 0%, rgba(0, 0, 0, 0.98) 100%),
          radial-gradient(ellipse at 20% 30%, rgba(37, 99, 235, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 70%, rgba(20, 184, 166, 0.15) 0%, transparent 50%)
        `,
      }}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-gradient-to-r from-blue-400/40 to-teal-400/40"
            initial={{ x: `${10 + i * 12}%`, y: '100%', opacity: 0 }}
            animate={{ y: '0%', opacity: [0, 1, 0] }}
            transition={{
              duration: 6 + i,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 0.8,
            }}
          />
        ))}
      </div>

      {/* Action buttons with glass effect */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-20">
        {onDelete && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            onClick={() => onDelete(item)}
            className="w-12 h-12 bg-red-500/20 backdrop-blur-xl border border-red-500/30 rounded-full flex items-center justify-center text-red-400 hover:text-white hover:bg-red-500/40 transition-all shadow-lg"
            title="Delete"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </motion.button>
        )}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          onClick={onClose}
          className="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-all shadow-lg"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25 }}
        className="max-w-5xl max-h-[90vh] w-full mx-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Media display with glass frame */}
        <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
          <div className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-xl aspect-video flex items-center justify-center">
            {item.type === 'video' ? (
              item.url.startsWith('/api/placeholder') ? (
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-24 h-24 rounded-full bg-white/5 backdrop-blur-sm flex items-center justify-center mb-4"
                  >
                    <span className="text-5xl">🎬</span>
                  </motion.div>
                  <span className="text-xl font-medium">
                    Video: {item.title}
                  </span>
                  <span className="text-sm text-slate-500 mt-2">
                    Upload media to see it here
                  </span>
                </div>
              ) : (
                <video
                  src={item.url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              )
            ) : item.url.startsWith('/api/placeholder') ? (
              <div className="flex flex-col items-center justify-center text-slate-400">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-24 h-24 rounded-full bg-white/5 backdrop-blur-sm flex items-center justify-center mb-4"
                >
                  <span className="text-5xl">🖼️</span>
                </motion.div>
                <span className="text-xl font-medium">Photo: {item.title}</span>
                <span className="text-sm text-slate-500 mt-2">
                  Upload media to see it here
                </span>
              </div>
            ) : (
              <img
                src={item.url}
                alt={item.title}
                className="w-full h-full object-contain"
              />
            )}
          </div>

          {/* Glass reflection overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Info panel with glass effect */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                {item.title}
              </h3>
              {item.description && (
                <p className="text-slate-300 mt-2 leading-relaxed">
                  {item.description}
                </p>
              )}
            </div>
            <span
              className={`px-3 py-1.5 text-sm font-medium rounded-full backdrop-blur-md ${
                item.type === 'video'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}
            >
              {item.type === 'video' ? '▶ Video' : '📷 Photo'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-5 pt-4 border-t border-white/10">
            <span className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full text-sm text-slate-300">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-teal-500 flex items-center justify-center text-xs font-bold text-white">
                {item.studentName.charAt(0)}
              </div>
              {item.studentName}
            </span>
            <span className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full text-sm text-slate-300">
              <svg
                className="w-4 h-4 text-teal-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {new Date(item.date).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <span className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full text-sm text-slate-300 capitalize">
              <svg
                className="w-4 h-4 text-amber-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              {item.uploaderName || item.uploadedBy}
            </span>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// Upload modal component
function UploadModal({
  students,
  onClose,
  onUploadComplete,
}: {
  students: StudentInfo[];
  onClose: () => void;
  onUploadComplete: (media: MediaItem) => void;
}) {
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(
    students.length === 1 ? students[0] || null : null
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB');
        return;
      }

      // Check file type
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      if (!isImage && !isVideo) {
        setError('Please select an image or video file');
        return;
      }

      setSelectedFile(file);
      setError(null);

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Auto-generate title from filename if empty
      if (!title) {
        const fileName = file.name.replace(/\.[^/.]+$/, '');
        setTitle(fileName.replace(/[-_]/g, ' '));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedStudent || !title) {
      setError('Please fill in all required fields');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const isVideo = selectedFile.type.startsWith('video/');
      const mediaType = isVideo ? 'video' : 'photo';
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${selectedStudent.id}/${Date.now()}.${fileExt}`;

      // Try to upload to Supabase Storage
      let mediaUrl = '';

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('student-media')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        // If bucket doesn't exist or upload fails, use local object URL
        console.warn('Storage upload failed, using local URL:', uploadError);
        mediaUrl = previewUrl || '';
      } else {
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('student-media')
          .getPublicUrl(uploadData.path);
        mediaUrl = urlData.publicUrl;
      }

      // Create media item
      const newMedia: MediaItem = {
        id: `media-${Date.now()}`,
        type: mediaType,
        url: mediaUrl,
        title: title,
        ...(description ? { description } : {}),
        date: new Date().toISOString(),
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        uploadedBy: 'parent',
      };

      // Save to database (optional - depends on whether media table exists)
      try {
        await supabase.from('student_media').insert({
          id: newMedia.id,
          student_id: newMedia.studentId,
          type: newMedia.type,
          url: newMedia.url,
          title: newMedia.title,
          description: newMedia.description,
          uploaded_by: newMedia.uploadedBy,
          created_at: newMedia.date,
        });
      } catch (dbError) {
        // Table might not exist, continue anyway
        console.warn('Could not save to database:', dbError);
      }

      onUploadComplete(newMedia);
      onClose();
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Upload Media</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Student Selection */}
          {students.length > 1 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Student *
              </label>
              <select
                value={selectedStudent?.id || ''}
                onChange={e => {
                  const student = students.find(s => s.id === e.target.value);
                  setSelectedStudent(student || null);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a student...</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* File Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Photo or Video *
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            {!selectedFile ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <svg
                  className="w-12 h-12 mx-auto text-slate-400 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-slate-600">
                  Click to select a photo or video
                </p>
                <p className="text-sm text-slate-400 mt-1">Max 50MB</p>
              </button>
            ) : (
              <div className="relative">
                {selectedFile.type.startsWith('video/') ? (
                  <video
                    src={previewUrl || ''}
                    className="w-full h-48 object-cover rounded-lg"
                    controls
                  />
                ) : (
                  <img
                    src={previewUrl || ''}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    if (previewUrl) {
                      URL.revokeObjectURL(previewUrl);
                    }
                    setPreviewUrl(null);
                  }}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Math Practice Session"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add notes about this activity..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={
                uploading || !selectedFile || !selectedStudent || !title
              }
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Upload
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Empty state component with liquid 3D interactive design
function EmptyGallery({ onUpload }: { onUpload?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16 px-4"
    >
      {/* Liquid 3D Orb with image icon */}
      <Liquid3DOrb
        size="xl"
        variant="gradient"
        theme="creative"
        interactive
        className="mx-auto mb-8"
      >
        <svg
          className="w-16 h-16 text-white/90 drop-shadow-lg"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </Liquid3DOrb>

      <motion.h3
        className="text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-teal-100 bg-clip-text text-transparent mb-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        No Media Yet
      </motion.h3>

      <motion.p
        className="text-slate-400 mb-8 max-w-md mx-auto text-lg"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Capture your children&apos;s learning moments. Photos and videos from
        activities will appear here.
      </motion.p>

      {onUpload && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
        >
          <LiquidButton
            variant="primary"
            size="lg"
            onClick={onUpload}
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            }
          >
            Upload First Media
          </LiquidButton>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function StudentMediaGallery({
  students,
  studentId,
  studentName,
  mediaItems,
  onUpload,
  onMediaAdded,
  onMediaDeleted,
  className = '',
}: StudentMediaGalleryProps) {
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [localMedia, setLocalMedia] = useState<MediaItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('carousel');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [showStats, setShowStats] = useState(true);
  const [itemToDelete, setItemToDelete] = useState<MediaItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Use only provided media items + locally added media
  const allMedia = [...(mediaItems || []), ...localMedia];

  const handleUploadComplete = useCallback(
    (newMedia: MediaItem) => {
      setLocalMedia(prev => [newMedia, ...prev]);
      onMediaAdded?.(newMedia);
    },
    [onMediaAdded]
  );

  const handleUploadClick = () => {
    if (onUpload) {
      onUpload();
    }
    setShowUploadModal(true);
  };

  const handleDeleteRequest = (item: MediaItem) => {
    setItemToDelete(item);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) {
      return;
    }

    setIsDeleting(true);
    try {
      // Try to delete from Supabase storage if it's a real URL
      if (
        !itemToDelete.url.startsWith('/api/placeholder') &&
        !itemToDelete.url.startsWith('blob:')
      ) {
        const urlParts = itemToDelete.url.split('/');
        const fileName = urlParts.slice(-2).join('/');
        await supabase.storage.from('student-media').remove([fileName]);
      }

      // Try to delete from database
      try {
        await supabase.from('student_media').delete().eq('id', itemToDelete.id);
      } catch (dbError) {
        console.warn('Could not delete from database:', dbError);
      }

      // Remove from local state
      setLocalMedia(prev => prev.filter(m => m.id !== itemToDelete.id));

      // Notify parent component
      onMediaDeleted?.(itemToDelete.id);

      // Close viewer if the deleted item was being viewed
      if (selectedItem?.id === itemToDelete.id) {
        setSelectedItem(null);
      }

      setItemToDelete(null);
    } catch (error) {
      console.error('Error deleting media:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Get available students for upload modal
  const availableStudents =
    students ||
    (studentId && studentName ? [{ id: studentId, name: studentName }] : []);

  // Filter by student if provided
  const studentFilteredMedia = studentId
    ? allMedia.filter(item => item.studentId === studentId)
    : allMedia;

  // Apply filters, search, and sort
  const filteredMedia = useMemo(() => {
    let result = [...studentFilteredMedia];

    // Type filter
    if (filter !== 'all') {
      result = result.filter(item => item.type === filter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        item =>
          item.title.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.studentName.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortOrder) {
        case 'oldest':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'name':
          return a.title.localeCompare(b.title);
        case 'newest':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    return result;
  }, [studentFilteredMedia, filter, searchQuery, sortOrder]);

  // Group media by categories (for carousel view)
  const recentMedia = [...filteredMedia].slice(0, 10);
  const photoMedia = filteredMedia.filter(item => item.type === 'photo');
  const videoMedia = filteredMedia.filter(item => item.type === 'video');

  // Group by student
  const studentGroups = filteredMedia.reduce(
    (acc, item) => {
      const existing = acc[item.studentName];
      if (!existing) {
        acc[item.studentName] = [item];
      } else {
        existing.push(item);
      }
      return acc;
    },
    {} as Record<string, MediaItem[]>
  );

  // Render the appropriate view
  const renderView = () => {
    switch (viewMode) {
      case 'grid':
        return (
          <GridView
            items={filteredMedia}
            onItemClick={setSelectedItem}
            onDeleteItem={handleDeleteRequest}
          />
        );
      case 'masonry':
        return (
          <MasonryView
            items={filteredMedia}
            onItemClick={setSelectedItem}
            onDeleteItem={handleDeleteRequest}
          />
        );
      case 'timeline':
        return (
          <TimelineView
            items={filteredMedia}
            onItemClick={setSelectedItem}
            onDeleteItem={handleDeleteRequest}
          />
        );
      case 'carousel':
      default:
        return (
          <>
            {recentMedia.length > 0 && (
              <MediaRow
                title="Recent Activity"
                items={recentMedia}
                onItemClick={setSelectedItem}
                onDeleteItem={handleDeleteRequest}
              />
            )}
            {photoMedia.length > 0 && (
              <MediaRow
                title="Photos"
                items={photoMedia}
                onItemClick={setSelectedItem}
                onDeleteItem={handleDeleteRequest}
              />
            )}
            {videoMedia.length > 0 && (
              <MediaRow
                title="Videos"
                items={videoMedia}
                onItemClick={setSelectedItem}
                onDeleteItem={handleDeleteRequest}
              />
            )}
            {!studentId &&
              Object.entries(studentGroups).map(([name, items]) => (
                <MediaRow
                  key={name}
                  title={`${name}'s Activities`}
                  items={items}
                  onItemClick={setSelectedItem}
                  onDeleteItem={handleDeleteRequest}
                />
              ))}
          </>
        );
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl py-8 ${className}`}
      style={{
        background: `
          linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 50%, rgba(15, 23, 42, 0.95) 100%),
          radial-gradient(ellipse at 20% 20%, rgba(37, 99, 235, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 80%, rgba(20, 184, 166, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 50%, rgba(245, 158, 11, 0.1) 0%, transparent 60%)
        `,
      }}
    >
      {/* Animated water ripple effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-30"
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 120,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            background: `
              conic-gradient(
                from 0deg,
                transparent 0deg,
                rgba(37, 99, 235, 0.1) 60deg,
                transparent 120deg,
                rgba(20, 184, 166, 0.1) 180deg,
                transparent 240deg,
                rgba(245, 158, 11, 0.1) 300deg,
                transparent 360deg
              )
            `,
          }}
        />
      </div>

      {/* Floating water drops effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-blue-400/30 to-teal-400/30 blur-sm"
            initial={{
              x: `${20 + i * 15}%`,
              y: '110%',
            }}
            animate={{
              y: '-10%',
              x: `${20 + i * 15 + Math.sin(i) * 10}%`,
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 1.5,
            }}
          />
        ))}
      </div>

      {/* Glass Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between px-4 mb-6 gap-4">
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl px-5 py-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-teal-400 to-amber-400 bg-clip-text text-transparent">
            {studentName ? `${studentName}'s Gallery` : 'Activity Gallery'}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Photos and videos from learning activities
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />
          {availableStudents.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleUploadClick}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white rounded-xl transition-all shadow-lg shadow-blue-500/25 font-medium"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Upload
            </motion.button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="relative z-10 px-4 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <FilterControls
          filter={filter}
          setFilter={setFilter}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <button
          onClick={() => setShowStats(!showStats)}
          className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1"
        >
          {showStats ? 'Hide' : 'Show'} Statistics
          <svg
            className={`w-4 h-4 transition-transform ${showStats ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* Statistics Panel */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-10 overflow-hidden"
          >
            <StatisticsPanel media={allMedia} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10">
        {filteredMedia.length === 0 ? (
          <EmptyGallery
            {...(availableStudents.length > 0
              ? { onUpload: handleUploadClick }
              : {})}
          />
        ) : (
          renderView()
        )}
      </div>

      {/* Full-screen viewer modal */}
      <AnimatePresence>
        {selectedItem && (
          <MediaViewer
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onDelete={handleDeleteRequest}
          />
        )}
      </AnimatePresence>

      {/* Upload modal */}
      <AnimatePresence>
        {showUploadModal && availableStudents.length > 0 && (
          <UploadModal
            students={availableStudents}
            onClose={() => setShowUploadModal(false)}
            onUploadComplete={handleUploadComplete}
          />
        )}
      </AnimatePresence>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {itemToDelete && (
          <DeleteConfirmModal
            item={itemToDelete}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setItemToDelete(null)}
            isDeleting={isDeleting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
