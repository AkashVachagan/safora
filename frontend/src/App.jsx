import { useEffect, useState } from "react";
import Dashboard from "./pages/dashboard.jsx";
import Auth from "./pages/auth.jsx";
import "./styles.css";

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("safora-token"));

  useEffect(() => {
    if (token) {
      localStorage.setItem("safora-token", token);
    } else {
      localStorage.removeItem("safora-token");
    }
  }, [token]);

  return (
    token ? <Dashboard token={token} onLogout={() => setToken(null)} /> : <Auth onAuthenticated={setToken} />
  );
}

export default App;