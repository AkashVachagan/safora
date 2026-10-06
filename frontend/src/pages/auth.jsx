import { useState } from "react";

function Auth({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLogin = mode === "login";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`/user/${isLogin ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error || "Something went wrong. Please try again.");
      }
      onAuthenticated(body.token);
    } catch (requestError) {
      setError(requestError.message || "Unable to reach the server.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setError("");
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="brand-mark">S</div>
        <p className="eyebrow">SAFORA</p>
        <h1 id="auth-title">{isLogin ? "Welcome back" : "Create your account"}</h1>
        <p className="auth-intro">
          {isLogin ? "Sign in to keep an eye on your packages." : "Start tracking your packages in one place."}
        </p>

        <div className="auth-tabs" aria-label="Account action">
          <button className={isLogin ? "active" : ""} onClick={() => changeMode("login")}>Sign in</button>
          <button className={!isLogin ? "active" : ""} onClick={() => changeMode("register")}>Register</button>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="username">Username</label>
          <input id="username" value={username} onChange={(event) => setUsername(event.target.value)} required autoComplete="username" />

          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength="1" autoComplete={isLogin ? "current-password" : "new-password"} />

          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="submit-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Please wait…" : isLogin ? "Sign in" : "Create account"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default Auth;
