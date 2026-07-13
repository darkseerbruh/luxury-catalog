"use client";

/**
 * The editorial, scroll-animated founder story for /about.
 *
 * ALL motion lives here (framer-motion + lenis) so it stays OFF the home bundle:
 * page.tsx (a Server Component) renders this Client Component, so the heavy
 * animation code only ships on this route. The prod CSP blocks CDN scripts, so
 * both libraries are npm deps bundled at build time, never a <script src>.
 *
 * Reduced-motion: every effect is gated on useReducedMotion(). When a visitor
 * prefers reduced motion, Lenis never starts, parallax/count-up freeze at their
 * resting values, and reveals render fully visible. The page is still beautiful,
 * just still.
 */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
  animate,
  type MotionValue,
} from "framer-motion";
import { HeritageIcon, type HeritageIconName } from "@/components/HeritageIcon";

/* -------------------------------------------------------------------------- */
/* Smooth scroll (Lenis), reduced-motion aware                                */
/* -------------------------------------------------------------------------- */

function useLenis(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let lenis: { raf: (t: number) => void; destroy: () => void } | null = null;
    let frame = 0;
    let cancelled = false;

    // Loaded on the client only, after mount, so it never blocks first paint.
    import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;
      lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
      const raf = (time: number) => {
        lenis?.raf(time);
        frame = requestAnimationFrame(raf);
      };
      frame = requestAnimationFrame(raf);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      lenis?.destroy();
    };
  }, [enabled]);
}

/* -------------------------------------------------------------------------- */
/* Reveal-on-scroll: each story beat rises + fades in once                     */
/* -------------------------------------------------------------------------- */

function Reveal({
  children,
  className,
  delay = 0,
  still,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  still: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-12% 0px -12% 0px" });

  if (still) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Parallax bag cutout: drifts at its own scroll speed behind the text         */
/* -------------------------------------------------------------------------- */

function ParallaxBag({
  src,
  alt,
  className,
  drift,
  progress,
  still,
}: {
  src: string;
  alt: string;
  className?: string;
  /** Pixels the cutout travels across the full scroll of the page. */
  drift: number;
  progress: MotionValue<number>;
  still: boolean;
}) {
  const y = useTransform(progress, [0, 1], [drift, -drift]);
  return (
    <motion.div
      aria-hidden="true"
      className={className}
      style={still ? undefined : { y }}
    >
      <Image
        src={src}
        alt={alt}
        width={340}
        height={340}
        className="h-full w-full object-contain"
        sizes="(max-width: 640px) 40vw, 240px"
      />
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Count-up on the one real number, fired when it scrolls into view            */
/* -------------------------------------------------------------------------- */

function CountUp({
  to,
  suffix = "",
  still,
}: {
  to: number;
  suffix?: string;
  still: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const [value, setValue] = useState(still ? to : 0);

  useEffect(() => {
    if (still || !inView) return;
    const controls = animate(0, to, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, to, still]);

  return (
    <span ref={ref}>
      {value.toLocaleString("en-US")}
      {suffix}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Small on-brand pieces                                                       */
/* -------------------------------------------------------------------------- */

function Eyebrow({ icon, label }: { icon: HeritageIconName; label: string }) {
  return (
    <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold">
      <HeritageIcon name={icon} className="h-4 w-4 shrink-0" />
      {label}
    </p>
  );
}

/** The branded LC monogram tile that stands in for the founder photo until she
 *  supplies one. Same visual language as the site favicon (ivory L over gold C
 *  on a dark rounded tile), so the placeholder reads as intentional, not broken. */
function FounderMonogram() {
  return (
    <div
      aria-hidden="true"
      className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface"
    >
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,rgba(201,162,76,0.14),transparent_60%)]" />
      <span className="relative font-serif text-[7rem] leading-none tracking-tight text-foreground">
        L
        <span className="text-gold">C</span>
      </span>
      <span className="absolute bottom-5 text-[0.7rem] uppercase tracking-[0.28em] text-muted">
        Arielle
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* The page                                                                    */
/* -------------------------------------------------------------------------- */

export default function AboutStory() {
  const reduce = useReducedMotion();
  const still = Boolean(reduce);
  useLenis(!still);

  const pageRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: pageRef,
    offset: ["start start", "end end"],
  });

  return (
    <main ref={pageRef} className="relative overflow-x-clip">
      {/* ---------------------------------------------------------------- */}
      {/* 1. STICKY HERO — full-bleed. Why this exists + the quiz CTA.       */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative flex min-h-[92vh] flex-col items-center justify-center px-5 text-center">
        {/* Parallax cutouts drifting at different speeds behind the wordmark. */}
        <ParallaxBag
          src="/about/hermes-birkin.png"
          alt=""
          drift={still ? 0 : 90}
          progress={scrollYProgress}
          still={still}
          className="pointer-events-none absolute left-[6%] top-[14%] w-24 opacity-30 sm:w-36 md:w-44"
        />
        <ParallaxBag
          src="/about/chanel-flap.png"
          alt=""
          drift={still ? 0 : 150}
          progress={scrollYProgress}
          still={still}
          className="pointer-events-none absolute right-[7%] top-[22%] w-24 opacity-25 sm:w-32 md:w-40"
        />
        <ParallaxBag
          src="/about/lv-speedy.png"
          alt=""
          drift={still ? 0 : 60}
          progress={scrollYProgress}
          still={still}
          className="pointer-events-none absolute bottom-[16%] left-[12%] hidden w-28 opacity-20 sm:block md:w-36"
        />

        <div className="relative z-10 mx-auto max-w-2xl">
          <p className="font-serif text-sm uppercase tracking-[0.35em] text-gold">
            Luxury Catalog
          </p>
          <h1 className="mt-6 font-serif text-4xl leading-tight text-foreground sm:text-5xl md:text-6xl">
            I built the bag reference I could never find.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            What&rsquo;s real, what it&rsquo;s worth, and whether it&rsquo;s
            worth it to you. That used to take the right sales associate or an
            expensive mistake. I&rsquo;m putting it in one place.
          </p>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-muted/90">
            I&rsquo;m Arielle, a collector who started over, spent years in tech
            and analytics, and reads every review before I buy. I&rsquo;m
            obsessive about the details other sites skip, and this is where I put
            them.
          </p>
          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/quiz"
              className="rounded-full bg-gold px-7 py-3 text-sm font-medium text-bg transition hover:bg-gold-soft"
            >
              Take the taste quiz
            </Link>
            <Link
              href="/data"
              className="rounded-full border border-border px-7 py-3 text-sm text-foreground transition hover:border-gold hover:text-gold"
            >
              Explore the price data
            </Link>
          </div>
        </div>

        {/* Scroll cue */}
        {!still && (
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 1, 0.3], y: [0, 8, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden="true"
          >
            <span className="text-[0.7rem] uppercase tracking-[0.3em]">
              Scroll
            </span>
          </motion.div>
        )}
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 2. THE BAG-FEET ORIGIN — split layout. Founder photo slot here.   */}
      {/* ---------------------------------------------------------------- */}
      <section className="mx-auto max-w-5xl px-5 py-24 md:py-32">
        <div className="grid items-center gap-12 md:grid-cols-[0.85fr_1.15fr]">
          <Reveal still={still}>
            {/* TODO: swap in founder photo. Drop a portrait at
                public/about/founder.jpg and replace <FounderMonogram /> with:
                <Image src="/about/founder.jpg" alt="Arielle, founder of Luxury
                Catalog" width={640} height={800} className="rounded-2xl" />.
                Until then this branded LC monogram tile stands in. */}
            <FounderMonogram />
          </Reveal>

          <Reveal still={still} delay={0.1}>
            <Eyebrow icon="clasp" label="Where it started" />
            <h2 className="mt-4 font-serif text-3xl leading-snug text-foreground sm:text-4xl">
              It began with a bag&rsquo;s feet.
            </h2>
            <div className="mt-5 space-y-4 text-base leading-relaxed text-muted">
              <p>
                There&rsquo;s an old superstition that it&rsquo;s bad luck to set
                a bag on the floor. So I only wanted bags with protective feet:
                the little metal studs on the base that keep the leather off the
                ground. A small thing. It matters to me.
              </p>
              <p>
                No site let me filter for it. I couldn&rsquo;t always tell from
                the photos either. And there&rsquo;s no Chanel or Herm&egrave;s
                boutique near Salt Lake City, where I was, so I couldn&rsquo;t
                just go look. The internet was all I had, and the internet
                wouldn&rsquo;t tell me.
              </p>
              <p className="text-foreground">
                It&rsquo;s exactly the kind of detail I could never find, so
                I&rsquo;m building it into the catalog: the ability to sort by
                the small things that decide whether a bag is right for you. And
                the feet were only the start of what I kept looking for.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 2b. THE THESIS — modern usage. Full-bleed, the spine of the page.  */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-y border-border bg-surface py-24 md:py-32">
        <div className="mx-auto max-w-3xl px-5">
          <Reveal still={still} className="text-center">
            <Eyebrow icon="atelier" label="My take" />
            <h2 className="mt-4 font-serif text-3xl leading-snug text-foreground sm:text-4xl">
              My honest read: the brands design gorgeous bags that don&rsquo;t
              quite fit modern life.
            </h2>
          </Reveal>
          <Reveal still={still} delay={0.1}>
            <div className="mx-auto mt-8 max-w-2xl space-y-4 text-base leading-relaxed text-muted">
              <p>
                So many of us work on the go now. We carry a Kindle, an iPad,
                sometimes a small laptop. And the bags don&rsquo;t keep up:
                not enough crossbody straps, not enough back pockets sized for a
                phone, not enough real capacity for a day out in the world.
              </p>
              <p>
                To me the Chanel 19 got it right. The 22, in my opinion, missed.
                That&rsquo;s a matter of taste, and you might carry it
                differently. But it&rsquo;s the kind of practical read I wanted
                on every bag, and couldn&rsquo;t find anywhere.
              </p>
              <p className="text-foreground">
                So Luxury Catalog captures the practical details brands gloss
                over: whether a bag has feet, whether it can go crossbody,
                whether it actually holds what you carry. The feet were just the
                first of them.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 3. THE COLLECTOR WHO RESTARTED — centered column + parallax.       */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <ParallaxBag
          src="/about/lady-dior.png"
          alt=""
          drift={still ? 0 : 120}
          progress={scrollYProgress}
          still={still}
          className="pointer-events-none absolute -right-6 top-10 w-28 opacity-20 sm:w-40 md:right-[8%] md:w-48"
        />
        <div className="mx-auto max-w-2xl px-5 text-center">
          <Reveal still={still}>
            <Eyebrow icon="family" label="Who&rsquo;s behind it" />
            <h2 className="mt-4 font-serif text-3xl leading-snug text-foreground sm:text-4xl">
              I&rsquo;m a collector who started over, and still feels like a
              first-time buyer.
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-muted">
              <p>
                I didn&rsquo;t come from luxury. I built a collection, then let
                it go, then started again. Every time I buy, I still get that
                first-timer&rsquo;s knot: is this real, is this the right one,
                am I about to overpay?
              </p>
              <p>
                I once held a bag worth around three hundred thousand dollars in
                a showroom, and I shook the entire time. I knew right then
                I&rsquo;d never carry that one. But holding it trained my eye,
                and it reminded me this is for everyday people who want in, not
                for insiders.
              </p>
              <p className="text-foreground">
                So the site answers the two questions I actually have. An honest
                read on what a bag is worth, shown as an estimate from real
                resale data, not an appraisal. And a taste quiz that helps you
                figure out what&rsquo;s worth it to you, before you spend.
              </p>
            </div>
            <Link
              href="/quiz"
              className="mt-8 inline-block text-sm font-medium text-gold underline-offset-4 hover:underline"
            >
              Find your taste read &rarr;
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 3b. WHY TRUST ME — de-gatekeeping the myths, split layout.         */}
      {/* ---------------------------------------------------------------- */}
      <section className="mx-auto max-w-5xl px-5 py-24 md:py-32">
        <div className="grid items-start gap-12 md:grid-cols-2">
          <Reveal still={still}>
            <Eyebrow icon="stitch" label="No gatekeeping" />
            <h2 className="mt-4 font-serif text-3xl leading-snug text-foreground sm:text-4xl">
              Half of what gets repeated about &ldquo;real vs. fake&rdquo; is
              wrong.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted">
              These are the myths I&rsquo;d correct for a friend at the
              counter. None of them is a verdict on any one bag, they&rsquo;re
              the kind of lore that gets passed around as gospel and shouldn&rsquo;t
              be.
            </p>
          </Reveal>

          <Reveal still={still} delay={0.1}>
            <ul className="space-y-5 text-base leading-relaxed text-muted">
              <li className="flex gap-3">
                <HeritageIcon
                  name="clasp"
                  className="mt-1 h-5 w-5 shrink-0 text-gold"
                />
                <span>
                  Logos don&rsquo;t have to line up perfectly across every panel.
                  A pattern that breaks at a seam isn&rsquo;t proof of a fake.
                </span>
              </li>
              <li className="flex gap-3">
                <HeritageIcon
                  name="scissors"
                  className="mt-1 h-5 w-5 shrink-0 text-gold"
                />
                <span>
                  &ldquo;Perfect stitching or it&rsquo;s fake&rdquo; is a myth.
                  Quality has genuinely slipped over the years. It&rsquo;s known
                  among collectors, though there&rsquo;s no hard dataset on it, so
                  I&rsquo;ll call it what it is: my read, echoed by voices I trust
                  like Je Suis Lou.
                </span>
              </li>
            </ul>
            <p className="mt-6 text-base leading-relaxed text-foreground">
              That&rsquo;s exactly why the site is honest data and markers to
              check, not gatekept lore. We show you what to look at and let you
              make the call.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 4. THE DATA CONVICTION — full-bleed dark band + the count-up.      */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-y border-border bg-surface py-24 md:py-32">
        <div className="mx-auto max-w-4xl px-5">
          <Reveal still={still} className="text-center">
            <Eyebrow icon="catalogue" label="Why data" />
            <h2 className="mt-4 font-serif text-3xl leading-snug text-foreground sm:text-4xl">
              I&rsquo;d rather have five hundred owners than one friend&rsquo;s
              opinion.
            </h2>
          </Reveal>

          <Reveal still={still} delay={0.1}>
            <div className="mx-auto mt-12 max-w-md text-center">
              <p className="font-serif text-6xl text-gold sm:text-7xl">
                <CountUp to={500} suffix="+" still={still} />
              </p>
              <p className="mt-2 text-sm uppercase tracking-[0.2em] text-muted">
                price observations and counting
              </p>
            </div>
          </Reveal>

          <Reveal still={still} delay={0.15}>
            <div className="mx-auto mt-10 max-w-2xl space-y-4 text-base leading-relaxed text-muted">
              <p>
                I spent years in tech and analytics, so I trust a pattern over a
                hunch. Before I buy anything, I read every review I can find. One
                person&rsquo;s take is a story. Hundreds of them is a signal.
              </p>
              <p className="text-foreground">
                That&rsquo;s the backbone of the site: a real, growing dataset of
                resale prices, each one dated and sourced. And a place built to
                gather reviews from people who actually carried the bag, so your
                read comes from the many, not the loudest one.
              </p>
            </div>
          </Reveal>

          <Reveal still={still} delay={0.2} className="mt-8 text-center">
            <Link
              href="/data"
              className="text-sm font-medium text-gold underline-offset-4 hover:underline"
            >
              See the data behind every page &rarr;
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 5. DEMOCRATIZE IT — centered, lands on the tagline.               */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <ParallaxBag
          src="/about/hermes-kelly.png"
          alt=""
          drift={still ? 0 : 100}
          progress={scrollYProgress}
          still={still}
          className="pointer-events-none absolute -left-6 top-8 w-28 opacity-20 sm:w-40 md:left-[6%] md:w-48"
        />
        <ParallaxBag
          src="/about/fendi-peekaboo.png"
          alt=""
          drift={still ? 0 : 70}
          progress={scrollYProgress}
          still={still}
          className="pointer-events-none absolute bottom-6 right-[8%] hidden w-28 opacity-15 sm:block md:w-40"
        />
        <div className="mx-auto max-w-2xl px-5 text-center">
          <Reveal still={still}>
            <Eyebrow icon="flag" label="The mission" />
            <h2 className="mt-4 font-serif text-3xl leading-snug text-foreground sm:text-4xl">
              Cars have Kelley Blue Book. Products have reviews. Perfume has
              Fragrantica. Luxury bags had nothing.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted">
              This kind of knowledge shouldn&rsquo;t be gatekept behind the right
              boutique or the right forum. I&rsquo;m handing it over straight: no
              snobbery, no pressure, just what&rsquo;s real and what it&rsquo;s
              worth.
            </p>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted/90">
              The brand still matters, I won&rsquo;t pretend it doesn&rsquo;t. I
              just like it understated: a subtle read, not a loud one.
            </p>
          </Reveal>

          <Reveal still={still} delay={0.15}>
            <p className="mx-auto mt-12 max-w-xl border-t border-border pt-10 font-serif text-2xl leading-snug text-foreground sm:text-3xl">
              Know what it&rsquo;s worth &mdash; and what it&rsquo;s worth to you.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 7. CLOSING — the two CTAs, primary + secondary.                   */}
      {/* ---------------------------------------------------------------- */}
      <section className="mx-auto max-w-2xl px-5 pb-28 text-center">
        <Reveal still={still}>
          <h2 className="font-serif text-3xl leading-snug text-foreground sm:text-4xl">
            Start with what&rsquo;s worth it to you.
          </h2>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/quiz"
              className="rounded-full bg-gold px-7 py-3 text-sm font-medium text-bg transition hover:bg-gold-soft"
            >
              Take the taste quiz
            </Link>
            <Link
              href="/data"
              className="rounded-full border border-border px-7 py-3 text-sm text-foreground transition hover:border-gold hover:text-gold"
            >
              Explore the price data
            </Link>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
