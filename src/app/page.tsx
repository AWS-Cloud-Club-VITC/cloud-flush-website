import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import HackathonFeatures from "@/components/HackathonFeatures";
import Timeline from "@/components/Timeline";
import FAQ from "@/components/FAQ";
import Sponsors from "@/components/Sponsors";
import Footer from "@/components/Footer";
import GoldParticles from "@/components/GoldParticles";
import RegistrationCountdownPopup from "@/components/RegistrationCountdownPopup";

export default function Home() {
  return (
    <>
      <RegistrationCountdownPopup />
      <GoldParticles />
      <main className="relative z-1 min-h-screen">
      <Navbar />
      <Hero />
      <About />
      <HackathonFeatures />
      <Timeline />
      <FAQ />
      <Sponsors />
      <Footer />
      </main>
    </>
  );
}
