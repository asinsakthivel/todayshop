import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios.js";
import { getCategoryIcon } from "../lib/productCategories.js";

const ALL_CATEGORY = {
  _id: "all",
  name: "all",
  displayName: "All"
};

const getCategoryLabel = (category) =>
  category?.displayName || category?.name || "Category";

const getCategoryIconClass = (category) => {
  const savedIcon = String(category?.icon || "").trim();

  if (savedIcon.startsWith("bi ")) return savedIcon;
  if (savedIcon.startsWith("bi-")) return `bi ${savedIcon}`;

  return getCategoryIcon(getCategoryLabel(category));
};

const BuyerCategorySubnav = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const selectedCategory = (
    searchParams.get("category") || "all"
  ).toLowerCase();

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/categories");
        setCategories(data || []);
      } catch (error) {
        console.error("Failed to load categories", error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const visibleCategories = [ALL_CATEGORY, ...categories];

  const handleSelect = (categoryName) => {
    const params = new URLSearchParams(searchParams);

    if (categoryName === "all") {
      params.delete("category");
    } else {
      params.set(
        "category",
        String(categoryName).trim().toLowerCase()
      );
    }

    navigate({
      pathname: location.pathname,
      search: params.toString() ? `?${params.toString()}` : ""
    });
  };

  return (
    <div className="buyer-category-subnav-shell">
      <div className="container-fluid px-2 px-md-4 px-lg-5">
        <div className="buyer-category-subnav-row">
          {(loading
            ? [ALL_CATEGORY, ALL_CATEGORY, ALL_CATEGORY]
            : visibleCategories
          ).map((category, index) => {
            const isLoadingCard = loading;

            const key = isLoadingCard
              ? `loading-${index}`
              : category._id;

            const isActive =
              !isLoadingCard &&
              selectedCategory ===
                String(category.name).toLowerCase();

            return (
              <button
                key={key}
                type="button"
                className={`buyer-category-subnav-card ${
                  isActive ? "active" : ""
                }`}
                onClick={() =>
                  !isLoadingCard &&
                  handleSelect(category.name)
                }
              >
                <div className="buyer-category-subnav-media">
                  {category.imageUrl ? (
                    <img
                      src={category.imageUrl}
                      alt={getCategoryLabel(category)}
                      className="buyer-category-subnav-image"
                    />
                  ) : (
                    <div className="buyer-category-subnav-fallback">
                      <i
                        className={
                          category.name === "all"
                            ? "bi bi-grid-3x3-gap"
                            : getCategoryIconClass(category)
                        }
                      ></i>
                    </div>
                  )}
                </div>

                <span className="buyer-category-subnav-label">
                  {isLoadingCard
                    ? "Loading..."
                    : getCategoryLabel(category)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BuyerCategorySubnav;