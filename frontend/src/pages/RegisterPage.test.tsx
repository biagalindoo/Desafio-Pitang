import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { RegisterPage } from "./RegisterPage";

jest.mock("../api/client", () => ({
  api: {
    post: jest.fn()
  }
}));

describe("RegisterPage", () => {
  it("deve renderizar formulario de cadastro", () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Cadastro" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    expect(screen.getByLabelText("Perfil")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cadastrar" })).toBeInTheDocument();
  });

  it("deve exibir erro quando senha tiver menos de seis caracteres", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText("Nome"), "Maria");
    await user.type(screen.getByLabelText("E-mail"), "maria@email.com");
    await user.type(screen.getByLabelText("Senha"), "123");
    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(
      await screen.findByText("A senha deve ter pelo menos 6 caracteres.")
    ).toBeInTheDocument();
  });
});
