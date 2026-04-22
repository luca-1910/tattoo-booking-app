import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "var(--color-bg)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 900,
            fontSize: "var(--text-3xl)",
            color: "var(--color-fg)",
            letterSpacing: "-0.02em",
            marginBottom: 8,
          }}
        >
          Admin
        </h1>
        <p
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "var(--text-sm)",
            color: "var(--color-fg-muted)",
            marginBottom: 32,
          }}
        >
          Sign in to manage bookings and appointments.
        </p>

        <div
          style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            padding: 24,
          }}
        >
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
