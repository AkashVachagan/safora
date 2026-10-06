import { useState } from "react";

function Auth({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [portal, setPortal] = useState("user");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
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
        body: JSON.stringify({ username, password, portal, ...(isLogin || portal === "police" ? {} : { phone }) }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error || "Something went wrong. Please try again.");
      }
      onAuthenticated(body.token, portal);
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

  async function deleteAllData() {
    if (deletePhrase !== "DELETE ALL") return;
    setIsDeleting(true);
    setDeleteError("");
    try {
      const response = await fetch("/clear", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmation: "DELETE ALL SAFORA USER DATA" }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not delete user data");
      setDeletePhrase("");
      setShowDelete(false);
      setError("All user and police account data was deleted.");
    } catch (requestError) {
      setDeleteError(requestError.message);
    } finally {
      setIsDeleting(false);
    }
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

        <div className="portal-choice" aria-label="Portal">
          <button type="button" className={portal === "user" ? "active" : ""} onClick={() => setPortal("user")}>User portal</button>
          <button type="button" className={portal === "police" ? "active" : ""} onClick={() => setPortal("police")}>Police portal</button>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="username">Username</label>
          <input id="username" value={username} onChange={(event) => setUsername(event.target.value)} required autoComplete="username" />

          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength="1" autoComplete={isLogin ? "current-password" : "new-password"} />

          {!isLogin && portal === "user" && <><label htmlFor="phone">Phone number</label><input id="phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required autoComplete="tel" placeholder="+91 98765 43210" /></>}

          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="submit-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Please wait…" : isLogin ? "Sign in" : "Create account"}
          </button>
        </form>
        <p className="auth-switch">{isLogin ? <>New here? <button type="button" onClick={() => changeMode("register")}>Register</button></> : <>Already have an account? <button type="button" onClick={() => changeMode("login")}>Sign in</button></>}</p>
        <button type="button" className="delete-data-link" onClick={() => { setShowDelete((value) => !value); setDeleteError(""); }}>Delete all user data</button>
        {showDelete && <div className="delete-data-panel"><p>This permanently removes user accounts, police accounts, trips, contacts, locations, and tokens.</p><label htmlFor="delete-confirmation">Type DELETE ALL to confirm</label><input id="delete-confirmation" value={deletePhrase} onChange={(event) => setDeletePhrase(event.target.value)} /><button type="button" className="delete-data-button" onClick={deleteAllData} disabled={deletePhrase !== "DELETE ALL" || isDeleting}>{isDeleting ? "Deleting…" : "Delete all data"}</button>{deleteError && <p className="form-error" role="alert">{deleteError}</p>}</div>}
      </section>
    </main>
  );
}

export default Auth;
