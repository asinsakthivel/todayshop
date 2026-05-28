import { useEffect, useState } from "react";
import api from "../../api/axios.js";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";

const Analytics = () => {
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState({
    totalOrders: 0,
    revenue: 0,
    delivered: 0,
    pending: 0,
    products: [],
    revenueTrend: []
  });

  useEffect(() => {
    api.get("/seller/analytics")
      .then(({ data }) => {
        setData({
          totalOrders: data?.totalOrders || 0,
          revenue: data?.revenue || 0,
          delivered: data?.delivered || 0,
          pending: data?.pending || 0,
          products: Array.isArray(data?.products)
            ? data.products
            : [],
          revenueTrend: Array.isArray(data?.revenueTrend)
            ? data.revenueTrend
            : []
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container py-4">
        Loading analytics...
      </div>
    );
  }

  const orderStatusData = [
    { name: "Pending", value: data.pending },
    { name: "Delivered", value: data.delivered }
  ];

  const productSales = (data.products || []).map((p) => ({
    name: p.name || "Product",
    value: p.sales || 0
  }));

  return (
    <div className="container py-4">
      <h3 className="mb-4">Seller Analytics</h3>

      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card p-3">
            <h5>{data.totalOrders}</h5>
            <small>Total Orders</small>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card p-3">
            <h5>₹{data.revenue}</h5>
            <small>Revenue</small>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card p-3">
            <h5>{data.delivered}</h5>
            <small>Delivered</small>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card p-3">
            <h5>{data.pending}</h5>
            <small>Pending</small>
          </div>
        </div>
      </div>

      <div className="card p-4 mb-4">
        <h5>Orders</h5>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={orderStatusData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {productSales.length > 0 && (
        <div className="card p-4">
          <h5>Products</h5>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={productSales}
                dataKey="value"
                nameKey="name"
                outerRadius={150}
                label
              >
                {productSales.map((_, i) => (
                  <Cell key={i} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default Analytics;