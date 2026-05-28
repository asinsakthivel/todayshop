import Category from "../models/Category.js";

export const createCategory = async (req, res) => {
  res.status(400).json({
    message: "Manual category creation disabled"
  });
};

export const getCategories = async (req, res) => {
  try {
    const categories = [
      {
        _id: "1",
        name: "produce",
        displayName: "Produce",
        icon: "bi-basket"
      },
      {
        _id: "2",
        name: "dairy",
        displayName: "Dairy",
        icon: "bi-cup-straw"
      },
      {
        _id: "3",
        name: "meat-seafood",
        displayName: "Meat/Seafood",
        icon: "bi-egg-fried"
      },
      {
        _id: "4",
        name: "bakery",
        displayName: "Bakery",
        icon: "bi-box"
      },
      {
        _id: "5",
        name: "frozen",
        displayName: "Frozen",
        icon: "bi-snow"
      },
      {
        _id: "6",
        name: "pantry",
        displayName: "Pantry/Dry Goods",
        icon: "bi-archive"
      },
      {
        _id: "7",
        name: "beverages",
        displayName: "Beverages",
        icon: "bi-cup-hot"
      },
      {
        _id: "8",
        name: "household",
        displayName: "Household Essentials",
        icon: "bi-house"
      }
    ];

    res.json(categories);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};