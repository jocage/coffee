"use client";

import { ImagePlus, Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/format";
import type { mediaEntitySchema } from "@/lib/validators/media";
import type { z } from "zod";

type MediaEntityType = z.infer<typeof mediaEntitySchema>;

type UploadState = {
  assetId: string;
  publicUrl: string;
  storageKey: string;
};

type CropState = {
  file: File;
  previewUrl: string;
};

export function MediaUploadField({
  entityType,
  label,
  urlFieldName,
  assetFieldName,
  initialUrl,
  initialAssetId,
  className
}: {
  entityType: MediaEntityType;
  label: string;
  urlFieldName: string;
  assetFieldName?: string;
  initialUrl?: string;
  initialAssetId?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [upload, setUpload] = useState<UploadState | null>(
    initialUrl ? { assetId: initialAssetId ?? "", publicUrl: initialUrl, storageKey: "" } : null
  );
  const [crop, setCrop] = useState<CropState | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    return () => {
      if (crop?.previewUrl) URL.revokeObjectURL(crop.previewUrl);
    };
  }, [crop?.previewUrl]);

  function prepareCrop(file: File) {
    setError(null);
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
    setCrop((current) => {
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
      return { file, previewUrl: URL.createObjectURL(file) };
    });
  }

  async function uploadFile(file: File) {
    setError(null);
    startTransition(async () => {
      try {
        const presignResponse = await fetch("/api/media/presign", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            entityType,
            fileName: file.name,
            mimeType: file.type,
            size: file.size
          })
        });

        if (!presignResponse.ok) {
          throw new Error("Could not prepare upload.");
        }

        const presign = (await presignResponse.json()) as {
          assetId: string;
          uploadUrl: string;
          storageKey: string;
          headers: Record<string, string>;
          publicUrl?: string;
        };

        const uploadResponse = await fetch(presign.uploadUrl, {
          method: "PUT",
          headers: presign.headers,
          body: file
        });

        if (!uploadResponse.ok) {
          throw new Error("Could not upload file.");
        }

        const completeResponse = await fetch("/api/media/complete", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            assetId: presign.assetId,
            storageKey: presign.storageKey
          })
        });

        if (!completeResponse.ok) {
          throw new Error("Could not finalize upload.");
        }

        const completed = (await completeResponse.json()) as { publicUrl?: string };
        setUpload({
          assetId: presign.assetId,
          publicUrl: completed.publicUrl ?? presign.publicUrl ?? "",
          storageKey: presign.storageKey
        });
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Upload failed.");
      }
    });
  }

  async function uploadCroppedFile() {
    if (!crop) return;

    try {
      const cropped = await cropImage(crop.file, zoom, offsetX, offsetY);
      await uploadFile(cropped);
      setCrop((current) => {
        if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
        return null;
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not crop image.");
    }
  }

  return (
    <div className={cn("grid gap-3", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="sr-only"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) prepareCrop(file);
        }}
      />
      <input type="hidden" name={urlFieldName} value={upload?.publicUrl ?? ""} />
      {assetFieldName ? <input type="hidden" name={assetFieldName} value={upload?.assetId ?? ""} /> : null}
      <button
        type="button"
        className="focus-ring relative grid min-h-44 overflow-hidden rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] bg-white/5 text-left"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const file = event.dataTransfer.files[0];
          if (file) prepareCrop(file);
        }}
      >
        {upload?.publicUrl ? (
          <Image src={upload.publicUrl} alt="" fill sizes="420px" className="object-cover" unoptimized />
        ) : (
          <span className="flex flex-col items-center justify-center gap-3 p-5 text-center text-sm text-[var(--text-muted)]">
            {isPending ? <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" aria-hidden /> : <ImagePlus className="h-7 w-7 text-[var(--accent)]" aria-hidden />}
            <span className="font-semibold text-[var(--text)]">{isPending ? "Uploading..." : label}</span>
            <span>Drop an image here or choose a file.</span>
          </span>
        )}
      </button>
      <div className="flex min-h-8 items-center justify-between gap-3">
        {error ? <p role="alert" className="text-sm text-[var(--danger)]">{error}</p> : <p className="text-xs text-[var(--text-dim)]">JPEG, PNG, WebP or HEIC. Max 15 MB.</p>}
        {upload ? (
          <Button type="button" variant="ghost" size="sm" icon={<X className="h-4 w-4" aria-hidden />} onClick={() => setUpload(null)}>
            Remove
          </Button>
        ) : null}
      </div>
      {crop ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[#10100f] p-4 shadow-2xl" role="dialog" aria-label={`${label} crop`}>
          <div
            className="relative mx-auto aspect-square max-w-sm overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border)] bg-black"
            style={{
              backgroundImage: `url(${crop.previewUrl})`,
              backgroundPosition: `${50 + offsetX}% ${50 + offsetY}%`,
              backgroundRepeat: "no-repeat",
              backgroundSize: `${Math.round(100 * zoom)}% auto`
            }}
          />
          <div className="mt-4 grid gap-3">
            <RangeControl label="Zoom" min={1} max={3} step={0.05} value={zoom} onChange={setZoom} />
            <RangeControl label="Horizontal" min={-50} max={50} step={1} value={offsetX} onChange={setOffsetX} />
            <RangeControl label="Vertical" min={-50} max={50} step={1} value={offsetY} onChange={setOffsetY} />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                setCrop((current) => {
                  if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
                  return null;
                })
              }
            >
              Cancel
            </Button>
            <Button type="button" icon={<Upload className="h-4 w-4" aria-hidden />} disabled={isPending} onClick={uploadCroppedFile}>
              {isPending ? "Uploading..." : "Upload crop"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RangeControl({
  label,
  min,
  max,
  step,
  value,
  onChange
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="flex items-center justify-between text-[var(--text-muted)]">
        {label}
        <span>{Number.isInteger(value) ? value : value.toFixed(2)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        className="accent-[var(--accent)]"
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </label>
  );
}

async function cropImage(file: File, zoom: number, offsetX: number, offsetY: number): Promise<File> {
  if (file.type === "image/heic") {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const size = Math.min(bitmap.width, bitmap.height);
  const sourceSize = Math.max(1, size / zoom);
  const maxX = Math.max(0, bitmap.width - sourceSize);
  const maxY = Math.max(0, bitmap.height - sourceSize);
  const sourceX = clamp((bitmap.width - sourceSize) / 2 + (offsetX / 100) * maxX, 0, maxX);
  const sourceY = clamp((bitmap.height - sourceSize) / 2 + (offsetY / 100) * maxY, 0, maxY);
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 1200;
  const context = canvas.getContext("2d");

  if (!context) {
    bitmap.close();
    throw new Error("Could not prepare image crop.");
  }

  context.drawImage(bitmap, sourceX, sourceY, sourceSize, sourceSize, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => (result ? resolve(result) : reject(new Error("Could not export cropped image."))), "image/jpeg", 0.9);
  });
  const name = file.name.replace(/\.[^.]+$/, "") || "upload";
  return new File([blob], `${name}-crop.jpg`, { type: "image/jpeg" });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
