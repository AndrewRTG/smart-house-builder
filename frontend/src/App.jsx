import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MfaSetupPage from "./pages/MfaSetupPage";
import MfaVerifyPage from "./pages/MfaVerifyPage";
import MfaSettingsPage from "./pages/MfaSettingsPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProfilePage from './pages/Profile/ProfilePage';

function HomePage() {
  return <div></div>;
}

function BuilderPage() {
  return <h1 className="p-4">Builder Page</h1>;
}

function ProductsPage() {
  return <h1 className="p-4">Products Page</h1>;
}

function CommunityPage() {
  return <h1 className="p-4">Community Page</h1>;
}

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark";
  });
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
      document.body.classList.remove("light-mode");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.add("light-mode");
      document.body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);
  return (
    <BrowserRouter>
      <div className={`app-wrapper ${darkMode ? "dark-mode" : "light-mode"}`}>
        <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />

        <Routes>

          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/builder" element={<BuilderPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/mfa/setup" element={<MfaSetupPage />} />
          <Route path="/mfa/verify" element={<MfaVerifyPage />} />
          <Route path="/mfa/settings" element={<MfaSettingsPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/profile" element={<ProfilePage darkMode={darkMode} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;