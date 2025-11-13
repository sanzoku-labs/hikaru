/**
 * FileUploadZone - Drag-and-drop file upload component (Mockup 2)
 *
 * Features:
 * - Drag-and-drop upload
 * - Click to browse fallback
 * - File type validation
 * - File size validation
 * - Progress indicator
 * - Multiple file support
 */

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface FileWithPreview extends File {
  preview?: string;
  uploadProgress?: number;
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

interface FileUploadZoneProps {
  onUpload: (files: File[]) => Promise<void>;
  multiple?: boolean;
  maxSize?: number; // in MB
  acceptedFileTypes?: string[];
  disabled?: boolean;
  className?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export function FileUploadZone({
  onUpload,
  multiple = false,
  maxSize = 10, // 10MB default
  acceptedFileTypes = ['.csv', '.xlsx', '.xls'],
  disabled = false,
  className
}: FileUploadZoneProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError(null);

      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const errors = rejectedFiles.map((file) => {
          if (file.errors[0]?.code === 'file-too-large') {
            return `${file.file.name}: File is larger than ${maxSize}MB`;
          }
          if (file.errors[0]?.code === 'file-invalid-type') {
            return `${file.file.name}: Invalid file type. Accepted: ${acceptedFileTypes.join(', ')}`;
          }
          return `${file.file.name}: Upload failed`;
        });
        setError(errors.join('\n'));
        return;
      }

      // Add files to state with preview
      const filesWithPreview: FileWithPreview[] = acceptedFiles.map((file) => {
        const fileWithPreview = file as FileWithPreview;
        fileWithPreview.uploadStatus = 'pending';
        fileWithPreview.uploadProgress = 0;
        return fileWithPreview;
      });

      setFiles((prev) => (multiple ? [...prev, ...filesWithPreview] : filesWithPreview));

      // Start upload
      setUploading(true);
      try {
        await onUpload(acceptedFiles);

        // Mark all as success
        setFiles((prev) =>
          prev.map((f) => ({
            ...f,
            uploadStatus: 'success',
            uploadProgress: 100
          }))
        );
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Upload failed';
        setError(errorMsg);

        // Mark all as error
        setFiles((prev) =>
          prev.map((f) => ({
            ...f,
            uploadStatus: 'error',
            errorMessage: errorMsg
          }))
        );
      } finally {
        setUploading(false);
      }
    },
    [onUpload, multiple, maxSize, acceptedFileTypes]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => {
      if (type === '.csv') acc['text/csv'] = ['.csv'];
      if (type === '.xlsx' || type === '.xls') {
        acc['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] = ['.xlsx'];
        acc['application/vnd.ms-excel'] = ['.xls'];
      }
      return acc;
    }, {} as Record<string, string[]>),
    maxSize: maxSize * 1024 * 1024,
    multiple,
    disabled: disabled || uploading
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setFiles([]);
    setError(null);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all',
          'hover:border-primary hover:bg-accent/50',
          isDragActive && 'border-primary bg-accent/50 scale-[1.02]',
          disabled && 'opacity-50 cursor-not-allowed',
          uploading && 'cursor-wait'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div className={cn(
            'p-4 rounded-full bg-accent transition-transform',
            isDragActive && 'scale-110'
          )}>
            <Upload className={cn(
              'h-10 w-10 text-muted-foreground',
              isDragActive && 'text-primary'
            )} />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </h3>
            <p className="text-sm text-muted-foreground">
              or click to browse your computer
            </p>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>Supported formats: {acceptedFileTypes.join(', ')}</p>
            <p>Maximum file size: {maxSize}MB</p>
          </div>

          <Button type="button" variant="outline" size="sm" disabled={disabled || uploading}>
            Browse Files
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
        </Alert>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              {multiple ? `${files.length} file(s)` : 'Selected file'}
            </h4>
            {files.length > 1 && (
              <Button variant="ghost" size="sm" onClick={clearAll}>
                Clear All
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card"
              >
                <div className="flex-shrink-0">
                  <File className="h-8 w-8 text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>

                  {/* Progress Bar */}
                  {file.uploadStatus === 'uploading' && (
                    <Progress value={file.uploadProgress || 0} className="mt-2 h-1" />
                  )}

                  {/* Error Message */}
                  {file.uploadStatus === 'error' && file.errorMessage && (
                    <p className="text-xs text-destructive mt-1">{file.errorMessage}</p>
                  )}
                </div>

                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {file.uploadStatus === 'success' && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                  {file.uploadStatus === 'error' && (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                  {file.uploadStatus === 'pending' && !uploading && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
