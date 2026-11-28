import { siteConfig } from "../siteConfig.ts";

export const contentAuthors = {
  ziyeluo: {
    name: "梓叶落",
    avatarUrl: siteConfig.avatarUrl,
    bio: "暂时没有喵",
  },
  codex: {
    name: "哦鲸鲸",
    avatarUrl: "/images/avatars/codex.svg",
    bio: "由 Codex 整理与维护的站点记录。",
  },
} as const;

export type ContentAuthorId = keyof typeof contentAuthors;

export interface ContentAuthorProfile {
  id: ContentAuthorId;
  name: string;
  avatarUrl: string;
  bio: string;
}

export const defaultContentAuthorId: ContentAuthorId = "ziyeluo";

export function resolveContentAuthor(value: unknown): ContentAuthorProfile {
  const id =
    typeof value === "string" && value in contentAuthors
      ? (value as ContentAuthorId)
      : defaultContentAuthorId;

  return {
    id,
    ...contentAuthors[id],
  };
}
