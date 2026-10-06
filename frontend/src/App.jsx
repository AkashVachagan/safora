import { useEffect, useState } from "react";
import Dashboard from "./pages/dashboard.jsx";
import Auth from "./pages/auth.jsx";
import PoliceDashboard from "./pages/police.jsx";
import "./styles.css";

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("safora-token"));
  const [portal, setPortal] = useState(() => localStorage.getItem("safora-portal") || "user");

  useEffect(() => {
    if (token) {
      localStorage.setItem("safora-token", token);
    } else {
      localStorage.removeItem("safora-token");
    }
  }, [token]);

  useEffect(() => {
    localStorage.setItem("safora-portal", portal);
  }, [portal]);

  function authenticate(nextToken, nextPortal) {
    setToken(nextToken);
    setPortal(nextPortal);
  }

  function logout() {
    setToken(null);
    setPortal("user");
  }

  return (
    token ? portal === "police" ? <PoliceDashboard token={token} onLogout={logout} /> : <Dashboard token={token} onLogout={logout} /> : <Auth onAuthenticated={authenticate} />
  );
}

export default App;
