import { HomeActions } from "@/components/home-actions";

// Placeholder for the public showcase site.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start justify-center gap-6 p-6">
      <h1 className="text-4xl font-semibold tracking-tight">Budget Tracker</h1>
      <p className="text-lg text-muted-foreground">
        Track your budget and manage your expenses in one place.
      </p>
      <div className="flex gap-3">
        <HomeActions />
      </div>
    </main>
  );
}
