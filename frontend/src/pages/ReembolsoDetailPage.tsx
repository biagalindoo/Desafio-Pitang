import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
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

type ReembolsoAction = "enviar" | "cancelar" | "aprovar" | "rejeitar" | "pagar";

export function ReembolsoDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [reembolso, setReembolso] = useState<ReembolsoDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justificativaRejeicao, setJustificativaRejeicao] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  useEffect(() => {
    loadReembolso();
  }, [id]);

  async function executeAction(action: ReembolsoAction) {
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const payload =
        action === "rejeitar"
          ? {
              justificativaRejeicao
            }
          : undefined;

      await api.post(`/reembolsos/${id}/${action}`, payload);
      setSuccess("Acao realizada com sucesso.");
      setJustificativaRejeicao("");
      await loadReembolso();
    } catch {
      setError("Nao foi possivel realizar a acao.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isOwner = reembolso?.solicitante.email === user?.email;
  const canSubmitOrCancel =
    user?.perfil === "COLABORADOR" && isOwner && reembolso?.status === "RASCUNHO";
  const canApproveOrReject = user?.perfil === "GESTOR" && reembolso?.status === "ENVIADO";
  const canPay = user?.perfil === "FINANCEIRO" && reembolso?.status === "APROVADO";

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
                  {reembolso.categoria.nome} - {formatCurrency(reembolso.valor)} -{" "}
                  {formatDate(reembolso.dataDespesa)}
                </p>
              </div>
              <span className="status-badge">{reembolso.status}</span>
            </div>
            {success && <p className="feedback success">{success}</p>}

            {(canSubmitOrCancel || canApproveOrReject || canPay) && (
              <section className="detail-section actions-section">
                <h2>Acoes disponiveis</h2>
                <div className="actions-row">
                  {canSubmitOrCancel && (
                    <>
                      <Link className="button-link secondary-button" to={`/reembolsos/${id}/editar`}>
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => executeAction("enviar")}
                        disabled={isSubmitting}
                      >
                        Enviar para analise
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => executeAction("cancelar")}
                        disabled={isSubmitting}
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                  {canApproveOrReject && (
                    <>
                      <button
                        type="button"
                        onClick={() => executeAction("aprovar")}
                        disabled={isSubmitting}
                      >
                        Aprovar
                      </button>
                      <div className="reject-box">
                        <textarea
                          value={justificativaRejeicao}
                          onChange={(event) => setJustificativaRejeicao(event.target.value)}
                          placeholder="Justificativa da rejeicao"
                          rows={3}
                        />
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => executeAction("rejeitar")}
                          disabled={isSubmitting || justificativaRejeicao.trim().length < 3}
                        >
                          Rejeitar
                        </button>
                      </div>
                    </>
                  )}
                  {canPay && (
                    <button
                      type="button"
                      onClick={() => executeAction("pagar")}
                      disabled={isSubmitting}
                    >
                      Marcar como pago
                    </button>
                  )}
                </div>
              </section>
            )}

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
