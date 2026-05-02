import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { formatCurrency, formatDate } from "../utils/formatters";

type Anexo = {
  id: string;
  nomeArquivo: string;
  urlArquivo: string;
  tipoArquivo: string;
  criadoEm: string;
};

type Historico = {
  id: string;
  acao: string;
  observacao: string;
  criadoEm: string;
  usuario: {
    nome: string;
    perfil: string;
  };
};

type ReembolsoDetail = {
  id: string;
  descricao: string;
  valor: string;
  dataDespesa: string;
  status: string;
  justificativaRejeicao?: string | null;
  categoria: {
    nome: string;
  };
  solicitante: {
    nome: string;
    email: string;
    perfil: string;
  };
  anexos: Anexo[];
  historicos: Historico[];
};

export function ReembolsoDetailPage() {
  const { id } = useParams();
  const [reembolso, setReembolso] = useState<ReembolsoDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReembolso() {
      try {
        const response = await api.get<ReembolsoDetail>(`/reembolsos/${id}`);
        setReembolso(response.data);
      } catch {
        setError("Nao foi possivel carregar a solicitacao.");
      } finally {
        setIsLoading(false);
      }
    }

    loadReembolso();
  }, [id]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <strong>Desafio Pitang</strong>
          <span>Detalhe da solicitacao</span>
        </div>
        <Link className="topbar-link" to="/dashboard">
          Voltar
        </Link>
      </header>
      <section className="content">
        {isLoading && <p className="state-message">Carregando solicitacao...</p>}
        {error && <p className="feedback error">{error}</p>}
        {!isLoading && reembolso && (
          <>
            <div className="page-heading">
              <div>
                <h1>{reembolso.descricao}</h1>
                <p className="muted">
                  {reembolso.categoria.nome} • {formatCurrency(reembolso.valor)} •{" "}
                  {formatDate(reembolso.dataDespesa)}
                </p>
              </div>
              <span className="status-badge">{reembolso.status}</span>
            </div>

            <div className="detail-grid">
              <section className="detail-section">
                <h2>Dados</h2>
                <dl className="description-list">
                  <div>
                    <dt>Solicitante</dt>
                    <dd>{reembolso.solicitante.nome}</dd>
                  </div>
                  <div>
                    <dt>E-mail</dt>
                    <dd>{reembolso.solicitante.email}</dd>
                  </div>
                  <div>
                    <dt>Perfil</dt>
                    <dd>{reembolso.solicitante.perfil}</dd>
                  </div>
                  {reembolso.justificativaRejeicao && (
                    <div>
                      <dt>Justificativa</dt>
                      <dd>{reembolso.justificativaRejeicao}</dd>
                    </div>
                  )}
                </dl>
              </section>

              <section className="detail-section">
                <h2>Anexos</h2>
                {reembolso.anexos.length === 0 ? (
                  <p className="muted">Nenhum anexo cadastrado.</p>
                ) : (
                  <ul className="plain-list">
                    {reembolso.anexos.map((anexo) => (
                      <li key={anexo.id}>
                        <a href={anexo.urlArquivo} target="_blank" rel="noreferrer">
                          {anexo.nomeArquivo}
                        </a>
                        <span>{anexo.tipoArquivo}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <section className="detail-section">
              <h2>Historico</h2>
              {reembolso.historicos.length === 0 ? (
                <p className="muted">Nenhum historico cadastrado.</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Acao</th>
                        <th>Usuario</th>
                        <th>Observacao</th>
                        <th>Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reembolso.historicos.map((item) => (
                        <tr key={item.id}>
                          <td>{item.acao}</td>
                          <td>
                            {item.usuario.nome} ({item.usuario.perfil})
                          </td>
                          <td>{item.observacao}</td>
                          <td>{formatDate(item.criadoEm)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}

