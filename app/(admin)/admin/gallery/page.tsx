export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import AdminNav from "@/components/AdminNav";
import GalleryManager from "./GalleryManager";
import type { PortfolioImage } from "@/types/database";

export default async function AdminGalleryPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await supabase
    .from("portfolio_images")
    .select("*")
    .order("sort_order", { ascending: true });

  const images: PortfolioImage[] = data ?? [];

  // Collect existing categories for the upload form datalist
  const categories = Array.from(new Set(images.map((img) => img.category)));

  return (
    <>
      <AdminNav active="gallery" />
      <GalleryManager images={images} existingCategories={categories} />
    </>
  );
}
