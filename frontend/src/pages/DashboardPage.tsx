import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

type Category = {
  id: string;
  nome: string;
  ativo: boolean;
};

const statusOptions = [
  "RASCUNHO",
  "ENVIADO",
  "APROVADO",
  "REJEITADO",
  "PAGO",
  "CANCELADO"
];

export function DashboardPage() {
  const { user, logout } = useAuth();
  const [reembolsos, setReembolsos] = useState<Reembolso[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReembolsos() {
      setIsLoading(true);
      setError("");

      try {
        const response = await api.get<Reembolso[]>("/reembolsos", {
          params: {
            status: statusFilter || undefined,
            categoriaId: categoryFilter || undefined
          }
        });

        setReembolsos(response.data);
      } catch {
        setError("Nao foi possivel carregar as solicitacoes.");
      } finally {
        setIsLoading(false);
      }
    }

    loadReembolsos();
  }, [categoryFilter, statusFilter]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await api.get<Category[]>("/categories");
        setCategories(response.data.filter((category) => category.ativo));
      } catch {
        setCategories([]);
      }
    }

    loadCategories();
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
        <div className="page-heading">
          <div>
            <h1>Solicitacoes de reembolso</h1>
            <p className="muted">
              Usuario logado: {user?.nome} ({user?.perfil})
            </p>
          </div>
          {user?.perfil === "COLABORADOR" && (
            <Link className="button-link" to="/reembolsos/novo">
              Nova solicitacao
            </Link>
          )}
          {user?.perfil === "ADMIN" && (
            <Link className="button-link" to="/categorias">
              Gerenciar categorias
            </Link>
          )}
        </div>
        <div className="filters-bar" aria-label="Filtros de solicitacoes">
          <label>
            Status
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">Todos</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label>
            Categoria
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="">Todas</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nome}
                </option>
              ))}
            </select>
          </label>
          {(statusFilter || categoryFilter) && (
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setStatusFilter("");
                setCategoryFilter("");
              }}
            >
              Limpar filtros
            </button>
          )}
        </div>
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
                  <th>Acoes</th>
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
                    <td>
                      <Link to={`/reembolsos/${reembolso.id}`}>Detalhar</Link>
                    </td>
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
