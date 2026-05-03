import axios from "axios";
import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";

const perfis = ["ADMIN", "COLABORADOR", "GESTOR", "FINANCEIRO"] as const;

export function RegisterPage() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState<(typeof perfis)[number]>("COLABORADOR");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (senha.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post("/users", {
        nome,
        email,
        senha,
        perfil
      });
      setSuccess("Usuario cadastrado com sucesso.");
      setTimeout(() => navigate("/login"), 700);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          setError("Nao foi possivel conectar com a API. Verifique se o backend esta rodando.");
          return;
        }

        setError(error.response.data?.message ?? "Nao foi possivel cadastrar o usuario.");
        return;
      }

      setError("Nao foi possivel cadastrar o usuario.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <h1>Cadastro</h1>
        <form onSubmit={handleSubmit} className="form">
          <label>
            Nome
            <input
              type="text"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              required
              minLength={2}
            />
          </label>
          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              required
              minLength={6}
            />
          </label>
          <label>
            Perfil
            <select
              value={perfil}
              onChange={(event) => setPerfil(event.target.value as typeof perfil)}
            >
              {perfis.map((profile) => (
                <option key={profile} value={profile}>
                  {profile}
                </option>
              ))}
            </select>
          </label>
          {error && <p className="feedback error">{error}</p>}
          {success && <p className="feedback success">{success}</p>}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Cadastrando" : "Cadastrar"}
          </button>
        </form>
        <Link to="/login">Voltar para login</Link>
      </section>
    </main>
  );
}
