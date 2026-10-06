import { useEffect, useState } from "react";
import Dashboard from "./pages/dashboard.jsx";
import Auth from "./pages/auth.jsx";
import PoliceDashboard from "./pages/police.jsx";
import "./styles.css";

function App() {
  // Authentication belongs to a browser tab. A shared localStorage token or
  // portal choice lets another portal login silently replace this tab's view.
  const [token, setToken] = useState(() => sessionStorage.getItem("safora-token"));
  const [portal, setPortal] = useState(() => sessionStorage.getItem("safora-portal") || "user");

  useEffect(() => {
    if (token) {
      sessionStorage.setItem("safora-token", token);
    } else {
      sessionStorage.removeItem("safora-token");
    }
  }, [token]);

  useEffect(() => {
    sessionStorage.setItem("safora-portal", portal);
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
