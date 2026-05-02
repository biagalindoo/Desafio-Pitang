import { useAuth } from "../contexts/AuthContext";

export function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <strong>Desafio Pitang</strong>
          <span>Reembolsos</span>
        </div>
        <button type="button" onClick={logout}>
          Sair
        </button>
      </header>
      <section className="content">
        <h1>Solicitacoes de reembolso</h1>
        <p className="muted">
          Usuario logado: {user?.nome} ({user?.perfil})
        </p>
      </section>
    </main>
  );
}

