import Link from "next/link";
import ThemeToggle from "@/app/components/ThemeToggle";

const NAV_LINKS = [
  { href: "/", label: "首页" },
  { href: "/learning", label: "学习与输入" },
  { href: "/thinking", label: "思考与输出" },
  { href: "/research", label: "Research" },
  { href: "/about", label: "关于我" },
  { href: "/ask", label: "提问箱" },
];

export default function SiteNav() {
  return (
    <header className="sticky top-0 z-50 bg-background/70 backdrop-blur-sm border-b border-card-border">
      <div className="mx-auto max-w-5xl flex items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-wide text-foreground/95 transition hover:text-accent">
          <span>Carrie&apos;s blog</span>
        </Link>

        <nav className="flex items-center gap-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative px-3 py-1 text-sm text-muted transition hover:text-foreground after:absolute after:bottom-0 after:left-1/2 after:h-[2px] after:w-0 after:-translate-x-1/2 after:bg-accent after:transition-all after:duration-300 hover:after:w-2/3"
            >
              {link.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
