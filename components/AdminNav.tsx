import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import LogoutButton from "./LogoutButton";

async function getStudioName(): Promise<string> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data } = await supabase.from("settings").select("studio_name").single();
  return data?.studio_name || "Admin";
}

export default async function AdminNav({ active }: { active?: string }) {
  const studioName = await getStudioName();

  const links = [
    { href: "/admin/slots", label: "Slots" },
    { href: "/admin/gallery", label: "Gallery" },
    { href: "/admin/settings", label: "Settings" },
  ];

  return (
    <nav
      style={{
        background: "var(--color-fg)",
        height: 56,
        display: "flex",
        alignItems: "center",
        paddingLeft: 24,
        paddingRight: 24,
        gap: 24,
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Studio name */}
      <Link
        href="/admin"
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: "var(--text-base)",
          color: "#fff",
          textDecoration: "none",
          marginRight: "auto",
          whiteSpace: "nowrap",
        }}
      >
        {studioName}
      </Link>

      {/* Nav links */}
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          style={{
            fontFamily: "var(--font-ui)",
            fontWeight: 500,
            fontSize: "var(--text-sm)",
            color: active === label.toLowerCase() ? "var(--color-accent)" : "rgba(255,255,255,0.6)",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </Link>
      ))}

      <LogoutButton />
    </nav>
  );
}
