import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    apiMock.get.mockImplementation((url) => {
      if (url === "/categories") {
        return Promise.resolve({
          data: [
            {
              id: "category-1",
              nome: "Transporte",
              ativo: true
            }
          ]
        });
      }

      return Promise.resolve({
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
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Carregando solicitacoes...")).toBeInTheDocument();
    expect(await screen.findByText("Taxi para cliente")).toBeInTheDocument();
    expect(screen.getAllByText("Transporte").length).toBeGreaterThan(0);
    expect(screen.getAllByText("RASCUNHO").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Nova solicitacao" })).toBeInTheDocument();
    expect(screen.getByLabelText("Status")).toBeInTheDocument();
    expect(screen.getByLabelText("Categoria")).toBeInTheDocument();
    expect(screen.getByLabelText("Ordenacao")).toBeInTheDocument();
  });

  it("deve exibir estado vazio quando nao houver solicitacoes", async () => {
    apiMock.get.mockImplementation((url) => {
      if (url === "/categories") {
        return Promise.resolve({ data: [] });
      }

      return Promise.resolve({ data: [] });
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(await screen.findByText("Nenhuma solicitacao encontrada.")).toBeInTheDocument();
  });

  it("deve aplicar filtros e ordenacao na listagem", async () => {
    const user = userEvent.setup();

    apiMock.get.mockImplementation((url) => {
      if (url === "/categories") {
        return Promise.resolve({
          data: [
            {
              id: "category-1",
              nome: "Transporte",
              ativo: true
            }
          ]
        });
      }

      return Promise.resolve({ data: [] });
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await screen.findByText("Nenhuma solicitacao encontrada.");

    await user.selectOptions(screen.getByLabelText("Status"), "RASCUNHO");
    await user.selectOptions(screen.getByLabelText("Categoria"), "category-1");
    await user.selectOptions(screen.getByLabelText("Ordenacao"), "MAIOR_VALOR");

    await waitFor(() => {
      expect(apiMock.get).toHaveBeenCalledWith(
        "/reembolsos",
        expect.objectContaining({
          params: {
            status: "RASCUNHO",
            categoriaId: "category-1",
            ordenacao: "MAIOR_VALOR"
          }
        })
      );
    });
  });
});
