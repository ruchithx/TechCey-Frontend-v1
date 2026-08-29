"use client";

import { useRef, useState } from "react";
import { UploadCloud, X } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { env } from "@/core/config/env";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  error?: string;
}

export function ImageUpload({ value, onChange, error }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setUploadError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("upload_preset", env.cloudinaryUploadPreset);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${env.cloudinaryCloudName}/image/upload`,
        { method: "POST", body },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { secure_url: string };
      onChange(data.secure_url);
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload product image"
        className="relative flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-input bg-muted/30 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && !uploading && inputRef.current?.click()}
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Product preview"
              className="max-h-48 rounded object-contain p-2"
            />
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2 size-6"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              aria-label="Remove image"
            >
              <X className="size-3" />
            </Button>
          </>
        ) : uploading ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <UploadCloud className="size-8 animate-pulse" />
            <span className="text-sm">Uploading…</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <UploadCloud className="size-8" />
            <span className="text-sm font-medium">Click to choose an image</span>
            <span className="text-xs">PNG, JPG, WEBP up to 10 MB</span>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />
      </div>

      {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
      {error && !uploadError && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
