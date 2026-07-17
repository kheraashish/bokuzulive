"use client";

import { useState } from "react";
import { SectionShell } from "./ui";
import { FAQ } from "./faqData";

// Visible FAQ accordion. Content is the SAME array the FAQPage JSON-LD reads (faqData.ts), so the
// structured data always matches what's on screen. Fully keyboard- and touch-operable: each control
// is a real <button> with aria-expanded/aria-controls, ≥44px tap target, chevron rotates on open.
export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="group/sec">
      <SectionShell id="faq" className="py-10 sm:py-12 lg:py-12">
      <p className="kicker inline-block origin-left text-ash transition-all duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] sm:group-hover/sec:scale-150 group-hover/sec:text-lime">Common questions</p>
      <h2 className="display-lg mt-4 text-bone"><span className="text-lime">Questions,</span> answered <span className="text-lime">honestly.</span></h2>

      <dl className="mt-10 border-t border-plum-line/70">
        {FAQ.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className="border-b border-plum-line/70">
              <dt>
                <button
                  type="button"
                  id={`faq-q-${i}`}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex min-h-[44px] w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-bone"
                >
                  <span className="text-lg font-medium text-bone">{item.q}</span>
                  <span
                    aria-hidden
                    className={`shrink-0 text-ash transition-transform duration-200 ease-out ${isOpen ? "rotate-180 text-lime" : ""}`}
                  >
                    &#9662;
                  </span>
                </button>
              </dt>
              <dd
                id={`faq-panel-${i}`}
                role="region"
                aria-labelledby={`faq-q-${i}`}
                hidden={!isOpen}
                className="max-w-prose pb-6 text-base leading-relaxed text-ash"
              >
                {item.a}
              </dd>
            </div>
          );
        })}
      </dl>
    </SectionShell>
    </div>
  );
}
