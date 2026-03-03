import React, { useCallback, useState } from 'react';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';
import { clsx } from 'clsx';

interface FileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

export function FileUpload({ files, onFilesChange }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFilesChange([...files, ...Array.from(e.dataTransfer.files)]);
      }
    },
    [files, onFilesChange]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onFilesChange([...files, ...Array.from(e.target.files)]);
      }
    },
    [files, onFilesChange]
  );

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    onFilesChange(newFiles);
  };

  return (
    <div className="w-full">
      <div
        className={clsx(
          'relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl transition-colors',
          isDragging
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
            : 'border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileSelect}
          accept=".pdf,.docx,.xlsx,.xls,.csv,.txt,.md,image/*"
        />
        <UploadCloud className="w-8 h-8 mb-2 text-slate-400" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          <span className="font-semibold">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-slate-400 mt-1">
          PDF, Word, Excel, Images, Text
        </p>
      </div>

      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-3 text-sm bg-white border rounded-lg shadow-sm border-slate-200 dark:bg-slate-800 dark:border-slate-700"
            >
              <div className="flex items-center space-x-3 overflow-hidden">
                <FileIcon className="w-5 h-5 text-indigo-500 shrink-0" />
                <span className="truncate text-slate-700 dark:text-slate-300">
                  {file.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="p-1 text-slate-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
