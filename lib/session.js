import { SignJWT, jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "blog_session";
const ADMIN_SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 管理员会话：7 天
const VISITOR_SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 访客会话：30 天

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "缺少 SESSION_SECRET 环境变量，请在 .env 里设置一个随机字符串（可用 `openssl rand -base64 32` 生成）。"
    );
  }
  return new TextEncoder().encode(secret);
}

function signToken(payload, durationSeconds) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${durationSeconds}s`)
    .sign(getSecretKey());
}

/**
 * 生成管理员会话 token（payload: { role: "admin" }）。
 */
export async function createSessionToken() {
  return signToken({ role: "admin" }, ADMIN_SESSION_DURATION_SECONDS);
}

/**
 * 生成访客会话 token（payload: { type: "visitor", visitorId }）。
 */
export async function createVisitorToken(visitorId) {
  return signToken({ type: "visitor", visitorId }, VISITOR_SESSION_DURATION_SECONDS);
}

/**
 * 校验会话 token 是否有效，无效/过期返回 null。
 */
export async function verifySessionToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload;
  } catch {
    return null;
  }
}

export {
  SESSION_COOKIE_NAME,
  ADMIN_SESSION_DURATION_SECONDS,
  VISITOR_SESSION_DURATION_SECONDS,
};
