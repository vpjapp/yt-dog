import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">YT-DOG</h1>
      <p className="opacity-80">Track YouTube channels, watch and mark videos.</p>
      <div>
        <Link
          href="/channels"
          className="inline-block rounded bg-foreground text-background px-4 py-2"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
}
