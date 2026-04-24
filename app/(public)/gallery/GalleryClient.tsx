"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const categories = getUniqueCategories(images);
  const filtered =
    selected === "all" ? images : images.filter((img) => img.category === selected);
  const filteredLen = filtered.length;

  const lightboxImage =
    lightboxIndex !== null ? (filtered[lightboxIndex] ?? null) : null;

  function openLightbox(index: number) {
    setLightboxIndex(index);
  }

  function closeLightbox() {
    setLightboxIndex(null);
  }

  function handleFilterChange(cat: string) {
    setSelected(cat);
    setLightboxIndex(null);
  }

  function prev() {
    setLightboxIndex((i) =>
      i === null ? null : (i - 1 + filteredLen) % filteredLen
    );
  }

  function next() {
    setLightboxIndex((i) =>
      i === null ? null : (i + 1) % filteredLen
    );
  }

  // Keyboard navigation inside the lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setLightboxIndex((i) =>
          i === null ? null : (i - 1 + filteredLen) % filteredLen
        );
      } else if (e.key === "ArrowRight") {
        setLightboxIndex((i) =>
          i === null ? null : (i + 1) % filteredLen
        );
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIndex, filteredLen]);

  return (
    <main style={{ background: "var(--color-bg)", minHeight: "100vh" }}>

      {/* ── DARK HEADER ── */}
      <div style={{ background: "var(--color-fg)" }}>
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "64px clamp(24px, 5vw, 48px)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontWeight: 500,
              fontSize: 11,
              color: "rgba(255,255,255,0.5)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: 20,
            }}
          >
            Portfolio
          </p>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 900,
              fontSize: "clamp(40px, 8vw, 64px)",
              color: "#fff",
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              marginBottom: 20,
            }}
          >
            The work.
          </h1>
          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontWeight: 400,
              fontSize: 18,
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.6,
              maxWidth: 480,
            }}
          >
            Illustrative blackwork and fine line tattoos by Phoebe, Adelaide.
          </p>
        </div>
      </div>

      {/* ── FILTER PILLS ── */}
      {categories.length > 0 && (
        <div
          style={{
            background: "var(--color-bg)",
            padding: "24px clamp(24px, 5vw, 48px)",
          }}
        >
          <div
            className="[&::-webkit-scrollbar]:hidden"
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              scrollbarWidth: "none",
            }}
          >
            {["all", ...categories].map((cat) => {
              const isActive = selected === cat;
              return (
                <button
                  key={cat}
                  onClick={() => handleFilterChange(cat)}
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontWeight: 500,
                    fontSize: 13,
                    padding: "7px 16px",
                    borderRadius: 4,
                    flexShrink: 0,
                    cursor: "pointer",
                    border: isActive
                      ? "1px solid transparent"
                      : "1px solid var(--color-border)",
                    background: isActive
                      ? "var(--color-fg)"
                      : "var(--color-bg-surface)",
                    color: isActive ? "#fff" : "var(--color-fg)",
                    transition: "background 0.15s, color 0.15s, border-color 0.15s",
                  }}
                >
                  {cat === "all" ? "All" : cat}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MASONRY GRID ── */}
      {filtered.length === 0 ? (
        <div style={{ padding: "80px 24px", textAlign: "center" }}>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 32,
              letterSpacing: "-0.02em",
              color: "var(--color-fg-muted)",
            }}
          >
            Work coming soon.
          </p>
        </div>
      ) : (
        <div
          className="columns-2 md:columns-3 lg:columns-4"
          style={{ columnGap: 0 }}
        >
          {filtered.map((img, index) => (
            <div key={img.id} className="break-inside-avoid">
              <button
                onClick={() => openLightbox(index)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: 0,
                  border: "none",
                  background: "none",
                  cursor: "zoom-in",
                  position: "relative",
                  overflow: "hidden",
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
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end"
                  style={{ background: "rgba(0,0,0,0.5)", padding: 12 }}
                >
                  {img.caption && (
                    <p
                      style={{
                        fontFamily: "var(--font-ui)",
                        fontWeight: 400,
                        fontSize: 14,
                        color: "#fff",
                        marginBottom: 6,
                      }}
                    >
                      {img.caption}
                    </p>
                  )}
                  <span
                    style={{
                      fontFamily: "var(--font-ui)",
                      fontWeight: 500,
                      fontSize: 11,
                      color: "rgba(255,255,255,0.75)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      display: "inline-block",
                      background: "rgba(255,255,255,0.15)",
                      padding: "2px 8px",
                      borderRadius: 2,
                      alignSelf: "flex-start",
                    }}
                  >
                    {img.category}
                  </span>
                </div>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── CTA SECTION ── */}
      <div
        style={{
          background: "var(--color-accent)",
          padding: "80px 24px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 900,
              fontSize: "clamp(32px, 6vw, 48px)",
              color: "#fff",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              marginBottom: 16,
            }}
          >
            Ready to get tattooed?
          </h2>
          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontWeight: 400,
              fontSize: 18,
              color: "rgba(255,255,255,0.8)",
              lineHeight: 1.6,
              marginBottom: 32,
            }}
          >
            Book your appointment with Phoebe.
          </p>
          <Link
            href="/booking"
            style={{
              fontFamily: "var(--font-ui)",
              fontWeight: 500,
              fontSize: 14,
              padding: "12px 28px",
              borderRadius: 4,
              background: "#fff",
              color: "var(--color-accent)",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Book now
          </Link>
        </div>
      </div>

      {/* ── LIGHTBOX ── */}
      <Dialog.Root
        open={lightboxIndex !== null}
        onOpenChange={(open) => {
          if (!open) closeLightbox();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay
            className="fixed inset-0 z-50"
            style={{ background: "#000" }}
          />
          <Dialog.Content
            className="fixed inset-0 z-50 flex flex-col outline-none"
            style={{ background: "#000" }}
          >
            {lightboxImage && (
              <>
                {/* Image area with nav arrows */}
                <div
                  className="flex-1 flex items-center justify-center relative"
                  style={{ padding: "24px 72px", minHeight: 0 }}
                >
                  <Image
                    src={getPortfolioUrl(lightboxImage.url)}
                    alt={lightboxImage.caption ?? "Portfolio image"}
                    width={1400}
                    height={1050}
                    style={{
                      maxHeight: "90vh",
                      width: "auto",
                      maxWidth: "100%",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />

                  {filteredLen > 1 && (
                    <>
                      <button
                        onClick={prev}
                        aria-label="Previous image"
                        style={{
                          position: "absolute",
                          left: 16,
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "rgba(255,255,255,0.1)",
                          border: "none",
                          borderRadius: 4,
                          padding: 10,
                          cursor: "pointer",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <ChevronLeft size={24} />
                      </button>

                      <button
                        onClick={next}
                        aria-label="Next image"
                        style={{
                          position: "absolute",
                          right: 16,
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "rgba(255,255,255,0.1)",
                          border: "none",
                          borderRadius: 4,
                          padding: 10,
                          cursor: "pointer",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <ChevronRight size={24} />
                      </button>
                    </>
                  )}
                </div>

                {/* Bottom bar */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px 24px",
                    borderTop: "1px solid rgba(255,255,255,0.1)",
                    flexShrink: 0,
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--font-ui)",
                      fontWeight: 400,
                      fontSize: 14,
                      color: "#fff",
                      flex: 1,
                    }}
                  >
                    {lightboxImage.caption ?? ""}
                  </p>
                  <span
                    style={{
                      fontFamily: "var(--font-ui)",
                      fontWeight: 500,
                      fontSize: 11,
                      color: "rgba(255,255,255,0.55)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      flexShrink: 0,
                      marginLeft: 16,
                    }}
                  >
                    {lightboxImage.category}
                  </span>
                </div>
              </>
            )}

            {/* Close button */}
            <Dialog.Close asChild>
              <button
                aria-label="Close lightbox"
                style={{
                  position: "fixed",
                  top: 16,
                  right: 16,
                  padding: 10,
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10,
                }}
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
