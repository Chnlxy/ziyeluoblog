import type { PostSummary } from "./content-types";

export function filterPosts<
  T extends Pick<PostSummary, "title" | "description" | "tags">,
>(posts: T[], query: string): T[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return posts;

  return posts.filter((post) => {
    const searchable = [
      post.title,
      post.description,
      ...post.tags,
    ]
      .join("\n")
      .toLocaleLowerCase();
    return searchable.includes(normalizedQuery);
  });
}
