import { Nav } from "@/components/site/Nav";
import { HeroIntro } from "@/components/site/HeroIntro";
import { Hero } from "@/components/site/Hero";
import { ConsumesStrip } from "@/components/site/ConsumesStrip";
import { Pov } from "@/components/site/Pov";
import { HowItWorks } from "@/components/site/HowItWorks";
import { HonestyRail } from "@/components/site/HonestyRail";
import { HumanGate } from "@/components/site/HumanGate";
import { ClientPortal } from "@/components/site/ClientPortal";
import { WhyLautzu } from "@/components/site/WhyLautzu";
import { Waitlist } from "@/components/site/Waitlist";
import { Faq } from "@/components/site/Faq";
import { Footer } from "@/components/site/Footer";
import { FAQ } from "@/components/site/faqData";

const SITE = "https://bokuzu.com";
const description =
  "Bokuzu shows where every ad dollar went and what it made back: ROAS per platform, custom date ranges, and every account change logged the moment it happens. Built by Lautzu. Never fabricated.";

// Homepage-only structured data: the product itself (SoftwareApplication) and the FAQ. The FAQPage
// entries are generated from the same faqData the visible accordion renders, so schema == content.
const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE}/#software`,
      name: "Bokuzu",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description,
      url: SITE,
      publisher: { "@id": `${SITE}/#org` },
      offers: {
        "@type": "Offer",
        availability: "https://schema.org/PreOrder",
        price: "0",
        priceCurrency: "CAD",
      },
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE}/#faq`,
      mainEntity: FAQ.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

export default function Home() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />
      <HeroIntro />
      <Nav />
      <Hero />
      <ClientPortal />
      <Pov />
      <ConsumesStrip />
      <HowItWorks />
      <HonestyRail />
      <HumanGate />
      <WhyLautzu />
      <Waitlist />
      <Faq />
      <Footer />
    </main>
  );
}
