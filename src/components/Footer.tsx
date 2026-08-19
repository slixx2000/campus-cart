import Link from "next/link";

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/about", label: "Safety" },
  { href: "/browse", label: "Marketplace" },
  { href: "/downloads", label: "Mobile App" },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-6 px-4 py-10 text-center md:flex-row md:justify-between md:px-12 md:text-left">
        <span className="text-lg font-bold tracking-tight text-fg">
          CampusCart
        </span>

        <nav className="flex flex-wrap items-center justify-center gap-6">
          {LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-muted transition-colors hover:text-fg"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="text-xs text-muted">
          © {new Date().getFullYear()} CampusCart Zambia. Built for students, by
          students. 🇿🇲
        </p>
      </div>
    </footer>
  );
}
