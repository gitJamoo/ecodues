import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ExternalLink } from "lucide-react";
import { VideoBackdrop } from "@/components/video-backdrop";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="border-b border-white/10 px-4 sm:px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <Logo size={26} />
        <div className="flex items-center gap-3 sm:gap-6 text-sm text-white/70">
          <Link href="#about" className="hover:text-white transition-colors hidden sm:block">About</Link>
          <Link href="/methodology" className="hover:text-white transition-colors hidden sm:block">Methodology</Link>
          <Link href="/login">
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10 bg-transparent"
            >
              Sign in
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero — video frozen at first frame here */}
      <main className="max-w-3xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-medium text-white/80 mb-6">
          Open source · Powered by Every.org
        </div>
        <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight leading-tight mb-6 text-white">
          Your AI has a footprint.<br />
          <span className="text-primary">Erase it — twice.</span>
        </h1>
        <p className="text-base sm:text-lg text-white/70 mb-10 max-w-xl mx-auto leading-relaxed">
          Connect your AI provider accounts. We measure your inference emissions using peer-reviewed research,
          then email you a one-click link every month to donate 2× the damage to climate charities you choose.
        </p>
        <Link href="/login">
          <Button size="lg" className="rounded-full px-8">Get started free</Button>
        </Link>
      </main>

      {/*
        VideoBackdrop renders two things:
        1. A fixed full-screen video pinned behind all content (-z-10)
        2. A scroll-zone spacer here — scrubs the video as user scrolls through it.
        Before this zone: video frozen at frame 0.
        After this zone: video frozen at last frame.
      */}
      <VideoBackdrop src="/hero_video.mp4" />

      {/* Steps — video frozen at last frame here */}
      <section className="max-w-4xl mx-auto px-6 pb-24 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {[
          { n: "1", title: "Connect", body: "Add your OpenRouter, OpenAI, Anthropic, or Gemini account. Or just pick your subscription tier." },
          { n: "2", title: "We measure", body: "We compute your monthly CO₂e footprint using published energy-per-token estimates and cite every constant." },
          { n: "3", title: "You donate 2×", body: "On the 1st of each month, we email you a one-click Every.org link pre-filled at 2× your damage. You click, you pay, you get a tax receipt. We never touch your money." },
        ].map(({ n, title, body }) => (
          <div key={n} className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <div className="w-8 h-8 rounded-full bg-white/10 text-white text-sm font-semibold flex items-center justify-center mb-4">{n}</div>
            <h3 className="font-semibold mb-2 text-white">{title}</h3>
            <p className="text-sm text-white/60 leading-relaxed">{body}</p>
          </div>
        ))}
      </section>

      {/* Open source banner */}
      <section className="border-y border-white/10 bg-black/30 backdrop-blur-sm py-12 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <p className="text-xs font-medium text-primary uppercase tracking-widest mb-2">100% Open Source</p>
            <h2 className="text-2xl font-semibold tracking-tight mb-2 text-white">Built in the open. Always.</h2>
            <p className="text-sm text-white/60 max-w-md leading-relaxed">
              Every line of code — the emissions engine, the donation logic, the methodology — is public.
              Audit it, fork it, improve it. Contributors are always welcome and genuinely appreciated.
            </p>
          </div>
          <a
            href="https://github.com/gitJamoo/ecodues"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-full bg-white text-black px-6 py-3 text-sm font-semibold hover:bg-white/90 transition-colors shrink-0"
          >
            <GithubIcon className="w-4 h-4" />
            View on GitHub
          </a>
        </div>
      </section>

      {/* About */}
      <section id="about" className="max-w-3xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <p className="text-xs font-medium text-primary uppercase tracking-widest mb-3">The story</p>
          <h2 className="text-3xl font-semibold tracking-tight text-white">Why EcoDues exists</h2>
        </div>

        <div className="max-w-none text-white/70 leading-relaxed space-y-5 text-[15px]">
          <p>
            I use AI tools every day — for learning, building, and generally trying to get better at what I do.
            But the more I learned about the environmental cost of large language models, the harder it became
            to ignore: every prompt has a footprint, and those footprints add up fast across millions of users.
          </p>
          <p>
            I didn&apos;t want to stop using AI. The upskilling is real, the productivity gains are real, and
            the technology is genuinely exciting. What I wanted was a way to use it <em className="text-white/90">responsibly</em> —
            to keep growing while giving something back to the planet in proportion to what I was taking.
          </p>
          <p>
            The idea behind EcoDues is simple: calculate the actual damage your inference usage causes (in dollars,
            using the social cost of carbon), then donate twice that amount to the climate charities most likely
            to make a real difference. You keep the productivity. The planet gets a net positive.
          </p>
          <p>
            This is a solo project built with a lot of curiosity and the help of AI tools themselves — which
            felt fitting. It&apos;s not perfect, and the methodology will keep improving as better data becomes
            available. That&apos;s why it&apos;s open source.
          </p>
        </div>

        <div className="mt-12 flex items-center gap-4 border-t border-white/10 pt-10">
          <div className="w-12 h-12 rounded-full bg-white/10 text-white font-semibold text-lg flex items-center justify-center shrink-0">
            JS
          </div>
          <div>
            <p className="font-semibold text-sm text-white">James Smith</p>
            <a
              href="https://j-m-s.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline underline-offset-2 font-medium"
            >
              j-m-s.dev <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/40 backdrop-blur-sm py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <div className="flex items-center gap-1.5">
            <Logo size={18} />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link href="#about" className="hover:text-white/80 transition-colors">About</Link>
            <Link href="/methodology" className="hover:text-white/80 transition-colors">Methodology</Link>
            <Link href="/how-donations-work" className="hover:text-white/80 transition-colors">Donations</Link>
            <a
              href="https://github.com/gitJamoo/ecodues"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/80 transition-colors flex items-center gap-1"
            >
              <GithubIcon className="w-3 h-3" /> GitHub
            </a>
          </div>
          <p>Made with care by <a href="https://j-m-s.dev/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white/80">James Smith</a></p>
        </div>
      </footer>
    </div>
  );
}
