"use client";

import { ChangeEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { MemberAvatar } from "@/app/components/MemberAvatar";

const MAX_IMAGE_BYTES = 120 * 1024;
const MAX_SOURCE_BYTES = 12 * 1024 * 1024;

type ProfileImageControlProps = {
  memberName: string;
  hasImage?: boolean;
  compact?: boolean;
  mode?: "buttons" | "avatar";
  name?: string;
  tone?: string;
  imageDataUrl?: string;
  avatarClassName?: string;
  avatarTextClassName?: string;
};

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Immagine non leggibile."));
    };
    image.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Compressione immagine non riuscita."));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      quality
    );
  });
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Lettura immagine non riuscita."));
    reader.readAsDataURL(blob);
  });
}

async function resizeImage(file: File) {
  const image = await loadImage(file);
  const attempts = [
    { maxSize: 360, quality: 0.78 },
    { maxSize: 288, quality: 0.72 },
    { maxSize: 220, quality: 0.68 },
    { maxSize: 180, quality: 0.62 },
  ];

  for (const attempt of attempts) {
    const scale = Math.min(1, attempt.maxSize / image.width, attempt.maxSize / image.height);
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) throw new Error("Canvas non disponibile nel browser.");

    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, attempt.quality);
    if (blob.size <= MAX_IMAGE_BYTES) return blobToDataUrl(blob);
  }

  throw new Error("La foto resta troppo pesante anche dopo la riduzione.");
}

export function ProfileImageControl({
  memberName,
  hasImage,
  compact,
  mode = "buttons",
  name,
  tone = "bg-[#f9d8d6]",
  imageDataUrl,
  avatarClassName = "size-9",
  avatarTextClassName = "text-sm",
}: ProfileImageControlProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function saveImage(imageDataUrl: string | null) {
    const response = await fetch(
      `/api/family/members/${encodeURIComponent(memberName)}`,
      {
        body: JSON.stringify({ imageDataUrl }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      }
    );
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error ?? "Non sono riuscita ad aggiornare la foto.");
    }

    router.refresh();
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    setError("");

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Seleziona un file immagine.");
      return;
    }

    if (file.size > MAX_SOURCE_BYTES) {
      setError("La foto originale e troppo grande. Scegline una sotto 12MB.");
      return;
    }

    setIsSaving(true);
    try {
      const imageDataUrl = await resizeImage(file);
      await saveImage(imageDataUrl);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Non sono riuscita a preparare la foto."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function removeImage() {
    setError("");
    setIsSaving(true);
    try {
      await saveImage(null);
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Non sono riuscita a rimuovere la foto."
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (mode === "avatar") {
    return (
      <div className="relative inline-flex">
        <input
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          ref={inputRef}
          type="file"
        />
        <button
          aria-label={`Cambia foto profilo di ${name ?? memberName}`}
          className="relative rounded-lg outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#8fa4d8] disabled:cursor-wait disabled:opacity-60"
          disabled={isSaving}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          <MemberAvatar
            className={avatarClassName}
            imageDataUrl={imageDataUrl}
            name={name ?? memberName}
            textClassName={avatarTextClassName}
            tone={tone}
          />
          <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border border-white bg-[#f6fbf7] text-[#315a45] shadow-sm">
            {isSaving ? (
              <Loader2 className="animate-spin" size={12} aria-hidden="true" />
            ) : (
              <Camera size={12} aria-hidden="true" />
            )}
          </span>
        </button>
        {hasImage ? (
          <button
            aria-label={`Rimuovi foto profilo di ${name ?? memberName}`}
            className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full border border-white bg-[#fff7f5] text-[#9f4d46] shadow-sm transition hover:bg-[#fdece8] disabled:cursor-wait disabled:opacity-60"
            disabled={isSaving}
            onClick={removeImage}
            type="button"
          >
            <Trash2 size={11} aria-hidden="true" />
          </button>
        ) : null}
        {error ? (
          <span className="sr-only" role="status">
            {error}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      <input
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        ref={inputRef}
        type="file"
      />
      <div className={compact ? "flex flex-wrap gap-1.5" : "flex flex-wrap gap-2"}>
        <button
          className={`inline-flex items-center justify-center gap-1.5 rounded-md border border-[#d5e0d8] bg-[#f6fbf7] font-semibold text-[#315a45] transition hover:bg-[#edf6ef] disabled:cursor-wait disabled:opacity-60 ${
            compact ? "min-h-8 px-2 text-xs" : "h-9 px-3 text-sm"
          }`}
          disabled={isSaving}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          {isSaving ? (
            <Loader2 className="animate-spin" size={14} aria-hidden="true" />
          ) : (
            <Camera size={14} aria-hidden="true" />
          )}
          {hasImage ? "Cambia" : "Foto"}
        </button>
        {hasImage ? (
          <button
            className={`inline-flex items-center justify-center gap-1.5 rounded-md border border-[#f1d8cf] bg-[#fff7f5] font-semibold text-[#9f4d46] transition hover:bg-[#fdece8] disabled:cursor-wait disabled:opacity-60 ${
              compact ? "min-h-8 px-2 text-xs" : "h-9 px-3 text-sm"
            }`}
            disabled={isSaving}
            onClick={removeImage}
            type="button"
          >
            <Trash2 size={14} aria-hidden="true" />
            Rimuovi
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="text-xs font-medium leading-5 text-[#9f4d46]">{error}</p>
      ) : null}
    </div>
  );
}
