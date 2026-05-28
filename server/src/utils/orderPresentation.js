export const DELIVERY_CHARGE = 10;

export const formatAddress = (address = {}) => (
  [
    address.street,
    address.city,
    address.state,
    address.pincode
  ]
    .filter(Boolean)
    .join(", ")
);

export const getPrimaryOrderItem = (order = {}) => {
  if (order.productId || order.productName || order.productImage) {
    return {
      productId: order.productId,
      name: order.productName,
      image: order.productImage,
      quantity: order.quantity || 1,
      price: order.productPrice || 0
    };
  }

  const firstItem = order.items?.[0] || {};
  return {
    productId: firstItem.productId,
    name: firstItem.name || "Order item",
    image: firstItem.image || "",
    quantity: firstItem.quantity || 1,
    price: firstItem.price || 0
  };
};

export const toOrderSummary = (order = {}) => {
  const primaryItem = getPrimaryOrderItem(order);
  const normalizedSubTotal = Number(order.subTotal ?? order.totalAmount ?? 0);
  const deliveryCharge = Number(order.deliveryCharge ?? DELIVERY_CHARGE);
  const totalAmount = Number(order.totalAmount ?? normalizedSubTotal + deliveryCharge);

  return {
    ...order,
    productId: primaryItem.productId || null,
    productName: primaryItem.name,
    productImage: primaryItem.image,
    quantity: order.quantity || primaryItem.quantity || 1,
    productPrice: Number(order.productPrice ?? primaryItem.price ?? 0),
    subTotal: normalizedSubTotal,
    deliveryCharge,
    totalAmount,
    customerName: order.customerName || order.buyerId?.name || "Customer",
    address: order.address || formatAddress(order.deliveryAddress),
    phone: order.phone || order.buyerId?.phone || "",
    orderDate: order.createdAt
  };
};
