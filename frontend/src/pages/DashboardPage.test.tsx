import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DashboardPage } from "./DashboardPage";
import { api } from "../api/client";

jest.mock("../api/client", () => ({
  api: {
    get: jest.fn()
  }
}));

jest.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: "colaborador-1",
      nome: "Maria",
      email: "maria@email.com",
      perfil: "COLABORADOR"
    },
    logout: jest.fn()
  })
}));

const apiMock = api as jest.Mocked<typeof api>;

describe("DashboardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve listar solicitacoes de reembolso", async () => {
    apiMock.get.mockResolvedValueOnce({
      data: [
        {
          id: "reembolso-1",
          descricao: "Taxi para cliente",
          valor: "42.5",
          dataDespesa: "2026-04-20T00:00:00.000Z",
          status: "RASCUNHO",
          categoria: {
            nome: "Transporte"
          },
          solicitante: {
            nome: "Maria"
          }
        }
      ]
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Carregando solicitacoes...")).toBeInTheDocument();
    expect(await screen.findByText("Taxi para cliente")).toBeInTheDocument();
    expect(screen.getByText("Transporte")).toBeInTheDocument();
    expect(screen.getByText("RASCUNHO")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Nova solicitacao" })).toBeInTheDocument();
  });

  it("deve exibir estado vazio quando nao houver solicitacoes", async () => {
    apiMock.get.mockResolvedValueOnce({
      data: []
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(await screen.findByText("Nenhuma solicitacao encontrada.")).toBeInTheDocument();
  });
});

