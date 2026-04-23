"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import { GripVertical, ImagePlus, Trash2, X } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  uploadPortfolioImage,
  deletePortfolioImage,
  updatePortfolioOrder,
} from "@/lib/actions/portfolio";
import type { PortfolioImage } from "@/types/database";

type Props = {
  images: PortfolioImage[];
  existingCategories: string[];
};

function getPortfolioUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/portfolio/${path}`;
}

// ── Sortable image card ───────────────────────────────────────────────────────

function SortableCard({
  image,
  onDelete,
}: {
  image: PortfolioImage;
  onDelete: (img: PortfolioImage) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="rounded-lg overflow-hidden"
      css-border="true"
      // Using inline style for border to stay on design system
    >
      <div
        style={{
          border: "1px solid var(--color-border)",
          borderRadius: 8,
          background: "var(--color-bg-surface)",
          overflow: "hidden",
        }}
      >
        {/* Thumbnail */}
        <div style={{ position: "relative" }}>
          <Image
            src={getPortfolioUrl(image.url)}
            alt={image.caption ?? "Portfolio image"}
            width={400}
            height={300}
            style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }}
          />
          {/* Drag handle */}
          <button
            ref={setActivatorNodeRef}
            {...listeners}
            title="Drag to reorder"
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              padding: 4,
              background: "rgba(26,23,20,0.6)",
              border: "none",
              borderRadius: 4,
              cursor: "grab",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              lineHeight: 1,
            }}
          >
            <GripVertical size={14} />
          </button>
          {/* Delete button */}
          <button
            onClick={() => onDelete(image)}
            title="Delete image"
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              padding: 4,
              background: "rgba(26,23,20,0.6)",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              lineHeight: 1,
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Footer */}
        <div style={{ padding: "10px 12px" }}>
          {image.caption && (
            <p
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "var(--text-sm)",
                color: "var(--color-fg)",
                marginBottom: 4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {image.caption}
            </p>
          )}
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "var(--text-xs)",
              color: "var(--color-fg-muted)",
              background: "var(--color-bg-inset)",
              padding: "2px 8px",
              borderRadius: 4,
              display: "inline-block",
            }}
          >
            {image.category}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Upload modal ──────────────────────────────────────────────────────────────

function UploadModal({
  open,
  onClose,
  existingCategories,
  onUploaded,
}: {
  open: boolean;
  onClose: () => void;
  existingCategories: string[];
  onUploaded: (image: PortfolioImage) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("File must be under 10 MB.");
        return;
      }
      setError(null);
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
  }

  function handleClose() {
    formRef.current?.reset();
    setPreview(null);
    setError(null);
    onClose();
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await uploadPortfolioImage(formData);
      if (result.success && result.image) {
        toast.success("Image uploaded.");
        onUploaded(result.image);
        handleClose();
      } else {
        setError(result.error ?? "Upload failed.");
      }
    });
  }

  const inputStyle: React.CSSProperties = {
    fontFamily: "var(--font-ui)",
    fontSize: "var(--text-sm)",
    padding: "8px 12px",
    borderRadius: 4,
    border: "1px solid var(--color-border)",
    background: "var(--color-bg-inset)",
    color: "var(--color-fg)",
    width: "100%",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-ui)",
    fontSize: "var(--text-sm)",
    fontWeight: 500,
    color: "var(--color-fg-muted)",
    display: "block",
    marginBottom: 4,
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-40"
          style={{ background: "rgba(26,23,20,0.5)" }}
        />
        <Dialog.Content
          className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-4"
          style={{ outline: "none" }}
        >
          <div
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              padding: 24,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Dialog.Title
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "var(--text-xl)",
                  color: "var(--color-fg)",
                }}
              >
                Upload Image
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  style={{ color: "var(--color-fg-muted)", background: "none", border: "none", cursor: "pointer", padding: 4 }}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </Dialog.Close>
            </div>

            <form ref={formRef} onSubmit={handleSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* File input */}
                <div>
                  <label style={labelStyle}>Image *</label>
                  <input
                    name="file"
                    type="file"
                    accept="image/*"
                    required
                    onChange={handleFileChange}
                    style={{ ...inputStyle, padding: "6px 12px" }}
                  />
                  {preview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview}
                      alt="Preview"
                      style={{ marginTop: 8, width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 4 }}
                    />
                  )}
                </div>

                {/* Caption */}
                <div>
                  <label style={labelStyle} htmlFor="upload-caption">Caption</label>
                  <input
                    id="upload-caption"
                    name="caption"
                    type="text"
                    placeholder="Optional caption"
                    style={{ ...inputStyle, color: "var(--color-fg)" }}
                  />
                </div>

                {/* Category */}
                <div>
                  <label style={labelStyle} htmlFor="upload-category">Category</label>
                  <input
                    id="upload-category"
                    name="category"
                    type="text"
                    list="category-options"
                    placeholder="e.g. blackwork, realism"
                    required
                    style={inputStyle}
                  />
                  <datalist id="category-options">
                    {existingCategories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>

                {error && (
                  <p style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-sm)", color: "var(--color-rejected)" }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontWeight: 500,
                    fontSize: "var(--text-sm)",
                    padding: "10px 20px",
                    borderRadius: 4,
                    border: "none",
                    background: isPending ? "var(--color-accent-hover)" : "var(--color-accent)",
                    color: "#fff",
                    cursor: isPending ? "not-allowed" : "pointer",
                    opacity: isPending ? 0.7 : 1,
                    width: "100%",
                  }}
                >
                  {isPending ? "Uploading…" : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Delete confirmation dialog ────────────────────────────────────────────────

function DeleteDialog({
  target,
  onClose,
  onDeleted,
}: {
  target: PortfolioImage | null;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!target) return;
    startTransition(async () => {
      const result = await deletePortfolioImage(target.id, target.url);
      if (result.success) {
        toast.success("Image deleted.");
        onDeleted(target.id);
        onClose();
      } else {
        toast.error(result.error ?? "Failed to delete image.");
        onClose();
      }
    });
  }

  return (
    <Dialog.Root open={target !== null} onOpenChange={(o) => { if (!o) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-40"
          style={{ background: "rgba(26,23,20,0.5)" }}
        />
        <Dialog.Content
          className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm px-4"
          style={{ outline: "none" }}
        >
          <div
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              padding: 24,
            }}
          >
            <Dialog.Title
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "var(--text-lg)",
                color: "var(--color-fg)",
                marginBottom: 8,
              }}
            >
              Delete Image
            </Dialog.Title>
            <Dialog.Description
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "var(--text-sm)",
                color: "var(--color-fg-muted)",
                marginBottom: 24,
              }}
            >
              Delete this image? This cannot be undone.
            </Dialog.Description>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <Dialog.Close asChild>
                <button
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontWeight: 500,
                    fontSize: "var(--text-sm)",
                    padding: "8px 16px",
                    borderRadius: 4,
                    border: "1px solid var(--color-border)",
                    background: "transparent",
                    color: "var(--color-fg)",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                onClick={handleDelete}
                disabled={isPending}
                style={{
                  fontFamily: "var(--font-ui)",
                  fontWeight: 500,
                  fontSize: "var(--text-sm)",
                  padding: "8px 16px",
                  borderRadius: 4,
                  border: "none",
                  background: "var(--color-accent)",
                  color: "#fff",
                  cursor: isPending ? "not-allowed" : "pointer",
                  opacity: isPending ? 0.7 : 1,
                }}
              >
                {isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function GalleryManager({ images: initial, existingCategories }: Props) {
  const [images, setImages] = useState(initial);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PortfolioImage | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((img) => img.id === active.id);
    const newIndex = images.findIndex((img) => img.id === over.id);
    const reordered = arrayMove(images, oldIndex, newIndex);
    setImages(reordered);

    startTransition(async () => {
      const result = await updatePortfolioOrder(reordered.map((img) => img.id));
      if (!result.success) {
        toast.error("Failed to save order.");
      }
    });
  }

  function handleUploaded(image: PortfolioImage) {
    setImages((prev) => [...prev, image]);
  }

  function handleDeleted(id: string) {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "40px 24px",
        fontFamily: "var(--font-ui)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 32,
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "var(--text-3xl)",
            color: "var(--color-fg)",
            letterSpacing: "-0.02em",
          }}
        >
          Gallery
        </h1>
        <button
          onClick={() => setUploadOpen(true)}
          style={{
            fontFamily: "var(--font-ui)",
            fontWeight: 500,
            fontSize: "var(--text-sm)",
            padding: "10px 20px",
            borderRadius: 4,
            border: "none",
            background: "var(--color-accent)",
            color: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <ImagePlus size={16} />
          Upload image
        </button>
      </div>

      {/* Grid */}
      {images.length === 0 ? (
        <div
          style={{
            padding: 64,
            textAlign: "center",
            border: "2px dashed var(--color-border)",
            borderRadius: 8,
          }}
        >
          <p style={{ color: "var(--color-fg-muted)", marginBottom: 16 }}>
            No portfolio images yet.
          </p>
          <button
            onClick={() => setUploadOpen(true)}
            style={{
              fontFamily: "var(--font-ui)",
              fontWeight: 500,
              fontSize: "var(--text-sm)",
              padding: "10px 20px",
              borderRadius: 4,
              border: "1px solid var(--color-border-strong)",
              background: "transparent",
              color: "var(--color-fg)",
              cursor: "pointer",
            }}
          >
            Upload your first image
          </button>
        </div>
      ) : (
        <>
          <p
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-fg-subtle)",
              marginBottom: 16,
            }}
          >
            Drag cards to reorder
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={images.map((img) => img.id)}
              strategy={rectSortingStrategy}
            >
              <div
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                style={{ gap: 16 }}
              >
                {images.map((image) => (
                  <SortableCard
                    key={image.id}
                    image={image}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}

      {/* Modals */}
      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        existingCategories={existingCategories}
        onUploaded={handleUploaded}
      />
      <DeleteDialog
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
