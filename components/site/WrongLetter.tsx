import Link from "next/link";
import { SectionShell } from "./ui";

// Makes the 404 film discoverable, and turns it into evidence rather than a stunt: the failure the
// section describes is the same one the film is built out of.
export function WrongLetter() {
  return (
    <div id="wrong-letter" className="group/sec scroll-mt-24">
      <SectionShell className="py-10 sm:py-12 lg:py-12">
        <p className="kicker inline-block origin-left text-ash transition-all duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] sm:group-hover/sec:scale-150 group-hover/sec:text-lime">The page nobody was ever meant to see</p>

        <div className="mt-8 grid grid-cols-1 gap-x-16 gap-y-8 lg:grid-cols-[1.2fr_1fr]">
          <h2 className="display-lg text-bone">
            Some mistakes never make it <span className="text-lime">into the report.</span>
          </h2>

          {/* The buttons live at the end of THIS column, not beside the headline: the last paragraph
              is the curiosity gap, so the invitation has to sit immediately under it. Left in the
              short left column they stranded ~240px of dead space under the h2. */}
          <div className="max-w-prose self-end text-lg leading-relaxed text-ash">
            <div className="space-y-5">
              <p>
                One wrong character in a destination URL. Delivery&apos;s fine, CTR&apos;s fine, the
                dashboard is green, and every click you&apos;re paying for lands on nothing. Nothing
                objects, because by every measure nothing is wrong.
              </p>
              <p>
                That is exactly the kind of thing a monthly deck rounds off. Bokuzu can&apos;t round
                it off: the change is in your log the moment it&apos;s made, sitting next to the money
                it moved, whether or not it flatters us. A log that keeps only the flattering half is
                just a slower way of lying.
              </p>
              <p>
                We built the other end of it too. Nobody was ever meant to see the page a wrong
                letter sends you to. It&apos;s finished anyway. Lautzu&apos;s site has one as well,
                for the same reason.
              </p>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {/* A real anchor, not <Link>: this should be a genuine request that genuinely 404s.
                  The address bar is part of the joke, so there is no query string to carry. */}
              <a
                href="/nobody-comes-here"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full border border-plum-line px-6 py-3 text-sm font-medium text-bone transition-colors duration-200 ease-out hover:border-lime hover:bg-lime hover:text-ink sm:w-auto"
              >
                Break our URL on purpose
                <span aria-hidden className="transition-transform duration-200 ease-out group-hover:translate-x-1">
                  &rarr;
                </span>
              </a>
              <Link
                href="/example"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-lime px-6 py-3 text-sm font-semibold text-ink shadow-glow transition-transform duration-200 ease-out hover:bg-lime-press active:scale-[0.98] sm:w-auto"
              >
                View the live demo
                <span aria-hidden className="transition-transform duration-200 ease-out group-hover:translate-x-1">
                  &rarr;
                </span>
              </Link>
            </div>
          </div>
        </div>
      </SectionShell>
    </div>
  );
}
