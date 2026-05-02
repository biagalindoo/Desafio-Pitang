import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";

type Categoria = {
  id: string;
  nome: string;
  ativo: boolean;
};

type ReembolsoDetail = {
  id: string;
  descricao: string;
  valor: string;
  dataDespesa: string;
  status: string;
  categoria: {
    id: string;
    nome: string;
  };
  solicitante: {
    email: string;
  };
};

export function EditReembolsoPage() {
  const { id } = useParams();
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
    async function loadData() {
      try {
        const [categoriasResponse, reembolsoResponse] = await Promise.all([
          api.get<Categoria[]>("/categories"),
          api.get<ReembolsoDetail>(`/reembolsos/${id}`)
        ]);
        const reembolso = reembolsoResponse.data;

        if (
          user?.perfil !== "COLABORADOR" ||
          reembolso.solicitante.email !== user.email ||
          reembolso.status !== "RASCUNHO"
        ) {
          setError("Esta solicitacao nao pode ser editada.");
          return;
        }

        setCategorias(categoriasResponse.data);
        setCategoriaId(reembolso.categoria.id);
        setDescricao(reembolso.descricao);
        setValor(String(reembolso.valor));
        setDataDespesa(reembolso.dataDespesa.slice(0, 10));
      } catch {
        setError("Nao foi possivel carregar a solicitacao.");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [id, user]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (Number(valor) <= 0) {
      setError("O valor deve ser maior que zero.");
      return;
    }

    setIsSubmitting(true);

    try {
      await api.put(`/reembolsos/${id}`, {
        categoriaId,
        descricao,
        valor: Number(valor),
        dataDespesa
      });
      navigate(`/reembolsos/${id}`);
    } catch {
      setError("Nao foi possivel atualizar a solicitacao.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <strong>Desafio Pitang</strong>
          <span>Editar solicitacao</span>
        </div>
        <Link className="topbar-link" to={`/reembolsos/${id}`}>
          Voltar
        </Link>
      </header>
      <section className="content narrow">
        <h1>Editar solicitacao</h1>
        {isLoading && <p className="state-message">Carregando solicitacao...</p>}
        {error && <p className="feedback error">{error}</p>}
        {!isLoading && !error && (
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
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando" : "Salvar alteracoes"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

