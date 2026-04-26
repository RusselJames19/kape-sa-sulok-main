// Variant size label helper.
export function variantLabel(variant) {
  if (!variant) return "";
  const size = variant.size;
  if (!size || size === "none") return "Regular";
  return size;
}
