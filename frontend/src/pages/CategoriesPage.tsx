import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";

type Categoria = {
  id: string;
  nome: string;
  ativo: boolean;
};

export function CategoriesPage() {
  const { user } = useAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [nome, setNome] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadCategorias() {
    try {
      const response = await api.get<Categoria[]>("/categories");
      setCategorias(response.data);
    } catch {
      setError("Nao foi possivel carregar as categorias.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCategorias();
  }, []);

  function startEdit(categoria: Categoria) {
    setEditingId(categoria.id);
    setNome(categoria.nome);
    setError("");
    setSuccess("");
  }

  function resetForm() {
    setEditingId(null);
    setNome("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, { nome });
        setSuccess("Categoria atualizada com sucesso.");
      } else {
        await api.post("/categories", { nome });
        setSuccess("Categoria criada com sucesso.");
      }

      resetForm();
      await loadCategorias();
    } catch {
      setError("Nao foi possivel salvar a categoria.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleActive(categoria: Categoria) {
    setError("");
    setSuccess("");

    try {
      await api.put(`/categories/${categoria.id}`, {
        ativo: !categoria.ativo
      });
      setSuccess("Status da categoria atualizado.");
      await loadCategorias();
    } catch {
      setError("Nao foi possivel atualizar a categoria.");
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <strong>Desafio Pitang</strong>
          <span>Categorias</span>
        </div>
        <Link className="topbar-link" to="/dashboard">
          Voltar
        </Link>
      </header>
      <section className="content">
        <div className="page-heading">
          <div>
            <h1>Gestao de categorias</h1>
            <p className="muted">Categorias inativas nao podem ser usadas em novas solicitacoes.</p>
          </div>
        </div>

        {user?.perfil !== "ADMIN" && (
          <p className="feedback error">Apenas administradores podem gerenciar categorias.</p>
        )}

        {user?.perfil === "ADMIN" && (
          <>
            <form onSubmit={handleSubmit} className="form surface-form inline-form">
              <label>
                Nome
                <input
                  type="text"
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                  required
                  minLength={2}
                />
              </label>
              <div className="form-actions">
                <button type="submit" disabled={isSubmitting}>
                  {editingId ? "Salvar" : "Criar"}
                </button>
                {editingId && (
                  <button type="button" className="secondary-button" onClick={resetForm}>
                    Cancelar edicao
                  </button>
                )}
              </div>
            </form>

            {error && <p className="feedback error">{error}</p>}
            {success && <p className="feedback success">{success}</p>}
            {isLoading && <p className="state-message">Carregando categorias...</p>}
            {!isLoading && categorias.length === 0 && (
              <p className="state-message">Nenhuma categoria cadastrada.</p>
            )}
            {!isLoading && categorias.length > 0 && (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Status</th>
                      <th>Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categorias.map((categoria) => (
                      <tr key={categoria.id}>
                        <td>{categoria.nome}</td>
                        <td>
                          <span className="status-badge">
                            {categoria.ativo ? "ATIVA" : "INATIVA"}
                          </span>
                        </td>
                        <td>
                          <div className="row-actions">
                            <button type="button" onClick={() => startEdit(categoria)}>
                              Editar
                            </button>
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() => toggleActive(categoria)}
                            >
                              {categoria.ativo ? "Inativar" : "Ativar"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

