import { Link } from "@tanstack/react-router";

const apps = [
  {
    to: "/pos",
    title: "POS",
    desc: "Point-of-sale terminal — cashiers & managers.",
    accent: "from-[oklch(0.55_0.13_55)] to-[oklch(0.42_0.10_45)]",
  },
  {
    to: "/inventory",
    title: "Inventory",
    desc: "Stock management on mobile — managers.",
    accent: "from-[oklch(0.62_0.13_75)] to-[oklch(0.48_0.11_60)]",
  },
  {
    to: "/dashboard",
    title: "Dashboard",
    desc: "Sales charts & analytics — owners & managers.",
    accent: "from-[oklch(0.58_0.12_50)] to-[oklch(0.40_0.09_40)]",
  },
  {
    to: "/admin",
    title: "Admin Panel",
    desc: "Users, products, system settings — admin.",
    accent: "from-[oklch(0.50_0.10_45)] to-[oklch(0.30_0.06_40)]",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[oklch(0.97_0.015_75)] text-[oklch(0.25_0.03_50)]">
      <main className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
        <header className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[oklch(0.50_0.08_55)]">
            Phase 1 · Foundation
          </p>
          <h1 className="mt-4 font-serif text-5xl sm:text-6xl font-bold tracking-tight text-[oklch(0.25_0.05_50)]">
            Kape sa Sulok
          </h1>
          <p className="mt-3 text-base sm:text-lg text-[oklch(0.45_0.04_55)]">
            Small Business Management System
          </p>
        </header>

        <section className="mt-14 grid gap-5 sm:grid-cols-2">
          {apps.map((app) => (
            <Link
              key={app.to}
              to={app.to}
              className={`group block rounded-2xl bg-gradient-to-br ${app.accent} p-[1px] shadow-md transition hover:shadow-xl`}
            >
              <div className="rounded-2xl bg-[oklch(0.99_0.01_75)] p-6 sm:p-7 h-full">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-xl font-semibold text-[oklch(0.25_0.05_50)]">
                    {app.title}
                  </h2>
                  <span className="text-[oklch(0.50_0.10_55)] transition group-hover:translate-x-1">
                    →
                  </span>
                </div>
                <p className="mt-2 text-sm text-[oklch(0.45_0.04_55)]">{app.desc}</p>
              </div>
            </Link>
          ))}
        </section>

        <footer className="mt-16 text-center text-xs text-[oklch(0.55_0.04_55)]">
          Backend: PHP + MySQL via XAMPP · Configure API URL & branding in the Admin Panel
        </footer>
      </main>
    </div>
  );
}
