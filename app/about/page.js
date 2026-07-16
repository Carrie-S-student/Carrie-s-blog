import { getAdminSettings } from "@/lib/settings";
import AboutPhoto from "@/app/components/AboutPhoto";
import AboutBio from "@/app/components/AboutBio";
import SectionNavCard from "@/app/components/SectionNavCard";
import ContactCard from "@/app/components/ContactCard";

export const metadata = {
  title: "关于我",
  description: "关于站长的一些介绍",
};

export default async function AboutPage() {
  const settings = await getAdminSettings();

  const aboutTitle = settings?.aboutTitle || "关于我";
  const aboutParagraph1 =
    settings?.aboutParagraph1 ||
    "你好，我是这个小站的主人。这里记录我在学习路上的笔记，以及生活里零零碎碎的思考，欢迎你常来看看，也欢迎在文章下面留言，或者去「提问箱」找我聊聊。";
  const aboutParagraph2 =
    settings?.aboutParagraph2 ||
    "这段介绍文字是示例内容，去后台站点设置里修改这里的文字，就可以改成你自己想说的话啦。";

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      {/* 左侧照片 + 右侧文字 */}
      <div className="flex flex-col gap-8 sm:flex-row">
        <AboutPhoto aboutPhotoUrl={settings?.aboutPhotoUrl || null} />
        <AboutBio
          title={aboutTitle}
          paragraph1={aboutParagraph1}
          paragraph2={aboutParagraph2}
        />
      </div>

      {/* 学习与输入 / 思考与输出 —— 可点击跳转的导航卡片 */}
      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <SectionNavCard section="LEARNING" />
        <SectionNavCard section="THINKING" />
      </div>

      {/* 联系我 */}
      <ContactCard />
    </div>
  );
}
