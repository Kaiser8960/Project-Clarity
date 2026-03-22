'use client';

import { useCallback, useState, useRef } from 'react';

interface UploadDropzoneProps {
  onUpload: (files: File[]) => void;
  accept?: string;
  maxSizeMb?: number;
}

export default function UploadDropzone({
  onUpload,
  accept = '.pdf,.png,.jpg,.jpeg',
  maxSizeMb = 20,
}: UploadDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragActive(false);
      const files = Array.from(e.dataTransfer.files).filter(
        (f) => f.size <= maxSizeMb * 1024 * 1024
      );
      if (files.length > 0) onUpload(files);
    },
    [onUpload, maxSizeMb]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []).filter(
        (f) => f.size <= maxSizeMb * 1024 * 1024
      );
      if (files.length > 0) onUpload(files);
    },
    [onUpload, maxSizeMb]
  );

  return (
    <div
      className={`dropzone ${isDragActive ? 'drag-active' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragActive(true);
      }}
      onDragLeave={() => setIsDragActive(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      <div
        style={{
          fontSize: '32px',
          marginBottom: '12px',
          opacity: isDragActive ? 1 : 0.5,
          transition: 'opacity 0.2s ease',
        }}
      >
        📁
      </div>
      <p
        style={{
          color: isDragActive ? 'var(--accent)' : 'var(--text-secondary)',
          fontSize: '14px',
          margin: '0 0 4px 0',
          fontWeight: 500,
        }}
      >
        {isDragActive ? 'Drop files here' : 'Drag & drop files or click to browse'}
      </p>
      <p
        style={{
          color: 'var(--text-muted)',
          fontSize: '12px',
          fontFamily: 'var(--font-mono)',
          margin: 0,
        }}
      >
        PDF, PNG, JPG — Max {maxSizeMb} MB per file
      </p>
    </div>
  );
}
