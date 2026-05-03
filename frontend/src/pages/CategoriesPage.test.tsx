import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { api } from "../api/client";
import { CategoriesPage } from "./CategoriesPage";

jest.mock("../api/client", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn()
  }
}));

const authMock = {
  user: {
    id: "admin-1",
    nome: "Admin",
    email: "admin@email.com",
    perfil: "ADMIN"
  }
};

jest.mock("../contexts/AuthContext", () => ({
  useAuth: () => authMock
}));

const apiMock = api as jest.Mocked<typeof api>;

describe("CategoriesPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authMock.user = {
      id: "admin-1",
      nome: "Admin",
      email: "admin@email.com",
      perfil: "ADMIN"
    };
  });

  it("deve listar categorias para admin", async () => {
    apiMock.get.mockResolvedValueOnce({
      data: [
        {
          id: "category-1",
          nome: "Transporte",
          ativo: true
        }
      ]
    });

    render(
      <MemoryRouter>
        <CategoriesPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Carregando categorias...")).toBeInTheDocument();
    expect(await screen.findByText("Transporte")).toBeInTheDocument();
    expect(screen.getByText("ATIVA")).toBeInTheDocument();
  });

  it("deve criar categoria", async () => {
    const user = userEvent.setup();

    apiMock.get
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({
        data: [
          {
            id: "category-1",
            nome: "Alimentacao",
            ativo: true
          }
        ]
      });
    apiMock.post.mockResolvedValueOnce({});

    render(
      <MemoryRouter>
        <CategoriesPage />
      </MemoryRouter>
    );

    await screen.findByText("Nenhuma categoria cadastrada.");
    await user.type(screen.getByLabelText("Nome"), "Alimentacao");
    await user.click(screen.getByRole("button", { name: "Criar" }));

    expect(apiMock.post).toHaveBeenCalledWith("/categories", {
      nome: "Alimentacao"
    });
    expect(await screen.findByText("Categoria criada com sucesso.")).toBeInTheDocument();
  });

  it("deve bloquear gerenciamento para perfil diferente de admin", async () => {
    authMock.user = {
      id: "colaborador-1",
      nome: "Maria",
      email: "maria@email.com",
      perfil: "COLABORADOR"
    };
    apiMock.get.mockResolvedValueOnce({ data: [] });

    render(
      <MemoryRouter>
        <CategoriesPage />
      </MemoryRouter>
    );

    expect(
      await screen.findByText("Apenas administradores podem gerenciar categorias.")
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Criar" })).not.toBeInTheDocument();
  });
});

