import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import "./gradients.css";
import "../styles/hover-animations.css";
import "../styles/image-transitions.css";
import "../styles/performance.css";
import ScrollProgress from "@/components/ScrollProgress";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-manrope",
  weight: ["300", "400", "600", "700", "800"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#020617",
};

export const metadata: Metadata = {
  title: {
    default: "БМСтрой | Премиальный ремонт квартир в Москве",
    template: "%s | БМСтрой",
  },
  description:
    "Ремонт квартир под ключ от 10 800 ₽/м². Дизайн-проект в подарок. Гарантия 5 лет. Более 150 реализованных проектов в Москве.",
  keywords: [
    "ремонт квартир",
    "ремонт под ключ",
    "ремонт квартир Москва",
    "дизайн интерьера",
    "капитальный ремонт",
    "отделка квартир",
    "БМСтрой",
  ],
  authors: [{ name: "БМСтрой" }],
  creator: "БМСтрой",
  publisher: "БМСтрой",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://bmstroy.ru",
    siteName: "БМСтрой",
    title: "БМСтрой | Премиальный ремонт квартир в Москве",
    description:
      "Ремонт квартир под ключ от 10 800 ₽/м². Дизайн-проект в подарок. Гарантия 5 лет.",
    images: [
      {
        url: "/logo/bmstroy-logo.png",
        width: 1200,
        height: 630,
        alt: "БМСтрой - Премиальный ремонт квартир",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "БМСтрой | Премиальный ремонт квартир в Москве",
    description:
      "Ремонт квартир под ключ от 10 800 ₽/м². Дизайн-проект в подарок.",
    images: ["/logo/bmstroy-logo.png"],
  },
  alternates: {
    canonical: "https://bmstroy.ru",
  },
  verification: {
    yandex: "yandex-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`scroll-smooth ${manrope.variable}`}>
      <head>
        {/* DNS prefetch для внешних ресурсов */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        {/* Preload критического шрифта для LCP */}
        <link
          rel="preload"
          href="/fonts/HYWenHei.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* Critical CSS для мгновенного рендеринга above-the-fold */}
        <style dangerouslySetInnerHTML={{ __html: `
          body{background-color:#E8E8E0;margin:0}
          .bg-plaster{background-color:#E8E8E0}
          .text-text-primary{color:#2C2C2C}
          .text-brand-green{color:#4A7C23}
          .btn-gradient{background-image:linear-gradient(135deg,#4A7C23 0%,#5A8C33 100%);color:#fff}
        `}} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "@id": "https://bmstroy.ru/#organization",
              name: "БМСтрой",
              description: "Премиальный ремонт квартир в Москве под ключ. Дизайн-проект, капитальный и косметический ремонт.",
              url: "https://bmstroy.ru",
              logo: "https://bmstroy.ru/logo/bmstroy-logo.png",
              image: "https://bmstroy.ru/logo/bmstroy-logo.png",
              telephone: "+7-888-888-88-88",
              email: "info@bmstroy.ru",
              priceRange: "от 10800 ₽/м²",
              currenciesAccepted: "RUB",
              paymentAccepted: "Cash, Credit Card, Bank Transfer",
              address: {
                "@type": "PostalAddress",
                streetAddress: "2й Силикатный проезд, дом 14",
                addressLocality: "Москва",
                addressCountry: "RU",
                postalCode: "123456"
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: "55.7558",
                longitude: "37.6173"
              },
              openingHoursSpecification: [
                {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                  opens: "09:00",
                  closes: "20:00"
                },
                {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: ["Saturday"],
                  opens: "10:00",
                  closes: "18:00"
                }
              ],
              sameAs: [
                "https://t.me/bmstroy",
                "https://wa.me/78888888888"
              ],
              hasOfferCatalog: {
                "@type": "OfferCatalog",
                name: "Услуги ремонта",
                itemListElement: [
                  {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: "Ремонт квартир под ключ",
                      description: "Полный цикл работ от демонтажа до финишной отделки"
                    }
                  },
                  {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: "Дизайн-проект",
                      description: "3D-визуализация, планировочные решения, подбор материалов"
                    }
                  },
                  {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: "Капитальный ремонт",
                      description: "Полная перепланировка, замена коммуникаций"
                    }
                  }
                ]
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.9",
                reviewCount: "150",
                bestRating: "5",
                worstRating: "1"
              }
            })
          }}
        />
      </head>
      <body className={`antialiased ${manrope.className}`}>
        <ScrollProgress />
        
        <div className="mesh-bg" />
        
        <div className="relative z-10 min-h-screen flex flex-col">
            {children}
        </div>
      </body>
    </html>
  );
}