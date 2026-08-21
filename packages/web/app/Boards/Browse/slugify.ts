// Turn a display name into a URL-safe slug: lowercase, non-alphanumerics
// collapsed to single hyphens, no leading/trailing hyphen.
export function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}
