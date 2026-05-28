import { useNavigate } from "react-router-dom";

const DashboardUser = () => {
  const navigate = useNavigate();

  const cards = [
    {
      icon: "bi bi-basket3",
      title: "Browse Fresh Groceries",
      description: "Explore the latest products across categories and add them to your cart in one click.",
      action: () => navigate("/buyer"),
      button: "Start shopping",
    },
    {
      icon: "bi bi-truck",
      title: "Track Your Orders",
      description: "View your recent purchases, order status, and delivery updates in one place.",
      action: () => navigate("/buyer/orders"),
      button: "View orders",
    },
  ];

  return (
    <div className="dashboard-user-page">
      <div className="row g-3">
        {cards.map((card) => (
          <div key={card.title} className="col-12 col-md-6 col-xl-4">
            <div className="card h-100 shadow-sm border-0 rounded-4 overflow-hidden">
              <div className="card-body d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center mb-3 gap-3">
                    <span className="badge bg-primary rounded-circle p-3 shadow-sm">
                      <i className={`${card.icon} fs-5 text-white`} />
                    </span>
                    <h6 className="card-title fw-semibold mb-0">{card.title}</h6>
                  </div>
                  <p className="card-text text-muted">{card.description}</p>
                </div>
                <button className="btn btn-primary mt-3 align-self-start" onClick={card.action}>
                  {card.button}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardUser;
