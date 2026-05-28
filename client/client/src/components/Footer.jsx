import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Footer = () => {
  const { role } = useAuth();
  const shopLink = role === "buyer" ? "/buyer" : "/products";

  if (role && role !== "buyer") {
    return null;
  }

  return (
    <footer className="site-footer">
      <div className="site-footer-download-wrap">
        <div className="container-fluid px-2 px-md-4 px-lg-5">
          <div className="site-footer-download">
            <div>
              <h2 className="site-footer-download-title">
                For Better Experience Download Today Shop App
              </h2>
              <p className="site-footer-download-copy">
                Discover fresh groceries, live delivery updates, and faster repeat ordering in one place.
              </p>
            </div>

            <div className="site-footer-download-actions">
              <a href="#" className="store-badge" aria-label="Download on Google Play">
                <span className="store-badge-label">Get it on</span>
                <strong>Google Play</strong>
              </a>
              <a href="#" className="store-badge" aria-label="Download on the App Store">
                <span className="store-badge-label">Download on the</span>
                <strong>App Store</strong>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="site-footer-main">
        <div className="site-footer-download">
          <div className="container-fluid px-2 px-md-4 px-lg-5">
            <div className="site-footer-shell">
              <div>
                <div className="site-footer-brand">
                  <img
                    src="/groceries-svgrepo-com.svg"
                    alt="Today Shop logo"
                    className="site-footer-logo"
                  />
                  <span>Today Shop.</span>
                </div>
                <p className="site-footer-copy">
                  Fresh groceries, seller-managed inventory, and delivery tracking in one connected marketplace for everyday shopping.
                </p>
                <div className="site-footer-socials">
                  <a href="#" aria-label="Facebook" className="site-footer-social">
                    <i className="bi bi-facebook" />
                  </a>
                  <a href="#" aria-label="Twitter" className="site-footer-social">
                    <i className="bi bi-twitter-x" />
                  </a>
                  <a href="#" aria-label="LinkedIn" className="site-footer-social">
                    <i className="bi bi-linkedin" />
                  </a>
                  <a href="#" aria-label="Instagram" className="site-footer-social">
                    <i className="bi bi-instagram" />
                  </a>
                </div>
              </div>

              <div>
                <div className="site-footer-title">Company</div>
                <div className="site-footer-links">
                  <Link to={shopLink}>Home</Link>
                  <Link to="/products">Products</Link>
                  <Link to="/login">Login</Link>
                  <span>Privacy Policy</span>
                </div>
              </div>

              <div>
                <div className="site-footer-title">Get in Touch</div>
                <div className="site-footer-links">
                  <span>+91 91599 99999</span>
                  <Link to="mailto:getstarttodayshop@gmail.com">getstarttodayshop@gmail.com</Link>
                  <span>Mon-Sun, 7:00 AM - 10:00 PM</span>
                </div>
              </div>
            </div>

            <div className="site-footer-bottom">
              Copyright 2026 @ TodayShop.com - All Right Reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
