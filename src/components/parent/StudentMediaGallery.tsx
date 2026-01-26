'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

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

interface StudentInfo {
  id: string;
  name: string;
}

interface StudentMediaGalleryProps {
  students?: StudentInfo[];
  studentId?: string;
  studentName?: string;
  mediaItems?: MediaItem[];
  onUpload?: () => void;
  onMediaAdded?: (media: MediaItem) => void;
  className?: string;
}

// No sample data - gallery shows empty state until real media is uploaded

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
  students,
  studentId,
  studentName,
  mediaItems,
  onUpload,
  onMediaAdded,
  className = '',
}: StudentMediaGalleryProps) {
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [localMedia, setLocalMedia] = useState<MediaItem[]>([]);

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

  // Get available students for upload modal
  const availableStudents =
    students ||
    (studentId && studentName ? [{ id: studentId, name: studentName }] : []);

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
        {availableStudents.length > 0 && (
          <button
            onClick={handleUploadClick}
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
        <EmptyGallery
          {...(availableStudents.length > 0
            ? { onUpload: handleUploadClick }
            : {})}
        />
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
    </div>
  );
}
