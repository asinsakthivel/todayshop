import Address from "../models/Address.js";

export const addAddress = async (req, res) => {
  const { fullName, phone, line, city, state, pincode, isDefault } = req.body;
  const data = { fullName, phone, line, city, state, pincode, user: req.user.id };
  if (isDefault) {
    await Address.updateMany({ user: req.user.id }, { isDefault: false });
    data.isDefault = true;
  }
  const address = await Address.create(data);
  res.status(201).json(address);
};

export const getDefaultAddress = async (req, res) => {
  const address = await Address.findOne({ user: req.user.id, isDefault: true }) || await Address.findOne({ user: req.user.id });
  if (!address) return res.status(404).json({ message: "No address" });
  res.json(address);
};

export const listAddresses = async (req, res) => {
  const addresses = await Address.find({ user: req.user.id }).sort({ isDefault: -1, updatedAt: -1 });
  res.json(addresses);
};

export const updateAddress = async (req, res) => {
  const { fullName, phone, line, city, state, pincode, isDefault } = req.body;
  const update = { fullName, phone, line, city, state, pincode };
  if (isDefault) {
    await Address.updateMany({ user: req.user.id }, { isDefault: false });
    update.isDefault = true;
  }
  const address = await Address.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, update, { new: true });
  if (!address) return res.status(404).json({ message: "Not found" });
  res.json(address);
};

export const deleteAddress = async (req, res) => {
  const removed = await Address.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!removed) return res.status(404).json({ message: "Not found" });
  res.json({ message: "Deleted" });
};
