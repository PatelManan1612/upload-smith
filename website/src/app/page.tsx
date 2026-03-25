import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Providers from "@/components/Providers";
import Quickstart from "@/components/Quickstart";
import StorageModes from "@/components/StorageModes";
import Compare from "@/components/Compare";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <div className="noise-overlay" />
      
      <Header />
      <Hero />
      
      <hr className="divider text-accent-dim" />
      <Features />
      
      <hr className="divider text-accent-dim" />
      <Providers />
      
      <hr className="divider text-accent-dim" />
      <Quickstart />
      
      <hr className="divider text-accent-dim" />
      <StorageModes />
      
      <hr className="divider text-accent-dim" />
      <Compare />
      
      <hr className="divider text-accent-dim" />
      <CTA />
      
      <Footer />
    </main>
  );
}
