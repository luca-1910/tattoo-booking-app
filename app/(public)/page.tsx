export const revalidate = 60;

import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import type { PortfolioImage } from "@/types/database";

function getPortfolioUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/portfolio/${path}`;
}

async function getRecentWork(): Promise<PortfolioImage[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const supabase = createClient(url, key);
  const { data } = await supabase
    .from("portfolio_images")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(6);
  return data ?? [];
}

const INSTAGRAM_URL =
  process.env.NEXT_PUBLIC_INSTAGRAM_URL ??
  "https://www.instagram.com/missmay.tattoos";

export default async function LandingPage() {
  const recentWork = await getRecentWork();

  return (
    <main>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section
        style={{
          minHeight: "100vh",
          background: "var(--color-bg)",
          display: "flex",
          alignItems: "center",
          padding: "48px 24px",
        }}
      >
        <div
          className="grid grid-cols-1 md:grid-cols-[3fr_2fr] items-center gap-12 w-full"
          style={{ maxWidth: 1200, margin: "0 auto" }}
        >
          {/* Left: text */}
          <div>
            <p
              style={{
                fontFamily: "var(--font-ui)",
                fontWeight: 500,
                fontSize: 11,
                color: "var(--color-fg-muted)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: 24,
              }}
            >
              Tattoo Artist · Adelaide
            </p>

            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 900,
                fontSize: "clamp(64px,10vw,120px)",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                color: "var(--color-fg)",
                marginBottom: 28,
              }}
            >
              PHOEBE
              <br />
              <span style={{ color: "var(--color-accent)" }}>MISSMAY</span>
            </h1>

            <p
              style={{
                fontFamily: "var(--font-ui)",
                fontWeight: 400,
                fontSize: 18,
                color: "var(--color-fg-muted)",
                maxWidth: 480,
                lineHeight: 1.6,
                marginBottom: 40,
              }}
            >
              Illustrative blackwork and fine line tattoos.
              <br />
              Based in Hyde Park, Adelaide.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/booking"
                className="text-center sm:text-left"
                style={{
                  fontFamily: "var(--font-ui)",
                  fontWeight: 500,
                  fontSize: 14,
                  padding: "12px 24px",
                  borderRadius: 4,
                  background: "var(--color-accent)",
                  color: "#fff",
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                Book an appointment
              </Link>
              <Link
                href="/gallery"
                className="text-center sm:text-left"
                style={{
                  fontFamily: "var(--font-ui)",
                  fontWeight: 500,
                  fontSize: 14,
                  padding: "12px 24px",
                  borderRadius: 4,
                  border: "1px solid var(--color-fg)",
                  color: "var(--color-fg)",
                  textDecoration: "none",
                  display: "inline-block",
                  background: "transparent",
                }}
              >
                View my work
              </Link>
            </div>
          </div>

          {/* Right: hero image placeholder */}
          <div
            style={{
              aspectRatio: "3/4",
              border: "2px dashed var(--color-border)",
              borderRadius: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: 14,
                color: "var(--color-fg-subtle)",
              }}
            >
              Add hero image
            </span>
          </div>
        </div>
      </section>

      {/* ── WORK PREVIEW ─────────────────────────────────────── */}
      <section
        style={{
          padding: "80px 24px",
          background: "var(--color-bg)",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 36,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              color: "var(--color-fg)",
              marginBottom: 32,
            }}
          >
            Recent work
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
            {recentWork.length > 0
              ? recentWork.map((img) => (
                  <div
                    key={img.id}
                    className="group relative overflow-hidden"
                    style={{ aspectRatio: "1" }}
                  >
                    <Image
                      src={getPortfolioUrl(img.url)}
                      alt={img.caption ?? "Portfolio image"}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      style={{ background: "rgba(26,23,20,0.65)" }}
                    >
                      <span
                        style={{
                          color: "#fff",
                          fontSize: 32,
                          fontWeight: 300,
                          lineHeight: 1,
                        }}
                      >
                        +
                      </span>
                    </div>
                  </div>
                ))
              : Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      aspectRatio: "1",
                      background: "var(--color-bg-surface)",
                      border: "1px dashed var(--color-border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-ui)",
                        fontSize: 12,
                        color: "var(--color-fg-subtle)",
                      }}
                    >
                      Portfolio image
                    </span>
                  </div>
                ))}
          </div>

          <div style={{ marginTop: 28, textAlign: "right" }}>
            <Link
              href="/gallery"
              style={{
                fontFamily: "var(--font-ui)",
                fontWeight: 500,
                fontSize: 14,
                color: "var(--color-fg)",
                textDecoration: "none",
              }}
            >
              See all work →
            </Link>
          </div>
        </div>
      </section>

      {/* ── STYLE ────────────────────────────────────────────── */}
      <section
        style={{
          padding: "80px 24px",
          background: "var(--color-fg)",
        }}
      >
        <div
          className="grid grid-cols-1 md:grid-cols-2 items-center gap-16"
          style={{ maxWidth: 1200, margin: "0 auto" }}
        >
          <div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 900,
                fontSize: "clamp(48px,6vw,80px)",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                color: "#fff",
              }}
            >
              FINE LINE.
              <br />
              BLACKWORK.
            </h2>
          </div>

          <div>
            <p
              style={{
                fontFamily: "var(--font-ui)",
                fontWeight: 400,
                fontSize: 16,
                lineHeight: 1.6,
                color: "rgba(255,255,255,0.7)",
                marginBottom: 32,
              }}
            >
              Phoebe specialises in illustrative and fine line work, drawing
              from classical mythology, the natural world, and the quietly
              strange. Every piece is custom.
            </p>
            <Link
              href="/booking"
              className="btn-outline-white"
              style={{
                fontFamily: "var(--font-ui)",
                fontWeight: 500,
                fontSize: 14,
                padding: "12px 24px",
                borderRadius: 4,
                border: "1px solid rgba(255,255,255,0.4)",
                color: "#fff",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Book a consultation
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section
        style={{
          padding: "80px 24px",
          background: "var(--color-bg)",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 36,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              color: "var(--color-fg)",
              marginBottom: 48,
            }}
          >
            How to book
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                num: "01",
                title: "DM on Instagram",
                body: "Discuss your idea, placement, and price with Phoebe before submitting a booking.",
              },
              {
                num: "02",
                title: "Submit your booking",
                body: "Complete the booking form and upload your payment proof to secure your slot.",
              },
              {
                num: "03",
                title: "See you in the chair",
                body: "Phoebe reviews your booking and confirms via email.",
              },
            ].map((step) => (
              <div key={step.num}>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 900,
                    fontSize: 48,
                    color: "var(--color-accent)",
                    lineHeight: 1,
                    marginBottom: 16,
                  }}
                >
                  {step.num}
                </p>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: 18,
                    color: "var(--color-fg)",
                    marginBottom: 12,
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontWeight: 400,
                    fontSize: 14,
                    color: "var(--color-fg-muted)",
                    lineHeight: 1.6,
                  }}
                >
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer
        style={{
          background: "var(--color-fg)",
          padding: "48px 24px",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12" style={{ marginBottom: 40 }}>
            {/* Brand */}
            <div>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 18,
                  color: "#fff",
                  letterSpacing: "0.05em",
                  marginBottom: 12,
                }}
              >
                MISSMAY.TATTOOS
              </p>
              <p
                style={{
                  fontFamily: "var(--font-ui)",
                  fontWeight: 400,
                  fontSize: 14,
                  color: "rgba(255,255,255,0.5)",
                  lineHeight: 1.6,
                }}
              >
                270 Unley Road, Hyde Park
                <br />
                Adelaide SA 5061
              </p>
            </div>

            {/* Links */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { label: "Home", href: "/" },
                { label: "Gallery", href: "/gallery" },
                { label: "Book", href: "/booking" },
                { label: "Instagram", href: INSTAGRAM_URL },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontWeight: 400,
                    fontSize: 14,
                    color: "rgba(255,255,255,0.55)",
                    textDecoration: "none",
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* CTA */}
            <div>
              <p
                style={{
                  fontFamily: "var(--font-ui)",
                  fontWeight: 500,
                  fontSize: 14,
                  color: "rgba(255,255,255,0.75)",
                  marginBottom: 20,
                }}
              >
                Books open. DM to enquire.
              </p>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "var(--font-ui)",
                  fontWeight: 500,
                  fontSize: 14,
                  padding: "10px 20px",
                  borderRadius: 4,
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "#fff",
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                @missmay.tattoos
              </a>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.1)",
              paddingTop: 24,
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: 12,
                color: "rgba(255,255,255,0.3)",
              }}
            >
              © 2025 Phoebe — missmay.tattoos
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
