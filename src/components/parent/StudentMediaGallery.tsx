'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
}

interface StudentMediaGalleryProps {
  studentId?: string;
  studentName?: string;
  mediaItems?: MediaItem[];
  onUpload?: () => void;
  className?: string;
}

// Sample media data - in production, this would come from database
const sampleMedia: MediaItem[] = [
  {
    id: '1',
    type: 'photo',
    url: '/api/placeholder/400/300',
    title: 'Art Project Complete',
    description: 'Finished watercolor painting of sunset',
    date: '2026-01-25',
    studentId: 'student-1',
    studentName: 'Emma',
    uploadedBy: 'teacher',
    uploaderName: 'Mrs. Johnson',
  },
  {
    id: '2',
    type: 'video',
    url: '/api/placeholder/400/300',
    thumbnail: '/api/placeholder/400/300',
    title: 'Piano Recital',
    description: 'Playing Moonlight Sonata',
    date: '2026-01-24',
    studentId: 'student-1',
    studentName: 'Emma',
    uploadedBy: 'parent',
    uploaderName: 'Dad',
  },
  {
    id: '3',
    type: 'photo',
    url: '/api/placeholder/400/300',
    title: 'Science Experiment',
    description: 'Volcano eruption project',
    date: '2026-01-23',
    studentId: 'student-1',
    studentName: 'Emma',
    uploadedBy: 'teacher',
    uploaderName: 'Mr. Smith',
  },
];

// Row component for Netflix-style horizontal scroll
function MediaRow({
  title,
  items,
  onItemClick,
}: {
  title: string;
  items: MediaItem[];
  onItemClick: (item: MediaItem) => void;
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
      <h3 className="text-lg font-semibold text-white mb-4 px-4">{title}</h3>
      <div className="relative">
        {/* Left Arrow */}
        <AnimatePresence>
          {showLeftArrow && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => scroll('left')}
              className="absolute left-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-r from-slate-900/90 to-transparent flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
            >
              <svg
                className="w-8 h-8 text-white"
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
          className="flex gap-3 overflow-x-auto scrollbar-hide px-4 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map(item => (
            <MediaCard
              key={item.id}
              item={item}
              onClick={() => onItemClick(item)}
            />
          ))}
        </div>

        {/* Right Arrow */}
        <AnimatePresence>
          {showRightArrow && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => scroll('right')}
              className="absolute right-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-l from-slate-900/90 to-transparent flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
            >
              <svg
                className="w-8 h-8 text-white"
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

// Individual media card component
function MediaCard({
  item,
  onClick,
}: {
  item: MediaItem;
  onClick: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="flex-shrink-0 w-[200px] md:w-[280px] cursor-pointer"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative rounded-lg overflow-hidden bg-slate-800 aspect-video shadow-lg">
        {/* Thumbnail/Image */}
        <div
          className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center"
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
              {item.type === 'video' ? (
                <svg
                  className="w-12 h-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-12 h-12"
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
              )}
              <span className="text-xs mt-2">{item.title}</span>
            </div>
          )}
        </div>

        {/* Video play icon overlay */}
        {item.type === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-14 h-14 bg-black/60 rounded-full flex items-center justify-center"
              animate={{ scale: isHovered ? 1.1 : 1 }}
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

        {/* Hover overlay with info */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 flex flex-col justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <h4 className="text-white font-medium text-sm truncate">
            {item.title}
          </h4>
          {item.description && (
            <p className="text-slate-300 text-xs truncate mt-1">
              {item.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <span>{new Date(item.date).toLocaleDateString()}</span>
            <span>•</span>
            <span className="capitalize">{item.uploadedBy}</span>
          </div>
        </motion.div>

        {/* Type badge */}
        <div className="absolute top-2 right-2">
          <span
            className={`px-2 py-0.5 text-xs font-medium rounded ${
              item.type === 'video'
                ? 'bg-red-500 text-white'
                : 'bg-blue-500 text-white'
            }`}
          >
            {item.type === 'video' ? 'Video' : 'Photo'}
          </span>
        </div>
      </div>

      {/* Bottom info (always visible) */}
      <div className="mt-2 px-1">
        <h4 className="text-white font-medium text-sm truncate">
          {item.title}
        </h4>
        <p className="text-slate-400 text-xs truncate">{item.studentName}</p>
      </div>
    </motion.div>
  );
}

// Full-screen media viewer modal
function MediaViewer({
  item,
  onClose,
}: {
  item: MediaItem;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white z-10"
      >
        <svg
          className="w-8 h-8"
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

      <div
        className="max-w-5xl max-h-[90vh] w-full mx-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Media display */}
        <div className="relative bg-slate-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
          {item.type === 'video' ? (
            item.url.startsWith('/api/placeholder') ? (
              <div className="flex flex-col items-center justify-center text-slate-500">
                <svg
                  className="w-20 h-20"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span className="mt-4 text-lg">Video: {item.title}</span>
                <span className="text-sm text-slate-600 mt-2">
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
            <div className="flex flex-col items-center justify-center text-slate-500">
              <svg
                className="w-20 h-20"
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
              <span className="mt-4 text-lg">Photo: {item.title}</span>
              <span className="text-sm text-slate-600 mt-2">
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

        {/* Info panel */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-b-lg p-4">
          <h3 className="text-xl font-semibold text-white">{item.title}</h3>
          {item.description && (
            <p className="text-slate-300 mt-2">{item.description}</p>
          )}
          <div className="flex items-center gap-4 mt-4 text-sm text-slate-400">
            <span className="flex items-center gap-1">
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              {item.studentName}
            </span>
            <span className="flex items-center gap-1">
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {new Date(item.date).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <span className="flex items-center gap-1">
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
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Uploaded by {item.uploaderName || item.uploadedBy}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Empty state component
function EmptyGallery({ onUpload }: { onUpload?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16 px-4"
    >
      <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg
          className="w-12 h-12 text-slate-500"
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
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">No Media Yet</h3>
      <p className="text-slate-400 mb-6 max-w-md mx-auto">
        Capture your children&apos;s learning moments. Photos and videos from
        activities will appear here.
      </p>
      {onUpload && (
        <button
          onClick={onUpload}
          className="px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-lg font-medium hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg shadow-sky-500/25"
        >
          Upload First Media
        </button>
      )}
    </motion.div>
  );
}

export default function StudentMediaGallery({
  studentId,
  studentName,
  mediaItems,
  onUpload,
  className = '',
}: StudentMediaGalleryProps) {
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  // Use provided media or sample data
  const allMedia = mediaItems || sampleMedia;

  // Filter by student if provided
  const filteredMedia = studentId
    ? allMedia.filter(item => item.studentId === studentId)
    : allMedia;

  // Group media by categories
  const recentMedia = [...filteredMedia]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

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

  return (
    <div
      className={`bg-gradient-to-b from-slate-900 to-slate-800 rounded-2xl py-8 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {studentName ? `${studentName}'s Gallery` : 'Activity Gallery'}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Photos and videos from learning activities
          </p>
        </div>
        {onUpload && (
          <button
            onClick={onUpload}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
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
          </button>
        )}
      </div>

      {filteredMedia.length === 0 ? (
        <EmptyGallery {...(onUpload ? { onUpload } : {})} />
      ) : (
        <>
          {/* Recent Activity Row */}
          {recentMedia.length > 0 && (
            <MediaRow
              title="Recent Activity"
              items={recentMedia}
              onItemClick={setSelectedItem}
            />
          )}

          {/* Photos Row */}
          {photoMedia.length > 0 && (
            <MediaRow
              title="Photos"
              items={photoMedia}
              onItemClick={setSelectedItem}
            />
          )}

          {/* Videos Row */}
          {videoMedia.length > 0 && (
            <MediaRow
              title="Videos"
              items={videoMedia}
              onItemClick={setSelectedItem}
            />
          )}

          {/* Per-Student Rows (if not filtered to single student) */}
          {!studentId &&
            Object.entries(studentGroups).map(([name, items]) => (
              <MediaRow
                key={name}
                title={`${name}'s Activities`}
                items={items}
                onItemClick={setSelectedItem}
              />
            ))}
        </>
      )}

      {/* Full-screen viewer modal */}
      <AnimatePresence>
        {selectedItem && (
          <MediaViewer
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
