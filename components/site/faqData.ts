// Single source of truth for the FAQ. Both the visible accordion (Faq.tsx) and the FAQPage
// JSON-LD (app/page.tsx) read from here, so the structured data always matches what's on screen.
export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ: FaqItem[] = [
  {
    q: "What is Bokuzu?",
    a: "Bokuzu is the transparency software built by Lautzu, a performance marketing agency. It gives every Lautzu client a portal showing ad spend, ROAS and every optimization made in their Google and Meta accounts, and runs Lautzu's prospect audits on public data without fabricating metrics.",
  },
  {
    q: "How fresh is the data?",
    a: "Google Ads and Meta refresh their reporting roughly daily — that's a platform fact, not a Bokuzu limit. The moment fresh data lands, Bokuzu's analysis is already done: what changed, what's working, what to act on next. Your dashboard is never behind the platforms.",
  },
  {
    q: "Do I get Bokuzu if I work with Lautzu?",
    a: "Yes. Every Lautzu engagement includes a Bokuzu portal login.",
  },
  {
    q: "What does Bokuzu refuse to do?",
    a: "Present a guess as a measurement. Scores are rubric-based bands with confidence tags, thin signal is withheld, generated concepts are always labeled, and missing data is shown with its real status.",
  },
  {
    q: "How does Bokuzu help the ads themselves?",
    a: "By removing the data digging. Bokuzu tracks and reconciles every account change and surfaces what to do next, so the Lautzu team spends its hours on original-concept ads with original music — the creative that actually sells in the age of social video — instead of on manual reporting.",
  },
];
