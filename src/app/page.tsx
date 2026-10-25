import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Compass,
  LockKeyhole,
  Sparkles,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { AppFooter } from "@/components/app-footer";
import { Brand } from "@/components/brand";

const benefits: {
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    title: "Know what you can spend.",
    description:
      "Get a clearer picture of your allowance and everyday expenses, all in one calm place.",
    icon: WalletCards,
  },
  {
    title: "Build smarter savings habits.",
    description:
      "Make room for the things you care about with goals that feel achievable.",
    icon: Sparkles,
  },
  {
    title: "Understand your money.",
    description:
      "Turn everyday spending into useful insights, without the finance jargon.",
    icon: Compass,
  },
];

export default function Home() {
  return (
    <div className="landing-page">
      <header className="landing-header page-container">
        <Brand />
        <nav aria-label="Main navigation" className="landing-nav">
          <a href="#features" className="landing-nav-link">
            Features
          </a>
          <Link href="/dashboard" className="button button-primary button-small">
            Try demo <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </nav>
      </header>

      <main>
        <section className="hero-section page-container">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="eyebrow-dot" />
              Money management made for student life
            </span>
            <h1>
              Make every
              <br />
              rupee <span className="text-primary">count.</span>
            </h1>
            <p className="hero-description">
              Make sense of your monthly allowance, understand where it goes,
              and make a little room for what matters to you.
            </p>
            <div className="hero-actions">
              <Link href="/dashboard" className="button button-primary">
                Try demo <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <a href="#features" className="button button-secondary">
                Explore features
              </a>
            </div>
            <div className="hero-assurance">
              <LockKeyhole size={15} aria-hidden="true" />
              <span>Private by design. No bank connection needed.</span>
            </div>
          </div>

          <div className="preview-wrap" aria-label="Product preview">
            <div className="preview-orbit preview-orbit-one" />
            <div className="preview-orbit preview-orbit-two" />
            <div className="preview-card">
              <div className="preview-card-top">
                <div>
                  <span className="preview-label">YOUR MONEY, AT A GLANCE</span>
                  <h2>A fresh start</h2>
                </div>
                <span className="preview-mark" aria-hidden="true">
                  <Sparkles size={18} />
                </span>
              </div>
              <div className="preview-balance">
                <span>Safe to spend today</span>
                <span className="preview-dash" aria-label="Not available yet">
                  —
                </span>
                <small>Ready when you are</small>
              </div>
              <div className="preview-progress">
                <div className="preview-progress-heading">
                  <span>Your monthly picture</span>
                  <span>Demo preview</span>
                </div>
                <div className="preview-progress-track">
                  <div />
                </div>
                <div className="preview-progress-foot">
                  <span>Allowance</span>
                  <span>Spending</span>
                  <span>Savings</span>
                </div>
              </div>
              <div className="preview-note">
                <span className="preview-note-icon">
                  <Check size={15} aria-hidden="true" />
                </span>
                <span>Your money journey starts with one small step.</span>
              </div>
            </div>
            <div className="preview-floating-note">
              <span className="floating-note-dot" />
              A little more clarity, every day
            </div>
          </div>
        </section>

        <section id="features" className="benefits-section page-container">
          <div className="section-heading">
            <span className="section-kicker">A better money routine</span>
            <h2>Good with money starts here.</h2>
            <p>
              Simple tools to help you feel more confident about the money you
              have.
            </p>
          </div>
          <div className="benefit-grid">
            {benefits.map(({ title, description, icon: Icon }, index) => (
              <article className="benefit-card" key={title}>
                <span className={`benefit-icon benefit-icon-${index + 1}`}>
                  <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
                <span className="benefit-arrow" aria-hidden="true">
                  <ArrowUpRight size={17} />
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="privacy-section page-container">
          <div className="privacy-card">
            <span className="privacy-icon">
              <LockKeyhole size={22} aria-hidden="true" />
            </span>
            <div>
              <h2>Your money stays yours.</h2>
              <p>
                This prototype does not connect to bank accounts, collect
                financial credentials, or make payments. Your financial
                information stays in your hands.
              </p>
            </div>
            <Link href="/dashboard" className="text-link">
              Take a look <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  );
}
