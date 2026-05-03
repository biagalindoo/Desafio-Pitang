import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { api } from "../api/client";
import { ReembolsoDetailPage } from "./ReembolsoDetailPage";

jest.mock("../api/client", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn()
  }
}));

const authMock = {
  user: {
    id: "gestor-1",
    nome: "Gestor",
    email: "gestor@email.com",
    perfil: "GESTOR"
  }
};

jest.mock("../contexts/AuthContext", () => ({
  useAuth: () => authMock
}));

const apiMock = api as jest.Mocked<typeof api>;

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/reembolsos/reembolso-1"]}>
      <Routes>
        <Route path="/reembolsos/:id" element={<ReembolsoDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

function makeReembolso(status: string) {
  return {
    id: "reembolso-1",
    descricao: "Taxi para cliente",
    valor: "42.5",
    dataDespesa: "2026-04-20T00:00:00.000Z",
    status,
    justificativaRejeicao: null,
    categoria: {
      nome: "Transporte"
    },
    solicitante: {
      nome: "Maria",
      email: "maria@email.com",
      perfil: "COLABORADOR"
    },
    anexos: [],
    historicos: []
  };
}

describe("ReembolsoDetailPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authMock.user = {
      id: "gestor-1",
      nome: "Gestor",
      email: "gestor@email.com",
      perfil: "GESTOR"
    };
  });

  it("deve exibir acoes de aprovacao para gestor quando status for enviado", async () => {
    apiMock.get.mockResolvedValueOnce({
      data: makeReembolso("ENVIADO")
    });

    renderPage();

    expect(await screen.findByText("Taxi para cliente")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aprovar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rejeitar" })).toBeInTheDocument();
  });

  it("deve exibir acoes de rascunho para colaborador dono", async () => {
    authMock.user = {
      id: "colaborador-1",
      nome: "Maria",
      email: "maria@email.com",
      perfil: "COLABORADOR"
    };
    apiMock.get.mockResolvedValueOnce({
      data: makeReembolso("RASCUNHO")
    });

    renderPage();

    expect(await screen.findByText("Taxi para cliente")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Editar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar para analise" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Adicionar anexo" })).toBeInTheDocument();
  });

  it("deve exibir acao de pagamento para financeiro quando status for aprovado", async () => {
    authMock.user = {
      id: "financeiro-1",
      nome: "Financeiro",
      email: "financeiro@email.com",
      perfil: "FINANCEIRO"
    };
    apiMock.get.mockResolvedValueOnce({
      data: makeReembolso("APROVADO")
    });

    renderPage();

    expect(await screen.findByText("Taxi para cliente")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Marcar como pago" })).toBeInTheDocument();
  });
});

