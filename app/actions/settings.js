"use server";

import { requireAdmin } from "@/lib/dal";
import { upsertAdminSettings } from "@/lib/settings";

function getString(formData, key) {
  const value = formData.get(key);
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed === "" ? null : trimmed;
}

export async function updateAdminSettingsAction(prevState, formData) {
  try {
    await requireAdmin();

    const heroImage = getString(formData, "heroImage");
    const heroTitle = getString(formData, "heroTitle");
    const heroSubtitle = getString(formData, "heroSubtitle");
    const aboutTitle = getString(formData, "aboutTitle");
    const aboutParagraph1 = getString(formData, "aboutParagraph1");
    const aboutParagraph2 = getString(formData, "aboutParagraph2");
    const aboutPhotoUrl = getString(formData, "aboutPhotoUrl");

    await upsertAdminSettings({
      heroImage,
      heroTitle,
      heroSubtitle,
      aboutTitle,
      aboutParagraph1,
      aboutParagraph2,
      aboutPhotoUrl,
    });

    return { success: true };
  } catch (error) {
    console.error("updateAdminSettingsAction failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "保存失败，请重试。",
    };
  }
}
