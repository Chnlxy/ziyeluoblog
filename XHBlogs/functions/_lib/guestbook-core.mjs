const allowedStatuses = new Set(["pending", "approved", "hidden"]);

export class GuestbookValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "GuestbookValidationError";
  }
}

function text(value) {
  return typeof value === "string" ? value : "";
}

function normalizedLines(value) {
  return value.replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n").trim();
}

function normalizedWebsite(value) {
  const candidate = text(value).trim();
  if (!candidate) return "";
  if (/[<>]/.test(candidate)) {
    throw new GuestbookValidationError("个人网站格式无效");
  }

  let url;
  try {
    url = new URL(candidate);
  } catch {
    throw new GuestbookValidationError(
      "个人网站必须是有效的 HTTP(S) 地址",
    );
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new GuestbookValidationError("个人网站只允许 HTTP(S) 地址");
  }
  if (url.username || url.password) {
    throw new GuestbookValidationError("个人网站不能包含账号密码");
  }
  const normalized = url.toString();
  if (normalized.length > 500) {
    throw new GuestbookValidationError("个人网站不能超过 500 个字符");
  }
  return normalized;
}

export function normalizeGuestbookInput(input) {
  const nickname = text(input?.nickname).trim();
  const content = normalizedLines(text(input?.content));

  if (!nickname) throw new GuestbookValidationError("昵称不能为空");
  if (nickname.length > 30) {
    throw new GuestbookValidationError("昵称不能超过 30 个字符");
  }
  if (!content) throw new GuestbookValidationError("留言内容不能为空");
  if (content.length > 1000) {
    throw new GuestbookValidationError("留言内容不能超过 1000 个字符");
  }
  if (/<[^>]+>/.test(nickname) || /<[^>]+>/.test(content)) {
    throw new GuestbookValidationError("留言不支持 HTML 标签");
  }

  return {
    nickname,
    website: normalizedWebsite(input?.website),
    content,
  };
}

export function validateModerationStatus(status) {
  if (typeof status !== "string" || !allowedStatuses.has(status)) {
    throw new GuestbookValidationError("留言状态无效");
  }
  return status;
}

export function publicMessage(row) {
  return {
    id: row.id,
    nickname: row.nickname,
    website: row.website || "",
    content: row.content,
    createdAt: row.created_at,
  };
}
