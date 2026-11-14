import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { Button, ButtonLink } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import './app.css'

export function Home({ onOpenMethod }: { onOpenMethod: () => void }) {
  return (
    <>
      <a
        className="fixed top-4 left-4 z-20 -translate-y-[180%] rounded-lg bg-brand px-4 py-3 text-on-brand focus:translate-y-0"
        href="#main"
      >
        Skip to content
      </a>
      <main id="main">
        <section
          className="relative isolate min-h-[900px] overflow-hidden bg-space sm:min-h-[min(982px,100svh)]"
          id="top"
          aria-labelledby="hero-title"
        >
          <picture className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
            <source media="(max-width: 640px)" srcSet="/images/earth-nile-small.webp" />
            <img
              src="/images/earth-nile.webp"
              alt=""
              width="1672"
              height="941"
              fetchPriority="high"
              className="h-full w-full object-cover object-[62%_center] sm:object-center"
            />
          </picture>
          <div className="hero-shade pointer-events-none absolute inset-0 -z-10" />
          <div className="section-shell flex min-h-[inherit] flex-col">
            <header className="flex min-h-20 items-center justify-between gap-4 border-b border-white/16 sm:min-h-[86px] sm:gap-8">
              <a
                href="#top"
                className="inline-flex items-center gap-5 font-display text-[1.8rem] leading-none font-semibold tracking-[-0.065em] no-underline"
                aria-label="BurnCal by NileSpark, home"
              >
                <span>
                  burncal<span className="text-brand">.</span>
                </span>
                <span className="eyebrow hidden pt-1 text-[9px] lg:block">by NileSpark</span>
              </a>
              <nav
                aria-label="Main navigation"
                className="hidden items-center gap-[clamp(1.25rem,3vw,3rem)] sm:flex [&_a]:py-3 [&_a]:text-label [&_a]:text-secondary [&_a]:no-underline [&_a:hover]:text-paper [&_button]:border-0 [&_button]:bg-transparent [&_button]:py-3 [&_button]:text-label [&_button]:text-secondary [&_button:hover]:text-paper"
              >
                <a href="#/explore">Explore</a>
                <button type="button" onClick={onOpenMethod}>
                  The science
                </button>
                <a href="#our-story">Our story</a>
              </nav>
              <Badge>Frontend demo</Badge>
            </header>
            <div className="relative flex min-h-[560px] flex-1 items-center py-16 sm:min-h-[580px] sm:py-20">
              <div className="relative z-10 w-full md:w-4/5 lg:w-[62%]">
                <p className="eyebrow mb-12 flex items-center gap-3 text-[9px] text-horizon sm:text-[10px]">
                  <span className="size-[5px] shrink-0 rounded-full bg-brand" aria-hidden="true" />
                  Earth data. Human perspective.
                </p>
                <h1
                  id="hero-title"
                  className="text-[clamp(2.9rem,11.4vw,4rem)] leading-[1.16] tracking-[-0.055em] sm:text-[clamp(3.5rem,6.1vw,5.7rem)] [&>span]:text-horizon"
                >
                  Two sensors.
                  <br />
                  <span>One fire story.</span>
                </h1>
                <p className="mt-7 max-w-100 text-[clamp(0.9375rem,1.2vw,1.0625rem)] leading-relaxed text-secondary">
                  A clearer view of burning activity,
                  <br className="hidden sm:block" /> from a place you know to patterns across time.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-2 sm:gap-3">
                  <ButtonLink href="#/explore" size="lg" endIcon={<ArrowRight />}>
                    Explore the Nile
                  </ButtonLink>
                  <Button variant="ghost" onClick={onOpenMethod} endIcon={<ArrowUpRight />}>
                    How it works
                  </Button>
                </div>
                <p className="eyebrow mt-10 text-[8px] sm:mt-14 sm:text-[9px]">
                  Choose a place. Follow its seasons.
                </p>
              </div>
              <div
                className="absolute top-[56%] left-[71%] hidden items-end gap-5 lg:flex"
                aria-hidden="true"
              >
                <div className="orbital-target">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="absolute bottom-[-40px] left-[143px] min-w-38 border-l border-brand pl-4 [&>p:first-child]:text-paper [&>p+p]:mt-1 [&>p+p]:text-label [&>p+p]:text-secondary">
                  <p className="eyebrow">Upper Egypt</p>
                  <p>A place to begin.</p>
                </div>
              </div>
            </div>
            <div
              className="grid grid-cols-1 gap-5 rounded-control border border-stroke bg-panel/90 p-6 sm:grid-cols-3 sm:p-7 [&>div+div]:border-t [&>div+div]:border-stroke [&>div+div]:pt-5 sm:[&>div+div]:border-t-0 sm:[&>div+div]:border-l sm:[&>div+div]:pl-6 sm:[&>div+div]:pt-0 [&_.eyebrow]:text-[9px] [&_p+p]:mt-3 [&_p+p]:font-display [&_p+p]:text-[clamp(1rem,1.35vw,1.25rem)]"
              id="our-story"
            >
              <div>
                <p className="eyebrow">01 / A connected perspective</p>
                <p>MODIS meets VIIRS.</p>
              </div>
              <div>
                <p className="eyebrow">02 / Start somewhere familiar</p>
                <p>The Nile corridor, through time.</p>
              </div>
              <div>
                <p className="eyebrow">03 / Keep the evidence close</p>
                <p>Sources. Coverage. Method.</p>
              </div>
            </div>
            <div className="flex flex-col justify-between gap-1 py-6 font-mono text-[8px] leading-relaxed tracking-wider text-muted uppercase sm:flex-row sm:gap-4 sm:text-[9px]">
              <p>AI-generated concept imagery · No NASA observations loaded</p>
              <p>NileSpark / BurnCal</p>
            </div>
          </div>
        </section>
      </main>
      <footer className="section-shell flex flex-col items-start justify-between gap-6 border-t border-stroke py-10 md:flex-row md:items-center [&>p]:text-label [&>p]:text-muted [&>a:last-child]:inline-flex [&>a:last-child]:items-center [&>a:last-child]:gap-2 [&>a:last-child]:text-label [&>a:last-child]:text-muted">
        <a
          href="#top"
          className="inline-flex items-center gap-5 font-display text-[1.8rem] leading-none font-semibold tracking-[-0.065em] no-underline"
        >
          burncal<span className="text-brand">.</span>
        </a>
        <p>Built by NileSpark. From a local story to a global question.</p>
        <a href="https://firms.modaps.eosdis.nasa.gov/" target="_blank" rel="noreferrer">
          NASA FIRMS <span className="sr-only">(opens in a new tab)</span>
          <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </footer>
    </>
  )
}
