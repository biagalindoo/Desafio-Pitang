import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { api } from "../api/client";
import { NewReembolsoPage } from "./NewReembolsoPage";

jest.mock("../api/client", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn()
  }
}));

jest.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: "colaborador-1",
      nome: "Maria",
      email: "maria@email.com",
      perfil: "COLABORADOR"
    }
  })
}));

const navigateMock = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => navigateMock
}));

const apiMock = api as jest.Mocked<typeof api>;

describe("NewReembolsoPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve carregar categorias e criar solicitacao", async () => {
    const user = userEvent.setup();

    apiMock.get.mockResolvedValueOnce({
      data: [
        {
          id: "category-1",
          nome: "Transporte",
          ativo: true
        }
      ]
    });
    apiMock.post.mockResolvedValueOnce({});

    render(
      <MemoryRouter>
        <NewReembolsoPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Carregando categorias...")).toBeInTheDocument();
    expect(await screen.findByRole("option", { name: "Transporte" })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Categoria"), "category-1");
    await user.type(screen.getByLabelText("Descricao"), "Taxi para cliente");
    await user.type(screen.getByLabelText("Valor"), "42.50");
    await user.type(screen.getByLabelText("Data da despesa"), "2026-04-20");
    fireEvent.submit(screen.getByRole("button", { name: "Salvar rascunho" }).closest("form")!);

    expect(apiMock.post).toHaveBeenCalledWith("/reembolsos", {
      categoriaId: "category-1",
      descricao: "Taxi para cliente",
      valor: 42.5,
      dataDespesa: "2026-04-20"
    });
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("deve validar valor maior que zero", async () => {
    const user = userEvent.setup();

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
        <NewReembolsoPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole("option", { name: "Transporte" })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Categoria"), "category-1");
    await user.type(screen.getByLabelText("Descricao"), "Taxi para cliente");
    await user.type(screen.getByLabelText("Valor"), "-1");
    await user.type(screen.getByLabelText("Data da despesa"), "2026-04-20");
    fireEvent.submit(screen.getByRole("button", { name: "Salvar rascunho" }).closest("form")!);

    expect(screen.getByText("O valor deve ser maior que zero.")).toBeInTheDocument();
    expect(apiMock.post).not.toHaveBeenCalled();
  });
});
