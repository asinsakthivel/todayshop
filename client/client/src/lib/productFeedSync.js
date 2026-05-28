const PRODUCT_FEED_EVENT = "todayshop:product-feed-updated";
const PRODUCT_FEED_KEY = "todayshop:product-feed-version";

export const notifyProductFeedUpdated = () => {
  const version = Date.now().toString();
  localStorage.setItem(PRODUCT_FEED_KEY, version);
  window.dispatchEvent(new CustomEvent(PRODUCT_FEED_EVENT, { detail: version }));
};

export const subscribeToProductFeedUpdates = (callback) => {
  const customHandler = () => callback();
  const storageHandler = (event) => {
    if (event.key === PRODUCT_FEED_KEY) callback();
  };

  window.addEventListener(PRODUCT_FEED_EVENT, customHandler);
  window.addEventListener("storage", storageHandler);

  return () => {
    window.removeEventListener(PRODUCT_FEED_EVENT, customHandler);
    window.removeEventListener("storage", storageHandler);
  };
};
