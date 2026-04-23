import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.freebusy",
];

// ── Encryption helpers (AES-256-CBC) ─────────────────────────────────────────

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error("ENCRYPTION_KEY is not set");
  // Accept hex-encoded 32-byte key or raw 32-char string
  const buf = Buffer.from(key, "hex");
  if (buf.length !== 32) {
    return Buffer.from(key.padEnd(32).slice(0, 32));
  }
  return buf;
}

function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  const [ivHex, encHex] = ciphertext.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encHex, "hex");
  const decipher = createDecipheriv("aes-256-cbc", key, iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

// ── OAuth client ──────────────────────────────────────────────────────────────

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!
  );
}

export function getAuthUrl(): string {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
}

export async function exchangeCodeForTokens(code: string): Promise<void> {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);

  if (!tokens.refresh_token) {
    throw new Error("No refresh token returned — ensure prompt=consent was set");
  }

  const encrypted = encrypt(tokens.refresh_token);

  const { error } = await getSupabase()
    .from("settings")
    .update({ google_refresh_token: encrypted })
    .neq("id", "00000000-0000-0000-0000-000000000000"); // update the single row

  if (error) {
    throw new Error(`Failed to save refresh token: ${error.message}`);
  }
}

export async function getAuthorizedClient() {
  const { data: settings, error } = await getSupabase()
    .from("settings")
    .select("google_refresh_token")
    .single();

  if (error || !settings?.google_refresh_token) {
    throw new Error("Google Calendar not connected — no refresh token found");
  }

  const refreshToken = decrypt(settings.google_refresh_token);
  const client = getOAuthClient();
  client.setCredentials({ refresh_token: refreshToken });
  return client;
}
