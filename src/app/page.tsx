import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Timeline from "@/components/Timeline";
import FAQ from "@/components/FAQ";
import Sponsors from "@/components/Sponsors";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-bg-primary">
      <Navbar />
      <Hero />
      <About />
      <Timeline />
      <FAQ />
      <Sponsors />
      <Footer />
    </main>
  );
}
