import {
  ArrowLeftRightIcon,
  ChartColumnIcon,
  CheckIcon,
  PhilippinePesoIcon,
  PiggyBankIcon,
  ShieldCheckIcon,
  TagsIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { HomeActions } from "@/components/home-actions";
import {
  BudgetsPreview,
  DashboardPreview,
  SpendingPreview,
  TransactionsPreview,
} from "@/components/landing/previews";
import { sampleMonth } from "@/components/landing/sample-month";
import { Brand, LANDING_SECTIONS, SiteHeader } from "@/components/landing/site-header";
import { SmoothScroll } from "@/components/landing/smooth-scroll";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

// The public landing page. It's static (no session or database reads), so it
// loads fast and can be cached; HomeActions checks sign-in in the browser.

export const metadata: Metadata = {
  title: "Budget Tracker: know where every peso goes",
  description:
    "Track spending across cash, bank accounts and e-wallets, set monthly budgets per category, and see your month at a glance. Made for the Philippines, in pesos.",
};

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: WalletIcon,
    title: "All your accounts",
    body: "Cash, bank accounts, e-wallets, savings and credit cards, each with an up-to-date balance and one total.",
  },
  {
    icon: ArrowLeftRightIcon,
    title: "Transfers that aren't spending",
    body: "Move money from cash to GoTyme or from your bank to GCash. Both balances update, and your spending stays accurate.",
  },
  {
    icon: TagsIcon,
    title: "Categories with icons",
    body: "Start with 16 ready-made categories like Food & Dining and Load & Internet, or create your own with an icon and colour.",
  },
  {
    icon: PiggyBankIcon,
    title: "Monthly budgets",
    body: "Set a limit for each category. Its bar turns amber at 80% and red when you go over, so nothing sneaks up on you.",
  },
  {
    icon: ChartColumnIcon,
    title: "Your month at a glance",
    body: "A dashboard with income vs expenses for the last six months and where this month's money went.",
  },
  {
    icon: PhilippinePesoIcon,
    title: "Built for the Philippines",
    body: "Everything is in pesos, and days follow Philippine time, so a late-night jeepney ride lands on the right date.",
  },
];

const STEPS = [
  {
    title: "Create your account",
    body: "Sign up with your email and a password. It takes less than a minute.",
  },
  {
    title: "Add your accounts",
    body: "Add your wallet, bank accounts and e-wallets with what's in them today.",
  },
  {
    title: "Record and budget",
    body: "Log expenses as they happen and set limits for the categories that matter to you.",
  },
];

const FAQS = [
  {
    q: "Does it connect to my bank or e-wallet?",
    a: "No. You record transactions yourself, so Budget Tracker never asks for your bank or e-wallet login. It only knows what you tell it.",
  },
  {
    q: "Which currency does it use?",
    a: "Philippine pesos only. Every amount is shown in pesos, like ₱1,250.50.",
  },
  {
    q: "Can I track a credit card?",
    a: "Yes. Add it as a credit card account with a negative opening balance for what you owe, then record purchases as expenses paid with that card. Paying the bill is a transfer from your bank to the card.",
  },
  {
    q: "Do transfers between my own accounts count as spending?",
    a: "No. A transfer moves money between your accounts, so both balances change but your income, spending and budgets don't.",
  },
  {
    q: "What if I stop using an account or category?",
    a: "Archive it. It's hidden from the forms, but your past transactions stay exactly as they were. You can restore it any time.",
  },
  {
    q: "Who can see my data?",
    a: "Only you. Everything you record belongs to your account and is shown only when you're signed in.",
  },
];

export default async function Home() {
  const month = await sampleMonth();

  return (
    <>
      <SmoothScroll />
      <SiteHeader />
      <main className="flex-1">
        <Hero month={month} />
        <Features />
        <Spotlight
          eyebrow="Transactions"
          title="Record an expense in seconds"
          body="Type the amount, pick a category and you're done. The form remembers the account you used last, so a quick entry is just a number."
          points={[
            "Expenses, income and transfers in one form",
            "Browse by month, and filter by type",
            "Add a note so you remember what it was for",
          ]}
          preview={<TransactionsPreview />}
        />
        <Spotlight
          eyebrow="Budgets"
          title="Budgets that warn you early"
          body="Give each category a monthly limit and see what's left at a glance, plus how much you can spend a day for the rest of the month."
          points={[
            "Amber at 80%, red when you go over",
            "Spot spending that no budget covers yet",
            "Copy last month's budgets in one click",
          ]}
          preview={<BudgetsPreview month={month} />}
          reverse
          muted
        />
        <Spotlight
          eyebrow="Dashboard"
          title="See where your money went"
          body="Your dashboard shows this month's income, spending and net, the categories you spend most on, and your latest activity."
          points={[
            "Spending by category, largest first",
            "Budgets closest to their limit",
            "Six months of income vs expenses",
          ]}
          preview={<SpendingPreview month={month} />}
        />
        <HowItWorks />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter year={month.slice(0, 4)} />
    </>
  );
}

function Section({
  id,
  muted,
  children,
}: {
  id?: string;
  muted?: boolean;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`scroll-mt-16 ${muted ? "bg-muted/40" : ""}`}>
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        {children}
      </div>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <p className="mb-2 text-sm font-medium text-muted-foreground">{eyebrow}</p>
      <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      {body ? (
        <p className="mt-4 text-lg text-pretty text-muted-foreground">{body}</p>
      ) : null}
    </div>
  );
}

function Hero({ month }: { month: string }) {
  return (
    <section className="relative overflow-hidden border-b">
      {/* Soft background glow in the chart colours */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 mx-auto h-[36rem] max-w-5xl rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--chart-income)_18%,transparent),transparent)] blur-2xl"
      />
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2">
        <div className="flex flex-col items-start gap-6">
          <Badge variant="secondary" className="gap-1.5">
            <PhilippinePesoIcon />
            Made for pesos
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Know where every peso goes.
          </h1>
          <p className="max-w-xl text-lg text-pretty text-muted-foreground">
            Keep your cash, bank accounts and e-wallets in one place. Record
            what you spend, set monthly budgets, and see your month at a
            glance.
          </p>
          <div className="flex flex-wrap gap-3">
            <HomeActions />
          </div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheckIcon className="size-4 shrink-0" />
            No bank or e-wallet logins needed. You decide what you record.
          </p>
        </div>
        <DashboardPreview month={month} />
      </div>
    </section>
  );
}

function Features() {
  return (
    <Section id="features">
      <SectionHeading
        eyebrow="Features"
        title="Everything you need to manage your money"
        body="Simple enough for everyday spending, detailed enough to see the whole picture."
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <li key={feature.title} className="rounded-xl border bg-card p-6">
            <span className="mb-4 flex size-10 items-center justify-center rounded-lg bg-muted">
              <feature.icon className="size-5" />
            </span>
            <h3 className="font-semibold">{feature.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{feature.body}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function Spotlight({
  eyebrow,
  title,
  body,
  points,
  preview,
  reverse,
  muted,
}: {
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  preview: ReactNode;
  reverse?: boolean;
  muted?: boolean;
}) {
  return (
    <Section muted={muted}>
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className={reverse ? "lg:order-2" : ""}>
          <p className="mb-2 text-sm font-medium text-muted-foreground">{eyebrow}</p>
          <h2 className="text-3xl font-semibold tracking-tight text-balance">{title}</h2>
          <p className="mt-4 text-lg text-pretty text-muted-foreground">{body}</p>
          <ul className="mt-6 flex flex-col gap-3">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <CheckIcon className="size-3" />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>
        <div className={reverse ? "lg:order-1" : ""}>{preview}</div>
      </div>
    </Section>
  );
}

function HowItWorks() {
  return (
    <Section id="how-it-works" muted>
      <SectionHeading
        eyebrow="How it works"
        title="Up and running in three steps"
      />
      <ol className="grid gap-4 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.title} className="rounded-xl border bg-card p-6">
            <span className="mb-4 flex size-9 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground tabular-nums">
              {index + 1}
            </span>
            <h3 className="font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

function Faq() {
  return (
    <Section id="faq">
      <SectionHeading eyebrow="FAQ" title="Questions, answered" />
      <Accordion className="mx-auto max-w-2xl">
        {FAQS.map((faq) => (
          <AccordionItem key={faq.q} value={faq.q}>
            <AccordionTrigger>{faq.q}</AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground">{faq.a}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  );
}

function FinalCta() {
  return (
    <section className="px-4 pb-16 sm:px-6 md:pb-24">
      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-6 overflow-hidden rounded-2xl border bg-muted/40 px-6 py-14 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -bottom-32 -z-10 mx-auto h-64 max-w-3xl rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--chart-expense)_16%,transparent),transparent)] blur-2xl"
        />
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Start tracking your pesos today
        </h2>
        <p className="max-w-xl text-pretty text-muted-foreground">
          Set up your accounts in a few minutes and see this month&apos;s
          spending by tonight.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <HomeActions />
        </div>
      </div>
    </section>
  );
}

function SiteFooter({ year }: { year: string }) {
  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-col gap-2">
          <Brand />
          <p className="text-sm text-muted-foreground">
            © {year} Budget Tracker. Made for the Philippines.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {LANDING_SECTIONS.map((section) => (
            <a key={section.href} href={section.href} className="hover:text-foreground">
              {section.label}
            </a>
          ))}
          <Link href="/auth/sign-in" className="hover:text-foreground">
            Sign in
          </Link>
          <Link href="/auth/sign-up" className="hover:text-foreground">
            Create account
          </Link>
        </nav>
      </div>
    </footer>
  );
}
