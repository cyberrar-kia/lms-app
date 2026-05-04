/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "uivqwzohblmsdiqmfgvr.supabase.co",
      },
    ],
  },
};

export default nextConfig;
