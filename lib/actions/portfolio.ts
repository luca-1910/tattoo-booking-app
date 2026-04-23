"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import type { PortfolioImage } from "@/types/database";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Upload image ──────────────────────────────────────────────────────────────

export async function uploadPortfolioImage(
  formData: FormData
): Promise<{ success: boolean; image?: PortfolioImage; error?: string }> {
  const file = formData.get("file");
  if (!file || !(file instanceof Blob) || file.size === 0) {
    return { success: false, error: "No file provided." };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: "File must be under 10 MB." };
  }
  if (!file.type.startsWith("image/")) {
    return { success: false, error: "Only image files are allowed." };
  }

  const caption = (formData.get("caption") as string | null)?.trim() || null;
  const category = ((formData.get("category") as string | null)?.trim()) || "other";

  // Build a unique storage path
  const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("portfolio")
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { success: false, error: `Upload failed: ${uploadError.message}` };
  }

  // Determine next sort_order
  const { data: maxRow } = await supabase
    .from("portfolio_images")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sortOrder = (maxRow?.sort_order ?? -1) + 1;

  const { data: image, error: insertError } = await supabase
    .from("portfolio_images")
    .insert({ url: path, caption, category, sort_order: sortOrder })
    .select()
    .single();

  if (insertError || !image) {
    // Clean up orphaned storage file
    await supabase.storage.from("portfolio").remove([path]);
    return { success: false, error: "Failed to save image record." };
  }

  revalidatePath("/gallery");
  revalidatePath("/admin/gallery");
  return { success: true, image };
}

// ── Delete image ──────────────────────────────────────────────────────────────

export async function deletePortfolioImage(
  id: string,
  storagePath: string
): Promise<{ success: boolean; error?: string }> {
  // Best-effort storage removal — continue even if the file is already gone
  const { error: storageError } = await supabase.storage
    .from("portfolio")
    .remove([storagePath]);

  if (storageError) {
    console.error("[portfolio] storage delete error:", storageError.message);
  }

  const { error } = await supabase
    .from("portfolio_images")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, error: "Failed to delete image record." };
  }

  revalidatePath("/gallery");
  revalidatePath("/admin/gallery");
  return { success: true };
}

// ── Reorder images ────────────────────────────────────────────────────────────

export async function updatePortfolioOrder(
  orderedIds: string[]
): Promise<{ success: boolean; error?: string }> {
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("portfolio_images").update({ sort_order: index }).eq("id", id)
    )
  );

  revalidatePath("/gallery");
  revalidatePath("/admin/gallery");
  return { success: true };
}
