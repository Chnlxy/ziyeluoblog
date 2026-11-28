import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { siteConfig } from "../siteConfig.ts";
import { resolveContentAuthor } from "../data/authors.ts";
import type { MomentSummary, PostSummary } from "./content-types";

function markdownFiles(directory: string) {
  if (!fs.existsSync(directory)) return [];

  return fs
    .readdirSync(directory)
    .filter((fileName) => fileName.endsWith(".md"));
}

export function getPosts(): PostSummary[] {
  const postsDirectory = path.join(process.cwd(), "posts");

  return markdownFiles(postsDirectory)
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, "");
      const filePath = path.join(postsDirectory, fileName);
      const { data } = matter(fs.readFileSync(filePath, "utf8"));

      return {
        slug,
        title: data.title || "无标题",
        description: data.description || "",
        date: data.date || "",
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        cover: data.cover || siteConfig.defaultPostCover,
        author: resolveContentAuthor(data.author),
      };
    })
    .sort((a, b) => {
      const dateDiff =
        new Date(b.date).getTime() - new Date(a.date).getTime();
      return Number.isNaN(dateDiff) || dateDiff === 0
        ? b.slug.localeCompare(a.slug)
        : dateDiff;
    });
}

export function getMoments(): MomentSummary[] {
  const momentsDirectory = path.join(process.cwd(), "moments");

  return markdownFiles(momentsDirectory)
    .map((fileName) => {
      const id = fileName.replace(/\.md$/, "");
      const filePath = path.join(momentsDirectory, fileName);
      const { data, content } = matter(fs.readFileSync(filePath, "utf8"));

      return {
        id,
        date: data.date || "",
        location: data.location || "",
        images: Array.isArray(data.images) ? data.images.map(String) : [],
        content: content.trim(),
        author: resolveContentAuthor(data.author),
      };
    })
    .sort((a, b) => {
      const dateDiff =
        new Date(b.date).getTime() - new Date(a.date).getTime();
      return Number.isNaN(dateDiff) || dateDiff === 0
        ? b.id.localeCompare(a.id)
        : dateDiff;
    });
}

export function getMoment(id: string): MomentSummary | null {
  return getMoments().find((moment) => moment.id === id) ?? null;
}
