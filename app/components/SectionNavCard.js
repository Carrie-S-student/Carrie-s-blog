import Link from "next/link";

const SECTION_INFO = {
  LEARNING: {
    href: "/learning",
    title: "学习与输入",
    description: "记录读过的书、上过的课、踩过的坑，把学到的东西沉淀下来。",
  },
  THINKING: {
    href: "/thinking",
    title: "思考与输出",
    description: "分享一些日常的想法、观察和感悟，欢迎一起讨论。",
  },
};

/**
 * 关于我页面底部的栏目导航卡片。
 * 点击后跳转到 /learning 或 /thinking 对应页面。
 */
export default function SectionNavCard({ section }) {
  const info = SECTION_INFO[section];
  if (!info) return null;

  return (
    <Link
      href={info.href}
      className="group card flex flex-col p-6 transition interactive hover:border-accent/50"
    >
      <h2 className="text-base font-semibold text-foreground transition group-hover:text-accent">
        {info.title}
      </h2>
      <p className="mt-2 text-sm text-muted">{info.description}</p>
      <span className="mt-4 inline-flex items-center text-sm font-medium text-accent">
        去看看
        <svg
          className="ml-1 h-4 w-4 transition group-hover:translate-x-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </span>
    </Link>
  );
}
