/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        // Covers public bucket paths (/storage/v1/object/public/...)
        // and signed private URLs (/storage/v1/object/sign/...)
        pathname: "/storage/v1/object/**",
      },
    ],
  },
};

export default nextConfig;
