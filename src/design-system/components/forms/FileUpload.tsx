'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useFormContext, FieldValues } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { FileUploadProps, UploadProgress } from './types';

export function FileUpload<T extends FieldValues = FieldValues>({
  name,
  label,
  accept,
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 5,
  dragAndDrop = true,
  showProgress = true,
  onUpload,
  className,
  required = false,
  disabled = false,
}: FileUploadProps<T>) {
  const {
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<T>();
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const files = watch(name) || [];
  const error = errors[name];

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `File size exceeds ${formatFileSize(maxSize)}`;
    }

    if (accept) {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const fileType = file.type;
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

      const isAccepted = acceptedTypes.some(acceptedType => {
        if (acceptedType.startsWith('.')) {
          return acceptedType.toLowerCase() === fileExtension;
        }
        if (acceptedType.includes('*')) {
          const baseType = acceptedType.split('/')[0];
          if (baseType) {
            return fileType.startsWith(baseType);
          }
        }
        return acceptedType === fileType;
      });

      if (!isAccepted) {
        return `File type not accepted. Accepted types: ${accept}`;
      }
    }

    return null;
  };

  const processFiles = useCallback(
    async (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);
      const currentFiles = Array.isArray(files) ? files : [];

      // Validate file count
      if (!multiple && fileArray.length > 1) {
        console.error('Multiple files not allowed');
        return;
      }

      if (currentFiles.length + fileArray.length > maxFiles) {
        console.error(`Maximum ${maxFiles} files allowed`);
        return;
      }

      // Validate each file
      const validFiles: File[] = [];
      const invalidFiles: { file: File; error: string }[] = [];

      fileArray.forEach(file => {
        const error = validateFile(file);
        if (error) {
          invalidFiles.push({ file, error });
        } else {
          validFiles.push(file);
        }
      });

      if (invalidFiles.length > 0) {
        console.error('Invalid files:', invalidFiles);
        // TODO: Show user-friendly error messages
        return;
      }

      // Initialize upload progress
      const newProgress: UploadProgress[] = validFiles.map(file => ({
        file,
        progress: 0,
        status: 'pending',
      }));

      setUploadProgress(prev => [...prev, ...newProgress]);

      try {
        if (onUpload) {
          // Custom upload handler
          const uploadPromises = validFiles.map(async (file, index) => {
            const progressIndex = uploadProgress.length + index;

            setUploadProgress(prev =>
              prev.map((item, i) =>
                i === progressIndex
                  ? { ...item, status: 'uploading' as const }
                  : item
              )
            );

            try {
              // Simulate progress updates (in real implementation, this would come from upload progress)
              const progressInterval = setInterval(() => {
                setUploadProgress(prev =>
                  prev.map((item, i) =>
                    i === progressIndex && item.progress < 90
                      ? { ...item, progress: item.progress + 10 }
                      : item
                  )
                );
              }, 200);

              const result = await onUpload([file]);
              clearInterval(progressInterval);

              setUploadProgress(prev =>
                prev.map((item, i) =>
                  i === progressIndex
                    ? { ...item, progress: 100, status: 'completed' as const }
                    : item
                )
              );

              return result[0];
            } catch (error) {
              setUploadProgress(prev =>
                prev.map((item, i) =>
                  i === progressIndex
                    ? {
                        ...item,
                        status: 'error' as const,
                        error: (error as Error).message,
                      }
                    : item
                )
              );
              throw error;
            }
          });

          await Promise.all(uploadPromises);
        }

        // Update form value
        const updatedFiles = multiple
          ? [...currentFiles, ...validFiles]
          : validFiles;
        setValue(name, updatedFiles as any);
      } catch (error) {
        console.error('Upload failed:', error);
      }
    },
    [files, multiple, maxFiles, onUpload, setValue, name, uploadProgress.length]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      processFiles(selectedFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && dragAndDrop) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (!disabled && dragAndDrop) {
      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles.length > 0) {
        processFiles(droppedFiles);
      }
    }
  };

  const removeFile = (index: number) => {
    const updatedFiles = Array.isArray(files)
      ? files.filter((_: any, i: number) => i !== index)
      : [];
    setValue(name, updatedFiles as any);

    // Remove corresponding progress
    setUploadProgress(prev => prev.filter((_, i) => i !== index));
  };

  const clearProgress = () => {
    setUploadProgress([]);
  };

  return (
    <div className={clsx('space-y-4', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div
        className={clsx(
          'relative border-2 border-dashed rounded-lg p-6 transition-all duration-200',
          'hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10',
          isDragOver && 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-red-300 bg-red-50 dark:bg-red-900/10',
          !error && !isDragOver && 'border-gray-300 dark:border-gray-600'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="text-center">
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: isDragOver ? 1.1 : 1 }}
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 48 48">
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            {dragAndDrop ? (
              <>
                <span className="font-medium text-blue-600 hover:text-blue-500">
                  Click to upload
                </span>{' '}
                or drag and drop
              </>
            ) : (
              <span className="font-medium text-blue-600 hover:text-blue-500">
                Click to upload
              </span>
            )}
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {accept && <div>Accepted: {accept}</div>}
            <div>Max size: {formatFileSize(maxSize)}</div>
            {multiple && <div>Max files: {maxFiles}</div>}
          </div>
        </div>
      </div>

      {/* File List */}
      <AnimatePresence>
        {Array.isArray(files) && files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Selected Files ({files.length})
            </div>
            {files.map((file: File, index: number) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {file.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="ml-3 text-red-500 hover:text-red-700 transition-colors"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Progress */}
      <AnimatePresence>
        {showProgress && uploadProgress.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Upload Progress
              </div>
              <button
                type="button"
                onClick={clearProgress}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Clear
              </button>
            </div>

            {uploadProgress.map((progress, index) => (
              <motion.div
                key={`${progress.file.name}-${index}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {progress.file.name}
                  </span>
                  <span
                    className={clsx(
                      'text-xs px-2 py-1 rounded-full',
                      progress.status === 'completed' &&
                        'bg-green-100 text-green-800',
                      progress.status === 'uploading' &&
                        'bg-blue-100 text-blue-800',
                      progress.status === 'error' && 'bg-red-100 text-red-800',
                      progress.status === 'pending' &&
                        'bg-gray-100 text-gray-800'
                    )}
                  >
                    {progress.status}
                  </span>
                </div>

                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <motion.div
                    className={clsx(
                      'h-2 rounded-full transition-colors',
                      progress.status === 'completed' && 'bg-green-500',
                      progress.status === 'uploading' && 'bg-blue-500',
                      progress.status === 'error' && 'bg-red-500',
                      progress.status === 'pending' && 'bg-gray-400'
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                {progress.error && (
                  <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {progress.error}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600 dark:text-red-400"
        >
          {error.message as string}
        </motion.p>
      )}
    </div>
  );
}
