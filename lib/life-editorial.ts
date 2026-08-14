const EDITORIAL_CATEGORIES = new Set(["baking", "craft"]);

export function hasEditorialCovers(category: string): boolean {
  return EDITORIAL_CATEGORIES.has(category);
}

export function editorialCover(category: string, slug: string): string {
  return `/life/${category}/editorial/${slug}-editorial.webp`;
}
