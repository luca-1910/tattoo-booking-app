import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <>
      <style>{`
        .login-wrap { display: flex; min-height: 100vh; flex-direction: column; }
        .login-dark { background: var(--color-fg); display: flex; flex-direction: column; }
        .login-dark-logo { display: flex; align-items: center; padding: 0 24px; height: 80px; flex-shrink: 0; }
        .login-dark-hero { display: none; }
        .login-form-col {
          flex: 1;
          background: var(--color-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
        }
        @media (min-width: 768px) {
          .login-wrap { flex-direction: row; }
          .login-dark { width: 50%; padding: 64px; }
          .login-dark-logo { height: auto; padding: 0; }
          .login-dark-hero { display: flex; flex: 1; align-items: center; justify-content: center; }
          .login-form-col { width: 50%; flex: none; padding: 64px; }
        }
      `}</style>

      <main className="login-wrap">
        {/* Left: dark brand panel */}
        <div className="login-dark">
          <div className="login-dark-logo">
            <span style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 20,
              color: "#fff",
              letterSpacing: "-0.01em",
            }}>
              MISSMAY
            </span>
          </div>

          <div className="login-dark-hero">
            <div>
              <h1 style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 48,
                color: "#fff",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                marginBottom: 16,
              }}>
                Artist portal
              </h1>
              <p style={{
                fontFamily: "var(--font-ui)",
                fontWeight: 400,
                fontSize: 16,
                color: "rgba(255,255,255,0.5)",
                lineHeight: 1.6,
              }}>
                Sign in to manage your bookings.
              </p>
            </div>
          </div>
        </div>

        {/* Right: form */}
        <div className="login-form-col">
          <div style={{ width: "100%", maxWidth: 360 }}>
            <LoginForm />
          </div>
        </div>
      </main>
    </>
  );
}
