"use client";

import { useCallback, useState } from "react";
import { ImagePlus, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCEPT = "image/jpeg,image/jpg,image/png,image/webp";

export function ImageUploadZone({
  onFiles,
  disabled,
}: {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}) {
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    (list: FileList | null) => {
      if (!list?.length || disabled) return;
      const files = Array.from(list).filter((f) => f.type.startsWith("image/"));
      if (files.length) onFiles(files);
    },
    [disabled, onFiles]
  );

  return (
    <label
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
        dragOver ? "border-blue-500 bg-indigo-50/50" : "border-gray-300 bg-gray-50/50 hover:border-blue-400 hover:bg-indigo-50/30",
        disabled && "pointer-events-none opacity-50"
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <input
        type="file"
        accept={ACCEPT}
        multiple
        className="sr-only"
        disabled={disabled}
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
        <Upload className="h-7 w-7" />
      </div>
      <p className="mt-4 text-lg font-semibold text-gray-900">
        Drag & drop images here
      </p>
      <p className="mt-1 text-sm text-gray-500">or click to browse</p>
      <p className="mt-3 flex items-center gap-1 text-xs text-gray-400">
        <ImagePlus className="h-3.5 w-3.5" />
        JPG, JPEG, PNG, WEBP · multiple files · max 5 MB each
      </p>
    </label>
  );
}
