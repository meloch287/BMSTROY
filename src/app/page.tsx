'use client';
import dynamic from 'next/dynamic';
import { Suspense, lazy, useEffect, useState, useRef, ReactNode } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';

// Skeleton для секций
const SectionSkeleton = ({ height = '400px' }: { height?: string }) => (
  <section className="py-16 md:py-24">
    <div className="container mx-auto px-4">
      <div className="h-8 w-48 bg-gray-200 rounded-lg mb-8 animate-pulse" />
      <div className="rounded-3xl bg-gray-200 animate-pulse" style={{ height }} />
    </div>
  </section>
);

// Lazy Section - загружает компонент только когда он виден
const LazySection = ({ children, fallback }: { children: ReactNode, fallback: ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // Загружаем за 200px до появления
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref}>{isVisible ? children : fallback}</div>;
};

// Critical path - загружаем сразу только Header и Hero
// Остальное - lazy load для улучшения TBT и TTI

const MobileMenu = dynamic(() => import('@/components/MobileMenu'), { ssr: false });
const Footer = dynamic(() => import('@/components/Footer'), { ssr: false });

// Below-the-fold компоненты - lazy load
const Services = dynamic(() => import('@/components/Services'), {
  loading: () => <SectionSkeleton height="500px" />,
  ssr: false,
});

const Portfolio = dynamic(() => import('@/components/Portfolio'), {
  loading: () => <SectionSkeleton height="600px" />,
  ssr: false,
});

const Calculator = dynamic(() => import('@/components/Calculator'), {
  loading: () => <SectionSkeleton height="500px" />,
  ssr: false,
});

const BookingWizard = dynamic(() => import('@/components/BookingWizard'), {
  loading: () => <SectionSkeleton height="500px" />,
  ssr: false,
});

const Timeline = dynamic(() => import('@/components/Timeline'), {
  loading: () => <SectionSkeleton height="400px" />,
  ssr: false,
});

const Promos = dynamic(() => import('@/components/Promos'), {
  loading: () => <SectionSkeleton height="300px" />,
  ssr: false,
});

const VideoSection = dynamic(() => import('@/components/VideoSection'), {
  loading: () => <SectionSkeleton height="400px" />,
  ssr: false,
});

const Team = dynamic(() => import('@/components/Team'), {
  loading: () => <SectionSkeleton height="400px" />,
  ssr: false,
});

const Reviews = dynamic(() => import('@/components/Reviews'), {
  loading: () => <SectionSkeleton height="400px" />,
  ssr: false,
});

const FAQ = dynamic(() => import('@/components/FAQ'), {
  loading: () => <SectionSkeleton height="400px" />,
  ssr: false,
});

const ContactSection = dynamic(() => import('@/components/ContactSection'), {
  loading: () => <SectionSkeleton height="400px" />,
  ssr: false,
});

const ChatWidget = dynamic(() => import('@/components/ChatWidget'), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col pb-20 md:pb-0">
      <Header />
      <MobileMenu />
      <Hero />
      
      {/* Above-the-fold - загружаем сразу */}
      <Services />
      <Calculator />
      
      {/* Below-the-fold - lazy load с IntersectionObserver */}
      <LazySection fallback={<SectionSkeleton height="500px" />}>
        <BookingWizard />
      </LazySection>

      <LazySection fallback={<SectionSkeleton height="600px" />}>
        <Portfolio />
      </LazySection>
      
      <LazySection fallback={<SectionSkeleton height="400px" />}>
        <Timeline />
      </LazySection>
      
      <LazySection fallback={<SectionSkeleton height="300px" />}>
        <Promos />
      </LazySection>
      
      <LazySection fallback={<SectionSkeleton height="400px" />}>
        <VideoSection />
      </LazySection>
      
      <LazySection fallback={<SectionSkeleton height="400px" />}>
        <Team />
      </LazySection>
      
      <LazySection fallback={<SectionSkeleton height="400px" />}>
        <Reviews />
      </LazySection>
      
      <LazySection fallback={<SectionSkeleton height="400px" />}>
        <FAQ />
      </LazySection>
      
      <LazySection fallback={<SectionSkeleton height="400px" />}>
        <ContactSection />
      </LazySection>
      
      <Footer />
      <ChatWidget />
    </main>
  );
}