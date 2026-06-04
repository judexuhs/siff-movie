import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "obs.siff.com" },
      { protocol: "https", hostname: "www.siff.com" },
      { protocol: "https", hostname: "img1.doubanio.com" },
      { protocol: "https", hostname: "img2.doubanio.com" },
      { protocol: "https", hostname: "img3.doubanio.com" },
      { protocol: "https", hostname: "img9.doubanio.com" },
    ],
  },
};

export default nextConfig;

initOpenNextCloudflareForDev();
