"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function PublicNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: 56,
          background: "var(--color-bg)",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 16,
              color: "var(--color-fg)",
              textDecoration: "none",
              letterSpacing: "0.05em",
            }}
          >
            MISSMAY
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center" style={{ gap: 32 }}>
            <Link
              href="/gallery"
              style={{
                fontFamily: "var(--font-ui)",
                fontWeight: 500,
                fontSize: 14,
                color: "var(--color-fg-muted)",
                textDecoration: "none",
              }}
            >
              Gallery
            </Link>
            <Link
              href="/booking"
              style={{
                fontFamily: "var(--font-ui)",
                fontWeight: 500,
                fontSize: 14,
                padding: "10px 20px",
                borderRadius: 4,
                background: "var(--color-accent)",
                color: "#fff",
                textDecoration: "none",
              }}
            >
              Book now
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className="flex md:hidden"
            aria-label="Toggle menu"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-fg)",
              padding: 8,
              display: "flex",
              alignItems: "center",
            }}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {open && (
        <div
          className="md:hidden"
          style={{
            position: "fixed",
            top: 56,
            left: 0,
            right: 0,
            zIndex: 99,
            background: "var(--color-bg)",
            borderBottom: "1px solid var(--color-border)",
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <Link
            href="/gallery"
            onClick={() => setOpen(false)}
            style={{
              fontFamily: "var(--font-ui)",
              fontWeight: 500,
              fontSize: 16,
              color: "var(--color-fg-muted)",
              textDecoration: "none",
            }}
          >
            Gallery
          </Link>
          <Link
            href="/booking"
            onClick={() => setOpen(false)}
            style={{
              fontFamily: "var(--font-ui)",
              fontWeight: 500,
              fontSize: 14,
              padding: "12px 20px",
              borderRadius: 4,
              background: "var(--color-accent)",
              color: "#fff",
              textDecoration: "none",
              textAlign: "center",
            }}
          >
            Book now
          </Link>
        </div>
      )}
    </>
  );
}
