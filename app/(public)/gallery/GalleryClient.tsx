"use client";

import { useState } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { PortfolioImage } from "@/types/database";

type Props = {
  images: PortfolioImage[];
};

function getPortfolioUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/portfolio/${path}`;
}

function getUniqueCategories(images: PortfolioImage[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const img of images) {
    if (!seen.has(img.category)) {
      seen.add(img.category);
      out.push(img.category);
    }
  }
  return out;
}

export default function GalleryClient({ images }: Props) {
  const [selected, setSelected] = useState<string>("all");
  const [lightbox, setLightbox] = useState<PortfolioImage | null>(null);

  const categories = getUniqueCategories(images);
  const filtered =
    selected === "all" ? images : images.filter((img) => img.category === selected);

  return (
    <main
      style={{
        background: "var(--color-bg)",
        minHeight: "100vh",
        padding: "48px 24px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 900,
            fontSize: "var(--text-5xl)",
            color: "var(--color-fg)",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
            marginBottom: 40,
          }}
        >
          Portfolio
        </h1>

        {/* Filter pills */}
        {categories.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 32,
            }}
          >
            {["all", ...categories].map((cat) => {
              const isActive = selected === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelected(cat)}
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontWeight: 500,
                    fontSize: "var(--text-sm)",
                    padding: "6px 16px",
                    borderRadius: 4,
                    border: "none",
                    cursor: "pointer",
                    background: isActive
                      ? "var(--color-accent)"
                      : "var(--color-bg-surface)",
                    color: isActive ? "#fff" : "var(--color-fg-muted)",
                    transition: "background 0.15s, color 0.15s",
                  }}
                >
                  {cat === "all" ? "All" : cat}
                </button>
              );
            })}
          </div>
        )}

        {/* Masonry grid */}
        {filtered.length === 0 ? (
          <p
            style={{
              fontFamily: "var(--font-ui)",
              color: "var(--color-fg-muted)",
              fontSize: "var(--text-base)",
            }}
          >
            No images yet.
          </p>
        ) : (
          <div
            className="columns-2 md:columns-3 lg:columns-4"
            style={{ columnGap: 16 }}
          >
            {filtered.map((img) => (
              <div
                key={img.id}
                className="break-inside-avoid"
                style={{ marginBottom: 16 }}
              >
                <button
                  onClick={() => setLightbox(img)}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: 0,
                    border: "none",
                    background: "none",
                    cursor: "zoom-in",
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: 4,
                  }}
                  aria-label={img.caption ?? "Portfolio image"}
                  className="group"
                >
                  <Image
                    src={getPortfolioUrl(img.url)}
                    alt={img.caption ?? "Portfolio image"}
                    width={800}
                    height={600}
                    style={{ width: "100%", height: "auto", display: "block" }}
                  />
                  {/* Hover overlay */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end"
                    style={{
                      background: "rgba(26,23,20,0.65)",
                      padding: 12,
                    }}
                  >
                    {img.caption && (
                      <p
                        style={{
                          fontFamily: "var(--font-ui)",
                          fontSize: "var(--text-sm)",
                          color: "#fff",
                          textAlign: "left",
                        }}
                      >
                        {img.caption}
                      </p>
                    )}
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Dialog.Root
        open={lightbox !== null}
        onOpenChange={(open) => { if (!open) setLightbox(null); }}
      >
        <Dialog.Portal>
          <Dialog.Overlay
            className="fixed inset-0 z-50"
            style={{ background: "rgba(26,23,20,0.9)" }}
          />
          <Dialog.Content
            className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl px-4 outline-none"
          >
            {lightbox && (
              <div>
                <Image
                  src={getPortfolioUrl(lightbox.url)}
                  alt={lightbox.caption ?? "Portfolio image"}
                  width={1200}
                  height={900}
                  style={{
                    width: "100%",
                    height: "auto",
                    maxHeight: "80vh",
                    objectFit: "contain",
                    display: "block",
                    borderRadius: 4,
                  }}
                />
                {(lightbox.caption || lightbox.category) && (
                  <div
                    style={{
                      marginTop: 16,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    {lightbox.caption && (
                      <p
                        style={{
                          fontFamily: "var(--font-ui)",
                          fontSize: "var(--text-base)",
                          color: "#fff",
                        }}
                      >
                        {lightbox.caption}
                      </p>
                    )}
                    <span
                      style={{
                        fontFamily: "var(--font-ui)",
                        fontSize: "var(--text-xs)",
                        color: "rgba(255,255,255,0.6)",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {lightbox.category}
                    </span>
                  </div>
                )}
              </div>
            )}
            <Dialog.Close asChild>
              <button
                style={{
                  position: "fixed",
                  top: 20,
                  right: 20,
                  padding: 8,
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                aria-label="Close lightbox"
              >
                <X size={20} />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </main>
  );
}
