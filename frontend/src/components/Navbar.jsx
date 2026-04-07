import { Link } from "react-router-dom";

function Navbar({ darkMode, setDarkMode }) {
  return (
    <nav
      className="navbar navbar-expand-lg px-3 py-3 custom-navbar"
      style={{ backgroundColor: "var(--navbar-bg)" }}
    >
      <div className="container-fluid">
        <Link
          className="navbar-brand fw-bold"
          to="/"
          style={{ color: "var(--text-main)" }}
        >
          Smart House
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
          aria-controls="mainNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
          style={{
            borderColor: "var(--text-main)",
            backgroundColor: "transparent",
          }}
        >
          <span
            className="navbar-toggler-icon"
            style={{
              filter: darkMode ? "invert(1)" : "invert(0)",
            }}
          ></span>
        </button>

        <div className="collapse navbar-collapse" id="mainNavbar">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link
                to="/builder"
                className="nav-link"
                style={{ color: "var(--text-main)" }}
              >
                Builder
              </Link>
            </li>

            <li className="nav-item">
              <Link
                to="/products"
                className="nav-link"
                style={{ color: "var(--text-main)" }}
              >
                Products
              </Link>
            </li>

            <li className="nav-item">
              <Link
                to="/community"
                className="nav-link"
                style={{ color: "var(--text-main)" }}
              >
                Community
              </Link>
            </li>
          </ul>

          <div className="d-flex align-items-center gap-3">
            <Link to="/login" className="navbar-auth-link">
              Login
            </Link>

            <Link to="/register" className="navbar-auth-link">
              Register
            </Link>

            <button
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle theme"
              className="theme-toggle"
              type="button"
            >
              <div
                className={`theme-toggle-knob ${
                  darkMode ? "dark" : "light"
                }`}
              >
                <i
                  className={`bi ${
                    darkMode ? "bi-moon-stars-fill" : "bi-sun-fill"
                  }`}
                ></i>
              </div>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;