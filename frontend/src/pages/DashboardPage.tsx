import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency, formatDate } from "../utils/formatters";

type Reembolso = {
  id: string;
  descricao: string;
  valor: string;
  dataDespesa: string;
  status: string;
  categoria: {
    nome: string;
  };
  solicitante?: {
    nome: string;
  };
};

export function DashboardPage() {
  const { user, logout } = useAuth();
  const [reembolsos, setReembolsos] = useState<Reembolso[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReembolsos() {
      try {
        const response = await api.get<Reembolso[]>("/reembolsos");
        setReembolsos(response.data);
      } catch {
        setError("Nao foi possivel carregar as solicitacoes.");
      } finally {
        setIsLoading(false);
      }
    }

    loadReembolsos();
  }, []);

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
        {isLoading && <p className="state-message">Carregando solicitacoes...</p>}
        {error && <p className="feedback error">{error}</p>}
        {!isLoading && !error && reembolsos.length === 0 && (
          <p className="state-message">Nenhuma solicitacao encontrada.</p>
        )}
        {!isLoading && !error && reembolsos.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Descricao</th>
                  <th>Categoria</th>
                  <th>Valor</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th>Solicitante</th>
                </tr>
              </thead>
              <tbody>
                {reembolsos.map((reembolso) => (
                  <tr key={reembolso.id}>
                    <td>{reembolso.descricao}</td>
                    <td>{reembolso.categoria.nome}</td>
                    <td>{formatCurrency(reembolso.valor)}</td>
                    <td>{formatDate(reembolso.dataDespesa)}</td>
                    <td>
                      <span className="status-badge">{reembolso.status}</span>
                    </td>
                    <td>{reembolso.solicitante?.nome ?? user?.nome}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
