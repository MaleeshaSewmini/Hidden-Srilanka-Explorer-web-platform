"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import {
  X,
  Camera,
  Upload,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type ContributePhotoModalProps = {
  place: {
    id: string;
    name: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
};

export default function ContributePhotoModal({
  place,
  isOpen,
  onClose,
}: ContributePhotoModalProps) {
  const [mode, setMode] = useState<"file" | "url">("file");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [caption, setCaption] = useState("");
  const [contributorName, setContributorName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Close on Escape key press
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Clean up preview object URL
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!isOpen || !place) return null;

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (JPEG, PNG, WEBP).");
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setErrorMessage("Image must be smaller than 5MB.");
      return;
    }

    setErrorMessage("");
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    let finalImageUrl = "";

    try {
      setSubmitting(true);

      if (mode === "file") {
        if (!file) {
          setErrorMessage("Please select an image file to upload.");
          setSubmitting(false);
          return;
        }

        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const filePath = `community-photos/${place!.id}-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("place-images")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });

        if (uploadError) {
          // If storage bucket isn't available or fails, inform user
          console.error("STORAGE_UPLOAD_ERROR", uploadError);
          throw new Error(
            uploadError.message || "Failed to upload photo file. Try using the Image URL option."
          );
        }

        const { data: publicUrlData } = supabase.storage
          .from("place-images")
          .getPublicUrl(filePath);

        finalImageUrl = publicUrlData.publicUrl;
      } else {
        if (!imageUrlInput.trim()) {
          setErrorMessage("Please enter an image URL.");
          setSubmitting(false);
          return;
        }
        finalImageUrl = imageUrlInput.trim();
      }

      // Insert into place_photos table with pending status
      const { error: insertError } = await supabase.from("place_photos").insert({
        place_id: place!.id,
        image_url: finalImageUrl,
        caption: caption.trim() || null,
        contributor_name: contributorName.trim() || "Community Explorer",
        status: "pending",
      });

      if (insertError) {
        throw insertError;
      }

      setSuccess(true);
    } catch (err: any) {
      console.error("SUBMIT_PHOTO_ERROR", err);
      setErrorMessage(
        err.message || "Something went wrong while submitting the photo. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setFile(null);
    setPreviewUrl(null);
    setImageUrlInput("");
    setCaption("");
    setContributorName("");
    setSuccess(false);
    setErrorMessage("");
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={handleReset}
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-[28px] border border-[#d9d0bf] bg-white p-6 sm:p-8 shadow-2xl">
        {/* Sticky Cross Close Button at top-right */}
        <button
          type="button"
          onClick={handleReset}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#f6f1e8] text-[#0b2417] transition hover:bg-[#0b2417] hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {success ? (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="mt-4 font-display text-2xl font-bold text-[#0b2417]">
              Photo Submitted for Review!
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#61746a]">
              Thank you for contributing to <strong>{place.name}</strong>! Our moderators will review your photo shortly. Once approved, it will be published on the place card.
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-[#0b2417] px-6 py-2.5 text-xs font-bold text-white transition hover:bg-[#163c28]"
            >
              Done
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#c99a43]/20 text-[#a06a1d]">
                <Camera size={18} />
              </span>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#a06a1d]">
                  Community Contribution
                </span>
                <h3 className="font-display text-xl font-bold text-[#0b2417] sm:text-2xl">
                  Add a Photo for {place.name}
                </h3>
              </div>
            </div>

            <p className="mt-2 text-xs text-[#61746a]">
              Been to this place? Share your authentic photos to help fellow travellers discover Sri Lanka. Your photo will appear on the place card once verified by an admin.
            </p>

            {errorMessage && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Method Toggle: Upload File vs Image URL */}
              <div className="flex rounded-xl bg-[#f6f1e8] p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setMode("file");
                    setErrorMessage("");
                  }}
                  className={`flex-1 rounded-lg py-2 transition ${
                    mode === "file"
                      ? "bg-white text-[#0b2417] shadow-sm"
                      : "text-[#718078] hover:text-[#0b2417]"
                  }`}
                >
                  <Upload size={13} className="mr-1 inline" /> Upload File
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("url");
                    setErrorMessage("");
                  }}
                  className={`flex-1 rounded-lg py-2 transition ${
                    mode === "url"
                      ? "bg-white text-[#0b2417] shadow-sm"
                      : "text-[#718078] hover:text-[#0b2417]"
                  }`}
                >
                  <LinkIcon size={13} className="mr-1 inline" /> Image URL
                </button>
              </div>

              {/* File Upload Box */}
              {mode === "file" ? (
                <div>
                  {previewUrl ? (
                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-[#0b2417]/10 bg-slate-900">
                      <Image
                        src={previewUrl}
                        alt="Upload preview"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFile(null);
                          setPreviewUrl(null);
                        }}
                        className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex aspect-[16/9] w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#cdbfa5] bg-[#faf7f0] p-4 text-center transition hover:border-[#0b2417] hover:bg-[#f6f1e8]">
                      <Upload className="h-8 w-8 text-[#718078]" />
                      <span className="mt-2 text-xs font-semibold text-[#0b2417]">
                        Click to select a photo
                      </span>
                      <span className="mt-0.5 text-[11px] text-[#718078]">
                        PNG, JPG, WEBP up to 5MB
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#0b2417]">
                    Photo Web Link (URL)
                  </label>
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => {
                      setImageUrlInput(e.target.value);
                      setPreviewUrl(e.target.value.trim() || null);
                    }}
                    placeholder="https://images.unsplash.com/... or your photo URL"
                    className="mt-1.5 w-full rounded-xl border border-[#d9d0bf] bg-white px-3.5 py-2.5 text-xs text-[#0b2417] focus:border-[#0b2417] focus:outline-none"
                  />
                  {previewUrl && (
                    <div className="relative mt-2 aspect-[16/9] w-full overflow-hidden rounded-xl border border-[#0b2417]/10 bg-slate-900">
                      <Image
                        src={previewUrl}
                        alt="Preview"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Caption */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#0b2417]">
                  Caption or Description (optional)
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="e.g. Taken from the upper ridge trail in early morning"
                  className="mt-1.5 w-full rounded-xl border border-[#d9d0bf] bg-white px-3.5 py-2 text-xs text-[#0b2417] focus:border-[#0b2417] focus:outline-none"
                />
              </div>

              {/* Contributor Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#0b2417]">
                  Your Name or Handle (optional)
                </label>
                <input
                  type="text"
                  value={contributorName}
                  onChange={(e) => setContributorName(e.target.value)}
                  placeholder="e.g. Kasun or anonymous explorer"
                  className="mt-1.5 w-full rounded-xl border border-[#d9d0bf] bg-white px-3.5 py-2 text-xs text-[#0b2417] focus:border-[#0b2417] focus:outline-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || (!file && !imageUrlInput.trim())}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b2417] py-3 text-xs font-bold text-white transition hover:bg-[#163c28] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Submitting for Review...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} /> Submit Photo for Review
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

