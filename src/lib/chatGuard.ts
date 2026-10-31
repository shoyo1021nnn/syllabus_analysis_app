/**
 * /api/chat の入力検証と簡易レート制限（サーバー専用）。
 *
 * 上限値はすべて環境変数で調整できる（未設定・不正値のときは既定値）。
 * 環境変数の一覧は CLAUDE.md / README.md の環境変数表を参照。
 */

function readPositiveInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const chatLimits = {
  /** 1 リクエストで受け付けるメッセージ数の上限（超えたら 400） */
  maxMessages: readPositiveInt("CHAT_MAX_MESSAGES", 40),
  /** モデルへ渡す直近メッセージ数（これより古い履歴は切り捨てる） */
  maxHistory: readPositiveInt("CHAT_MAX_HISTORY", 20),
  /** ユーザーメッセージ 1 件あたりの最大文字数（超えたら 400） */
  maxMessageChars: readPositiveInt("CHAT_MAX_MESSAGE_CHARS", 4000),
  /** context を JSON 化したときの最大バイト数（超えたら 400） */
  maxContextBytes: readPositiveInt("CHAT_MAX_CONTEXT_BYTES", 32 * 1024),
  /** レート制限：ウィンドウ内に許可するリクエスト数（IP 単位） */
  rateLimitMax: readPositiveInt("CHAT_RATE_LIMIT_MAX", 20),
  /** レート制限：ウィンドウの長さ（秒） */
  rateLimitWindowSec: readPositiveInt("CHAT_RATE_LIMIT_WINDOW_SEC", 60),
};

/**
 * アシスタントの過去回答は analysis-actions の JSON を含み長くなるため、
 * ユーザーメッセージより緩い上限（maxMessageChars の 4 倍）にする。
 */
const ASSISTANT_CHARS_MULTIPLIER = 4;

// ------------------------------------------------------------
// 入力検証
// ------------------------------------------------------------

export interface ChatMessageForModel {
  role: "user" | "assistant";
  content: string;
}

export type ChatValidationResult =
  | {
      ok: true;
      messages: ChatMessageForModel[];
      context: Record<string, unknown> | undefined;
      language: "ja" | "en";
    }
  | { ok: false; error: string; message: string };

function fail(error: string, message: string): ChatValidationResult {
  return { ok: false, error, message };
}

/** UIMessage（parts 形式）または旧形式（content）からテキストを取り出す */
function extractText(m: Record<string, unknown>): string | null {
  if (typeof m.content === "string" && m.content.length > 0) return m.content;
  if (Array.isArray(m.parts)) {
    return m.parts
      .map((p) =>
        p && typeof p === "object" && typeof (p as { text?: unknown }).text === "string"
          ? (p as { text: string }).text
          : ""
      )
      .join("");
  }
  if (typeof m.content === "string") return m.content;
  return null;
}

export function validateChatRequest(body: unknown): ChatValidationResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return fail("invalid_body", "Request body must be a JSON object.");
  }
  const { messages, context, language } = body as Record<string, unknown>;

  if (!Array.isArray(messages) || messages.length === 0) {
    return fail("invalid_messages", "`messages` must be a non-empty array.");
  }
  if (messages.length > chatLimits.maxMessages) {
    return fail(
      "too_many_messages",
      `Too many messages (max ${chatLimits.maxMessages}).`
    );
  }

  const parsed: ChatMessageForModel[] = [];
  for (const raw of messages) {
    if (!raw || typeof raw !== "object") {
      return fail("invalid_messages", "Each message must be an object.");
    }
    const m = raw as Record<string, unknown>;
    // system ロールなど、クライアントからのプロンプト注入につながるロールは受け付けない
    if (m.role !== "user" && m.role !== "assistant") {
      return fail("invalid_role", "Message role must be 'user' or 'assistant'.");
    }
    const text = extractText(m);
    if (text === null) {
      return fail("invalid_messages", "Message has no text content.");
    }
    const limit =
      m.role === "user"
        ? chatLimits.maxMessageChars
        : chatLimits.maxMessageChars * ASSISTANT_CHARS_MULTIPLIER;
    if (text.length > limit) {
      return fail("message_too_long", `Message is too long (max ${limit} characters).`);
    }
    parsed.push({ role: m.role, content: text });
  }

  if (context !== undefined && context !== null) {
    if (typeof context !== "object" || Array.isArray(context)) {
      return fail("invalid_context", "`context` must be an object.");
    }
    const bytes = new TextEncoder().encode(JSON.stringify(context)).length;
    if (bytes > chatLimits.maxContextBytes) {
      return fail(
        "context_too_large",
        `Context is too large (max ${chatLimits.maxContextBytes} bytes).`
      );
    }
  }

  // 直近 N 件だけをモデルに渡す。先頭がアシスタント回答にならないよう、ユーザー発話から始める
  let trimmed = parsed.slice(-chatLimits.maxHistory);
  const firstUser = trimmed.findIndex((m) => m.role === "user");
  trimmed = firstUser >= 0 ? trimmed.slice(firstUser) : [];
  if (trimmed.length === 0) {
    return fail("invalid_messages", "At least one user message is required.");
  }

  return {
    ok: true,
    messages: trimmed,
    context: (context as Record<string, unknown> | null | undefined) ?? undefined,
    language: language === "en" ? "en" : "ja",
  };
}

// ------------------------------------------------------------
// 簡易レート制限（IP 単位・メモリ内・スライディングウィンドウ）
// ------------------------------------------------------------
//
// 注意：状態はこのサーバープロセスのメモリにしか存在しない。
// - 学内 VM（PM2 の単一プロセス）では全リクエストがこの Map を共有するため、想定どおりに効く。
//   ただし再起動（deploy.sh の pm2 restart など）でカウントはリセットされる。
// - Vercel のサーバーレス環境では、リクエストごとに別インスタンスが起動・破棄されうるため
//   カウントがインスタンス間で共有されず、厳密には効かない（ベストエフォートの抑止にとどまる）。
//   厳密な制限が必要なら、Vercel Firewall のレート制限や Upstash Redis などの外部ストアを使う。
// - VM では、Nginx の limit_req による制限も併用する（docs/nginx-rate-limit.md）。

const requestLog = new Map<string, number[]>();
let lastSweep = 0;

/** 古いエントリを定期的に掃除して、Map が無制限に大きくならないようにする */
function sweep(now: number, windowMs: number) {
  if (now - lastSweep < windowMs) return;
  lastSweep = now;
  for (const [ip, times] of requestLog) {
    if (times.length === 0 || now - times[times.length - 1] >= windowMs) {
      requestLog.delete(ip);
    }
  }
}

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSec: number };

export function checkRateLimit(ip: string, now: number = Date.now()): RateLimitResult {
  const windowMs = chatLimits.rateLimitWindowSec * 1000;
  sweep(now, windowMs);

  const times = (requestLog.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (times.length >= chatLimits.rateLimitMax) {
    requestLog.set(ip, times);
    const retryAfterMs = windowMs - (now - times[0]);
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
  }
  times.push(now);
  requestLog.set(ip, times);
  return { ok: true, remaining: chatLimits.rateLimitMax - times.length };
}

/**
 * クライアント IP を取得する。
 * - Vercel：x-forwarded-for はプラットフォームが設定するため先頭がクライアント IP。
 * - 学内 VM：Nginx で X-Forwarded-For を $remote_addr で上書きする前提
 *   （$proxy_add_x_forwarded_for だとクライアントが送った値が先頭に残り、偽装できてしまう）。
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}
