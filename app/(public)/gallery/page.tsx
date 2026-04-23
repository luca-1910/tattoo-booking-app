export const revalidate = 60;

import { createClient } from "@supabase/supabase-js";
import type { PortfolioImage } from "@/types/database";
import GalleryClient from "./GalleryClient";

export default async function GalleryPage() {
  let images: PortfolioImage[] = [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data } = await supabase
      .from("portfolio_images")
      .select("*")
      .order("sort_order", { ascending: true });
    images = data ?? [];
  }

  return <GalleryClient images={images} />;
}
