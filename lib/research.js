import "server-only";
import { prisma } from "@/lib/prisma";

export async function getAllResearch() {
  return prisma.research.findMany({
    orderBy: { publishedDate: "desc" },
  });
}

export async function getAllResearchForAdmin() {
  return prisma.research.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function createResearch({ title, publishedDate, journal }) {
  return prisma.research.create({
    data: { title, publishedDate: new Date(publishedDate), journal },
  });
}

export async function updateResearch(id, data) {
  const updateData = { ...data };
  if (data.publishedDate) {
    updateData.publishedDate = new Date(data.publishedDate);
  }
  return prisma.research.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteResearch(id) {
  return prisma.research.delete({ where: { id } });
}
