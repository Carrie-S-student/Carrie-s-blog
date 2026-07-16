export default function SiteFooter() {
  return (
    <footer className="border-t border-card-border py-10">
      <div className="mx-auto max-w-5xl px-4 text-center">
        <p className="text-sm text-muted">© {new Date().getFullYear()} 我的小站 · 用 Next.js 搭建</p>
      </div>
    </footer>
  );
}
