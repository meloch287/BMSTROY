'use client';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Footer from '@/components/Footer';
import MobileMenu from '@/components/MobileMenu';
import Services from '@/components/Services';
import Portfolio from '@/components/Portfolio';
import Team from '@/components/Team';
import Timeline from '@/components/Timeline';
import VideoSection from '@/components/VideoSection';
import Reviews from '@/components/Reviews';
import FAQ from '@/components/FAQ';
import Promos from '@/components/Promos';
import ContactSection from '@/components/ContactSection';

// Dynamic imports for heavy components to reduce initial bundle size
const Calculator = dynamic(() => import('@/components/Calculator'), {
  loading: () => (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="h-12 w-64 bg-gray-200 rounded-lg mx-auto mb-4 animate-pulse" />
          <div className="h-6 w-48 bg-gray-200 rounded mx-auto animate-pulse" />
        </div>
        <div className="max-w-5xl mx-auto bg-white/90 rounded-3xl border border-gray-200 h-[500px] animate-pulse" />
      </div>
    </section>
  ),
  ssr: false,
});

const BookingWizard = dynamic(() => import('@/components/BookingWizard'), {
  loading: () => (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-white/80 rounded-[2.5rem] border border-gray-200 h-[500px] animate-pulse" />
      </div>
    </section>
  ),
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
      
      <Services />
      <Calculator />
      <BookingWizard />

      <Portfolio />
      <Timeline />
      <Promos />
      <VideoSection />
      <Team />
      <Reviews />
      <FAQ />
      <ContactSection />
      
      <Footer />
      <ChatWidget />
    </main>
  );
}