// Single source of truth for the FAQ. Both the visible accordion (Faq.tsx) and the FAQPage
// JSON-LD (app/page.tsx) read from here, so the structured data always matches what's on screen.
export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ: FaqItem[] = [
  {
    q: "What is Bokuzu?",
    a: "Bokuzu is an honest ad dashboard built by Lautzu, a performance marketing agency. It shows ad spend, revenue, ROAS and a log of every change in your Google and Meta accounts. It also runs Lautzu's own prospect audits on public data without fabricating metrics.",
  },
  {
    q: "How fresh is the data?",
    a: "Two speeds, both honest. Changes in your accounts (bids, budgets, launches, pauses) are logged the moment they happen. Performance numbers come from Google and Meta's own reporting, so they sync with every platform refresh. Your dashboard is never behind the platforms, and never ahead of the truth.",
  },
  {
    q: "Do I get Bokuzu if I work with Lautzu?",
    a: "Yes. Every Lautzu engagement includes a Bokuzu portal login.",
  },
  {
    q: "Can I get Bokuzu without working with Lautzu?",
    a: "Not yet. Today the portal comes with every Lautzu engagement. A standalone subscription (connect your own Google and Meta ad accounts, same dashboard, same honesty rail) is in early access. Request a seat above.",
  },
  {
    q: "What does Bokuzu refuse to do?",
    a: "Present a guess as a measurement. Scores are rubric-based bands with confidence tags, thin signal is withheld, generated concepts are always labeled, and missing data is shown with its real status.",
  },
  {
    q: "How does Bokuzu help the ads themselves?",
    a: "By removing the data digging. Bokuzu tracks and reconciles every account change and surfaces what to do next, so the Lautzu team spends its hours on original-concept ads with original music, the creative that actually sells in the age of social video, instead of on manual reporting.",
  },
];
