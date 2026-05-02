import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";

type Categoria = {
  id: string;
  nome: string;
  ativo: boolean;
};

export function NewReembolsoPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaId, setCategoriaId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [dataDespesa, setDataDespesa] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
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

    loadCategorias();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (user?.perfil !== "COLABORADOR") {
      setError("Apenas colaboradores podem criar solicitacoes.");
      return;
    }

    if (Number(valor) <= 0) {
      setError("O valor deve ser maior que zero.");
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post("/reembolsos", {
        categoriaId,
        descricao,
        valor: Number(valor),
        dataDespesa
      });
      navigate("/dashboard");
    } catch {
      setError("Nao foi possivel criar a solicitacao.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <strong>Desafio Pitang</strong>
          <span>Nova solicitacao</span>
        </div>
        <Link className="topbar-link" to="/dashboard">
          Voltar
        </Link>
      </header>
      <section className="content narrow">
        <h1>Nova solicitacao de reembolso</h1>
        {isLoading && <p className="state-message">Carregando categorias...</p>}
        {!isLoading && (
          <form onSubmit={handleSubmit} className="form surface-form">
            <label>
              Categoria
              <select
                value={categoriaId}
                onChange={(event) => setCategoriaId(event.target.value)}
                required
              >
                <option value="">Selecione uma categoria</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Descricao
              <textarea
                value={descricao}
                onChange={(event) => setDescricao(event.target.value)}
                required
                minLength={3}
                rows={4}
              />
            </label>
            <label>
              Valor
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={valor}
                onChange={(event) => setValor(event.target.value)}
                required
              />
            </label>
            <label>
              Data da despesa
              <input
                type="date"
                value={dataDespesa}
                onChange={(event) => setDataDespesa(event.target.value)}
                required
              />
            </label>
            {error && <p className="feedback error">{error}</p>}
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando" : "Salvar rascunho"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

