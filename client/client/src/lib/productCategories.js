const normalizeCategoryText = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[\/_-]+/g, " ")
    .replace(/\s+/g, " ");

const CATEGORY_ALIASES = [
  { key: "produce", aliases: ["produce"] },
  { key: "dairy", aliases: ["dairy"] },
  { key: "meat-seafood", aliases: ["meat seafood", "meat/seafood", "meat-seafood"] },
  { key: "bakery", aliases: ["bakery"] },
  { key: "frozen", aliases: ["frozen"] },
  { key: "pantry", aliases: ["pantry", "pantry dry goods", "pantry/dry goods"] },
  { key: "beverages", aliases: ["beverages", "beverage"] },
  { key: "household", aliases: ["household", "household essentials"] }
];

export const getCategoryKey = (value = "") => {
  const normalized = normalizeCategoryText(value);
  const matched = CATEGORY_ALIASES.find(({ aliases }) =>
    aliases.some((alias) => normalizeCategoryText(alias) === normalized)
  );

  return matched?.key || normalized;
};

export const matchesCategoryFilter = (productCategory, selectedCategory) => {
  const requestedCategory = String(selectedCategory || "").trim();

  if (!requestedCategory || requestedCategory.toLowerCase() === "all") {
    return true;
  }

  return getCategoryKey(productCategory) === getCategoryKey(requestedCategory);
};

export const getProductCategories = (products = []) =>
  Array.from(
    new Set(
      products
        .map((product) => getCategoryKey(product?.category))
        .filter(Boolean)
    )
  );

export const getCategoryIcon = (category = "") => {
  const value = category.toLowerCase();

  if (value.includes("vegetable")) return "bi bi-flower1";
  if (value.includes("fruit")) return "bi bi-apple";
  if (value.includes("dairy")) return "bi bi-cup-straw";
  if (value.includes("bakery")) return "bi bi-basket";
  if (value.includes("beverage") || value.includes("drink")) return "bi bi-cup-hot";
  if (value.includes("snack")) return "bi bi-egg-fried";
  if (value.includes("meat") || value.includes("fish")) return "bi bi-box2-heart";

  return "bi bi-grid";
};
