import { useEffect, useState } from "react";
import api from "../../../api/axios.js";
import ProductCard from "../../../components/ProductCard.jsx";

const Wishlist = () => {
  const [items, setItems] = useState([]);
  const load = async () => { const { data } = await api.get("/buyer/wishlist"); setItems(data); };
  useEffect(() => { load(); }, []);
  return (
    <div className="container py-4">
      <h4 className="mb-3">Wishlist</h4>
      <div className="row g-3">
        {items.map((p) => (
          <div className="col-sm-6 col-lg-3" key={p._id}><ProductCard product={p} /></div>
        ))}
      </div>
    </div>
  );
};

export default Wishlist;
