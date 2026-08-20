"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import {
  createVisitorNote,
  createAdminNote,
  isNoteRateLimited,
  updateNotePosition,
  deleteNote,
  toggleNoteLike,
} from "@/lib/notes";
import { getClientIp } from "@/lib/request-ip";
import { verifySession, getCurrentVisitor } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import {
  NOTE_COLOR_KEYS,
  NOTE_SHAPE_KEYS,
  NOTE_MAX_CONTENT,
  NOTE_MAX_NICKNAME,
} from "@/lib/note-styles";

export async function submitNote(prevState, formData) {
  const nickname = (formData.get("nickname") || "").toString().trim();
  const content = (formData.get("content") || "").toString().trim();
  const color = (formData.get("color") || "").toString();
  const shape = (formData.get("shape") || "").toString();

  if (nickname.length > NOTE_MAX_NICKNAME) {
    return { error: `昵称太长了，最多 ${NOTE_MAX_NICKNAME} 个字。` };
  }
  if (!content) {
    return { error: "纸条内容不能为空。" };
  }
  if (content.length > NOTE_MAX_CONTENT) {
    return { error: `纸条太长了，最多 ${NOTE_MAX_CONTENT} 个字，几句话的感悟刚刚好。` };
  }
  if (!NOTE_COLOR_KEYS.includes(color)) {
    return { error: "请选择纸条颜色。" };
  }
  if (!NOTE_SHAPE_KEYS.includes(shape)) {
    return { error: "请选择纸条形状。" };
  }

  const ip = await getClientIp();
  const session = await verifySession();

  // 博主在前台写纸条：直接公开并带博主标记
  if (session?.role === "admin") {
    const note = await createAdminNote({ nickname, content, color, shape });
    revalidatePath("/wall");
    return { success: true, id: note.id };
  }

  // 游客 / 访客：先限流再提交，提交后直接公开显示（留言墙无需密码，人人可写）
  if (await isNoteRateLimited(ip)) {
    return { error: "贴得太频繁了，过一会儿再试试。" };
  }

  let visitorId = null;
  if (session?.type === "visitor") {
    const visitor = await getCurrentVisitor();
    if (!visitor) {
      return { error: "登录已过期，请重新验证后再留言。" };
    }
    visitorId = visitor.id;
  }

  const note = await createVisitorNote({
    visitorId,
    nickname,
    content,
    color,
    shape,
    ip,
  });
  revalidatePath("/wall");
  return { success: true, id: note.id };
}

/**
 * 放置/拖拽后保存纸条位置。
 * 权限：纸条作者（visitorId 匹配当前访客）或管理员可保存；
 * 其他访客拖动只在自己浏览器里临时生效，这里不会保存。
 */
export async function placeNote(id, posX, posY) {
  if (typeof posX !== "number" || typeof posY !== "number") {
    return { error: "位置不合法。" };
  }
  if (!Number.isFinite(posX) || !Number.isFinite(posY)) {
    return { error: "位置不合法。" };
  }
  if (posX < 0 || posX > 100 || posY < 0 || posY > 100) {
    return { error: "位置超出范围。" };
  }

  const note = await prisma.note.findUnique({
    where: { id },
    select: { id: true, visitorId: true, authorType: true, status: true, createdAt: true },
  });
  if (!note) {
    return { error: "纸条不存在。" };
  }

  const session = await verifySession();

  const isAdmin = session?.role === "admin";
  const isOwner = session?.type === "visitor" && session.visitorId === note.visitorId;
  // 未登录游客刚贴的纸条（创建后 10 分钟内）：允许放置位置，
  // 其他访客的纸条（visitorId 为 null）不可被挪动，防止互相移动位置
  const isRecentAnonymous =
    !session &&
    note.visitorId === null &&
    note.status === "PUBLISHED" &&
    Date.now() - note.createdAt.getTime() < 10 * 60 * 1000;

  if (!isAdmin && !isOwner && !isRecentAnonymous) {
    return { error: session ? "只能移动自己贴的纸条。" : "登录已过期，请重新验证。" };
  }

  await updateNotePosition({ id, posX, posY });
  revalidatePath("/wall");
  return { success: true };
}

// 拿不到 IP 时的点赞身份标识 cookie（本地开发 / 无代理环境），有效期 1 年
const ANON_LIKE_COOKIE = "wall-anon-like-id";

/**
 * 点赞纸条。无需登录，人人可赞；同一身份对同一纸条只能赞一次，
 * 重复点击不会取消（点赞数只增不减），不同访客各自 +1。
 * 身份优先用 IP；拿不到 IP（如本地开发）时退回持久 cookie，保证功能可用。
 * 只允许给已公开的纸条点赞。
 */
export async function toggleNoteLikeAction(noteId) {
  if (typeof noteId !== "string" || !noteId) {
    return { error: "纸条不存在。" };
  }
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    select: { id: true, status: true },
  });
  if (!note || note.status !== "PUBLISHED") {
    return { error: "纸条不存在。" };
  }
  let ip = await getClientIp();
  // 回环地址（本地开发所有请求都是 ::1/127.0.0.1）无法区分访客，
  // 与拿不到 IP 一样退回持久 cookie 身份，避免本地所有人都被当成同一个人。
  const LOOPBACK_IPS = new Set(["::1", "127.0.0.1", "::ffff:127.0.0.1", "localhost"]);
  if (!ip || LOOPBACK_IPS.has(ip)) {
    const cookieStore = await cookies();
    ip = cookieStore.get(ANON_LIKE_COOKIE)?.value;
    if (!ip) {
      ip = `anon-${crypto.randomUUID()}`;
      cookieStore.set(ANON_LIKE_COOKIE, ip, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      });
    }
  }
  const result = await toggleNoteLike({ noteId, ip });
  revalidatePath("/wall");
  return { success: true, ...result };
}

/**
 * 编辑纸条内容（昵称 / 内容 / 颜色 / 形状）。
 * 权限：纸条作者（visitorId 匹配当前访客）或管理员可编辑，其他人只读。
 */
export async function updateNote(id, data) {
  const nickname = (data?.nickname || "").toString().trim();
  const content = (data?.content || "").toString().trim();
  const color = (data?.color || "").toString();
  const shape = (data?.shape || "").toString();

  if (nickname.length > NOTE_MAX_NICKNAME) {
    return { error: `昵称太长了，最多 ${NOTE_MAX_NICKNAME} 个字。` };
  }
  if (!content) {
    return { error: "纸条内容不能为空。" };
  }
  if (content.length > NOTE_MAX_CONTENT) {
    return { error: `纸条太长了，最多 ${NOTE_MAX_CONTENT} 个字，几句话的感悟刚刚好。` };
  }
  if (!NOTE_COLOR_KEYS.includes(color)) {
    return { error: "请选择纸条颜色。" };
  }
  if (!NOTE_SHAPE_KEYS.includes(shape)) {
    return { error: "请选择纸条形状。" };
  }

  const session = await verifySession();
  if (!session) {
    return { error: "登录已过期，请重新验证。" };
  }

  const note = await prisma.note.findUnique({
    where: { id },
    select: { id: true, visitorId: true },
  });
  if (!note) {
    return { error: "纸条不存在。" };
  }

  const isAdmin = session.role === "admin";
  const isOwner = session.type === "visitor" && session.visitorId === note.visitorId;
  if (!isAdmin && !isOwner) {
    return { error: "只能编辑自己贴的纸条。" };
  }

  const updated = await prisma.note.update({
    where: { id },
    data: { nickname: nickname || null, content, color, shape },
  });
  revalidatePath("/wall");
  return { success: true, note: { ...updated, createdAt: updated.createdAt.toISOString() } };
}

/**
 * 删除纸条。权限：纸条作者或管理员，其他人无权删除。
 */
export async function deleteOwnNote(id) {
  const session = await verifySession();
  if (!session) {
    return { error: "登录已过期，请重新验证。" };
  }

  const note = await prisma.note.findUnique({
    where: { id },
    select: { id: true, visitorId: true },
  });
  if (!note) {
    return { error: "纸条不存在。" };
  }

  const isAdmin = session.role === "admin";
  const isOwner = session.type === "visitor" && session.visitorId === note.visitorId;
  if (!isAdmin && !isOwner) {
    return { error: "只能删除自己贴的纸条。" };
  }

  await deleteNote(id);
  revalidatePath("/wall");
  return { success: true };
}
