import type { Metadata } from "next";
import { Syne, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-dm-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://upload-smith.js.org/"),
  title: "Upload Smith — Express.js File Upload Middleware",
  description: "Upload Smith is a powerful Express.js file upload middleware built on Multer. Supports AWS S3, Azure, GCS, Cloudinary, FTP, SFTP, image compression, and TypeScript.",
  keywords: ["express file upload", "multer middleware", "upload to s3", "azure blob upload", "google cloud storage upload", "cloudinary upload", "image compression node", "file validation middleware", "typescript upload middleware", "nodejs file uploader", "ftp upload", "sftp upload", "upload-smith"],
  authors: [{ name: "Manan Patel" }],
  openGraph: {
    title: "Upload Smith — Express.js File Upload Middleware",
    description: "One config object. AWS S3, Azure, GCS, Cloudinary, FTP, SFTP. TypeScript ready. Zero boilerplate.",
    url: "https://upload-smith.js.org/",
    siteName: "Upload Smith",
    images: [
      {
        url: "/og-image.png",
        width: 840,
        height: 840,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Upload Smith — Express.js File Upload Middleware",
    description: "One config object. AWS S3, Azure, GCS, Cloudinary, FTP, SFTP. TypeScript ready.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "https://res.cloudinary.com/daudl2cc3/image/upload/v1773833984/Brand_symbol_ocyzo3.png",
    shortcut: "https://res.cloudinary.com/daudl2cc3/image/upload/v1773833984/Brand_symbol_ocyzo3.png",
    apple: "https://res.cloudinary.com/daudl2cc3/image/upload/v1773833984/Brand_symbol_ocyzo3.png",
    other: [
      {
        rel: "mask-icon",
        url: "https://res.cloudinary.com/daudl2cc3/image/upload/v1773833984/Brand_symbol_ocyzo3.png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <div className="noise-overlay" />
        {children}
      </body>
    </html>
  );
}
