import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Baransel'in çaldığı şarkılar",
  description:
    "Baransel’in Spotify ve Deezer’da dinlediği şarkıları anlık olarak takip edin. Şarkı adı, sanatçı, albüm görseli, canlı şarkı sözleri ve Deezer’dan müzik önizlemesiyle zenginleştirilmiş modern müzik deneyimi. Tablet, bilgisayar ve TV’de şarkı sözlerini canlı takip edin, mobilde hızlı ve sade arayüzle müziğin keyfini çıkarın. Müzikseverler için en iyi canlı müzik takip platformu!",
  keywords: [
    "Spotify Now Playing",
    "Deezer Now Playing",
    "canlı şarkı sözleri",
    "müzik önizleme",
    "Baransel",
    "müzik takip",
    "albüm görseli",
    "canlı müzik",
    "şarkı takibi",
    "Baransel İnal",
    "müzik uygulaması",
  ],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <footer className="fixed bottom-0 w-full py-4 text-center text-sm text-gray-500">
          Powered by Spotify and Deezer. Crafted By{" "}
          <a
            href="https://baransel.site"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex relative hover:text-white transition-colors duration-200"
          >
            <span className="relative z-10">Baransel</span>
            <div className="absolute inset-0 h-full w-full bg-linear-to-r from-purple-400 via-pink-500 to-red-500 opacity-75 blur-lg transition-all duration-500 animate-aurora"></div>
          </a>
          .
        </footer>
      </body>
    </html>
  );
}
