import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

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
  const [darkMode, setDarkMode] = useState(false);

  return (
    <BrowserRouter>
      <div
        className={darkMode ? "dark-mode app-wrapper" : "light-mode app-wrapper"}
      >
        <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/builder" element={<BuilderPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/community" element={<CommunityPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;