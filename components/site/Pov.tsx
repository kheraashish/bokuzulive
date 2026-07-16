import { SectionShell } from "./ui";

export function Pov() {
  return (
    <div>
      <SectionShell className="py-10 sm:py-12 lg:py-12">
      <p className="kicker">The outreach engine</p>
      <p className="mt-4 max-w-prose text-lg leading-relaxed text-ash">
        Bokuzu also runs Lautzu&apos;s own client acquisition. Same honesty, pointed outward.
      </p>
      <div className="mt-8 grid grid-cols-1 gap-x-16 gap-y-8 lg:grid-cols-[1.2fr_1fr]">
        <h2 className="display-lg text-bone">
          Every tool promises volume. None of them can tell you when they{"'"}re{" "}
          <span className="text-lime">guessing.</span>
        </h2>
        <div className="max-w-prose space-y-5 self-end text-lg leading-relaxed text-ash">
          <p>
            The market is full of engines that spray personalized-sounding email and invent a
            confidence score to match. A fabricated metric is worse than no metric: it spends your
            credibility on the first reply.
          </p>
          <p>
            Bokuzu is built the opposite way. It assesses craft against a fixed rubric, shows the
            band and the confidence, and withholds when the signal is thin. The honesty is not a
            setting. It is compiled into the product.
          </p>
        </div>
      </div>
    </SectionShell>
    </div>
  );
}
