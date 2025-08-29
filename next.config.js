/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // If you need to serve images from an external domain (like Supabase storage)
  // add the hostname here.
  // Example:
  // images: {
  //   remotePatterns: [
  //     {
  //       protocol: 'https',
  //       hostname: 'your-supabase-project-id.supabase.co',
  //       port: '',
  //       pathname: '/storage/v1/object/public/**',
  //     },
  //   ],
  // },
};

module.exports = nextConfig;
