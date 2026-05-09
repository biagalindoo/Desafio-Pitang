import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { api, setAuthToken } from "../api/client";

type User = {
  id: string;
  nome: string;
  email: string;
  perfil: "ADMIN" | "COLABORADOR" | "GESTOR" | "FINANCEIRO";
};

type LoginInput = {
  email: string;
  senha: string;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext({} as AuthContextValue);

const STORAGE_KEY = "@desafio-pitang:auth";

type StoredAuth = {
  user: User;
  token: string;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Recupera a sessao ao recarregar a pagina e recoloca o token no Axios
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return;
    }

    const parsed = JSON.parse(stored) as StoredAuth;
    setUser(parsed.user);
    setToken(parsed.token);
    setAuthToken(parsed.token);
  }, []);

  async function login(input: LoginInput) {
    const response = await api.post<StoredAuth>("/auth/login", input);
    const auth = response.data;

    // Depois do login, todas as chamadas privadas ja saem com Bearer token
    setUser(auth.user);
    setToken(auth.token);
    setAuthToken(auth.token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  }

  function logout() {
    setUser(null);
    setToken(null);
    setAuthToken(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      login,
      logout
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
