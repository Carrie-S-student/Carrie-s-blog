import { getAdminSettings } from "@/lib/settings";
import SiteSettingsForm from "@/app/admin/(protected)/settings/HeroSettingsForm";

export const metadata = {
  title: "站点设置",
};

export default async function AdminSettingsPage() {
  const settings = await getAdminSettings();

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">站点设置</h1>
      <div className="mt-6 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <SiteSettingsForm settings={settings} />
      </div>
    </div>
  );
}
