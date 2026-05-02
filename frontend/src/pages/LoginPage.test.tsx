import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { LoginPage } from "./LoginPage";

const loginMock = jest.fn();

jest.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    login: loginMock
  })
}));

const navigateMock = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => navigateMock
}));

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve renderizar formulario de login", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Controle de Reembolsos" })).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Criar uma conta" })).toBeInTheDocument();
  });

  it("deve autenticar usuario e redirecionar para dashboard", async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValueOnce(undefined);

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText("E-mail"), "admin@email.com");
    await user.type(screen.getByLabelText("Senha"), "123456");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(loginMock).toHaveBeenCalledWith({
      email: "admin@email.com",
      senha: "123456"
    });
    expect(navigateMock).toHaveBeenCalledWith("/dashboard");
  });

  it("deve exibir erro quando credenciais forem invalidas", async () => {
    const user = userEvent.setup();
    loginMock.mockRejectedValueOnce(new Error("invalid credentials"));

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText("E-mail"), "erro@email.com");
    await user.type(screen.getByLabelText("Senha"), "123456");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("E-mail ou senha invalidos.")).toBeInTheDocument();
  });
});

