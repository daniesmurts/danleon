import type { Metadata } from "next";
// Remove next/font/google due to fetch errors in this environment
// We will use standard sans-serif fallback for body text.

import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";

export const metadata: Metadata = {
  title: {
    default: "ДАНЛЕОН — Премиальный угандийский кофе",
    template: "%s | ДАНЛЕОН",
  },
  description:
    "Откройте для себя уникальные сорта специальти кофе из Уганды. Прямые поставки с плантаций Маунт Элгон. Натуральная и мытая обработка, свежая обжарка.",
  keywords: [
    "кофе",
    "угандийский кофе",
    "специальти кофе",
    "specialty coffee",
    "Уганда",
    "свежая обжарка",
    "купить кофе",
  ],
  openGraph: {
    title: "ДАНЛЕОН — Премиальный угандийский кофе",
    description:
      "Уникальные сорта специальти кофе из Уганды. Свежая обжарка, прямые поставки.",
    type: "website",
    locale: "ru_RU",
    siteName: "ДАНЛЕОН",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`h-full`}>
      <body className="min-h-full flex flex-col font-body text-espresso bg-white antialiased">
        <CartProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
