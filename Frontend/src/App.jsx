import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect, lazy, Suspense } from "react";
import Navbar from "./components/Navbar";
import ErrorBanner from "./components/ErrorBanner";
import { ErrorProvider } from "./context/ErrorContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MfaSetupPage from "./pages/MfaSetupPage";
import MfaVerifyPage from "./pages/MfaVerifyPage";
import MfaSettingsPage from "./pages/MfaSettingsPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProfilePage from "./pages/Profile/ProfilePage";
import CommunityPage from "./pages/CommunityPage";
import SetupDetailPage from "./pages/SetupDetailPage";
import ArticleDetailPage from "./pages/ArticleDetailPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import NotFoundPage from "./pages/NotFoundPage";
import OAuthCallbackPage from "./pages/OAuthCallbackPage";
import ProtectedRoute from "./components/ProtectedRoute";
import ProductsPage from "./pages/CatalogPage";
import './App.css';

const BuilderPage = lazy(() => import("./pages/BuilderPage"));

function HomePage() {
  return <div></div>;
}

function BuilderLoading({ darkMode }) {
  return (
    <div className={`container-fluid py-5 ${darkMode ? "text-light" : "text-dark"}`}>
      <div className="text-center">
        <h1 className="h4 mb-2">Se incarca builderul...</h1>
        <p className="mb-0 opacity-75">Pregatesc modulele integrate pentru builder.</p>
      </div>
    </div>
  );
}

function AppContent({ darkMode, setDarkMode }) {
  return (
    <ErrorProvider>
      <div className={`app-wrapper ${darkMode ? "dark-mode" : "light-mode"}`}>
        <ErrorBanner />
        <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/builder"
            element={
              <Suspense fallback={<BuilderLoading darkMode={darkMode} />}>
                <BuilderPage darkMode={darkMode} setDarkMode={setDarkMode} />
              </Suspense>
            }
          />
          <Route path="/products" element={<ProductsPage darkMode={darkMode} />} />
          <Route path="/community" element={<CommunityPage darkMode={darkMode} />} />
          <Route path="/mfa/verify" element={<MfaVerifyPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<ProfilePage darkMode={darkMode} />} />
            <Route path="/mfa/setup" element={<MfaSetupPage />} />
            <Route path="/mfa/settings" element={<MfaSettingsPage />} />
          </Route>
          <Route path="/setup/:setupId" element={<SetupDetailPage darkMode={darkMode} />} />
          <Route path="/setups/:setupId" element={<SetupDetailPage darkMode={darkMode} />} />
          <Route path="/article/:articleId" element={<ArticleDetailPage darkMode={darkMode} />} />
          <Route path="/articles/:articleId" element={<ArticleDetailPage darkMode={darkMode} />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/oauth2/callback" element={<OAuthCallbackPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </ErrorProvider>
  );
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
      <AppContent darkMode={darkMode} setDarkMode={setDarkMode} />
    </BrowserRouter>
  );
}

export default App;
