import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
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
import ProfilePage from './pages/Profile/ProfilePage';
import CommunityPage from './pages/CommunityPage';
import SetupDetailPage from './pages/SetupDetailPage';
import ArticleDetailPage from './pages/ArticleDetailPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import NotFoundPage from './pages/NotFoundPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import ProtectedRoute from './components/ProtectedRoute';
import ProductsPage from './pages/CatalogPage';
import './App.css';

function HomePage() {
  return <div></div>;
}

function BuilderPage() {
  return <h1 className="p-4">Builder Page</h1>;
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
      <ErrorProvider>
        <div className={`app-wrapper ${darkMode ? "dark-mode" : "light-mode"}`}>
          <ErrorBanner />
          <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />

          <Routes>

            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/builder" element={<BuilderPage />} />
            <Route path="/products" element={<ProductsPage darkMode={darkMode} />} />
            <Route path="/community" element={<CommunityPage darkMode={darkMode} />} />
            <Route path="/mfa/verify" element={<MfaVerifyPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            {/*
              Auth-required group. ProtectedRoute kicks anyone without a
              token to /login and remembers where they were going so the
              login form can send them back. Replaces the ad-hoc
              localStorage.getItem('accessToken') checks each of these
              pages used to do on its own.
            */}
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<ProfilePage darkMode={darkMode} />} />
              <Route path="/mfa/setup" element={<MfaSetupPage />} />
              <Route path="/mfa/settings" element={<MfaSettingsPage />} />
            </Route>
            {/*
              Detail routes are registered under BOTH the singular and plural
              forms. CommunityPage uses singular ("/setup/:id"); the Activity
              tab uses plural ("/setups/:id"). We accept either so neither
              caller breaks if the convention drifts again.
            */}
            <Route path="/setup/:setupId" element={<SetupDetailPage darkMode={darkMode} />} />
            <Route path="/setups/:setupId" element={<SetupDetailPage darkMode={darkMode} />} />
            <Route path="/article/:articleId" element={<ArticleDetailPage darkMode={darkMode} />} />
            <Route path="/articles/:articleId" element={<ArticleDetailPage darkMode={darkMode} />} />
            {/* Email verification link from the welcome email */}
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            {/* Social login lands here from OAuth2LoginSuccessHandler */}
            <Route path="/oauth2/callback" element={<OAuthCallbackPage />} />
            {/* 404 catch-all — must stay last */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </ErrorProvider>
    </BrowserRouter>
  );
}

export default App;