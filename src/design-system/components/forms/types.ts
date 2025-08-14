import { ReactNode } from 'react';
import { FieldValues, UseFormReturn, FieldPath } from 'react-hook-form';
import { ZodSchema } from 'zod';

export interface SmartFormProps<T extends FieldValues = FieldValues> {
  schema: ZodSchema<T>;
  onSubmit: (data: T) => Promise<void> | void;
  children: ReactNode;
  defaultValues?: Partial<T>;
  aiAssisted?: boolean;
  realTimeValidation?: boolean;
  className?: string;
  form?: UseFormReturn<T>;
}

export interface AutoCompleteInputProps<T extends FieldValues = FieldValues> {
  name: FieldPath<T>;
  label?: string;
  placeholder?: string;
  suggestions?: string[];
  aiPowered?: boolean;
  onSuggestionsFetch?: (query: string) => Promise<string[]>;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export interface DateTimePickerProps<T extends FieldValues = FieldValues> {
  name: FieldPath<T>;
  label?: string;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  conflictDetection?: boolean;
  onConflictCheck?: (date: Date) => Promise<ConflictInfo[]>;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export interface ConflictInfo {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  type: 'session' | 'appointment' | 'event';
  severity: 'low' | 'medium' | 'high';
}

export interface FileUploadProps<T extends FieldValues = FieldValues> {
  name: FieldPath<T>;
  label?: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  dragAndDrop?: boolean;
  showProgress?: boolean;
  onUpload?: (files: File[]) => Promise<string[]>;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}