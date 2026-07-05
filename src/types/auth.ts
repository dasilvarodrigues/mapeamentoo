export type UserRole = "admin" | "agente";

export interface SessionUser {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
}

declare module "next-auth" {
  interface Session {
    user: SessionUser;
  }

  interface User {
    id: string;
    nome: string;
    email: string;
    role: UserRole;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role: UserRole;
    nome: string;
  }
}
