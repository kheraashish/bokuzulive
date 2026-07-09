import { Nav } from "@/components/site/Nav";
import { HeroIntro } from "@/components/site/HeroIntro";
import { Hero } from "@/components/site/Hero";
import { ConsumesStrip } from "@/components/site/ConsumesStrip";
import { Pov } from "@/components/site/Pov";
import { HowItWorks } from "@/components/site/HowItWorks";
import { HonestyRail } from "@/components/site/HonestyRail";
import { HumanGate } from "@/components/site/HumanGate";
import { Waitlist } from "@/components/site/Waitlist";
import { Footer } from "@/components/site/Footer";

export default function Home() {
  return (
    <main>
      <HeroIntro />
      <Nav />
      <Hero />
      <ConsumesStrip />
      <Pov />
      <HowItWorks />
      <HonestyRail />
      <HumanGate />
      <Waitlist />
      <Footer />
    </main>
  );
}
