import { SignJWT, jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "blog_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 天

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "缺少 SESSION_SECRET 环境变量，请在 .env 里设置一个随机字符串（可用 `openssl rand -base64 32` 生成）。"
    );
  }
  return new TextEncoder().encode(secret);
}

/**
 * 生成一个签名的会话 token，payload 里只放最少信息（是否为管理员）。
 */
export async function createSessionToken() {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
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

export { SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS };
