import { Link } from "react-router-dom";

export function RegisterPage() {
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <h1>Cadastro</h1>
        <p className="muted">A tela de cadastro sera implementada no proximo bloco.</p>
        <Link to="/login">Voltar para login</Link>
      </section>
    </main>
  );
}

