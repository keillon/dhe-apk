import type { User, UserRole } from "@/types";

export function isAdmin(user?: User | null): boolean {
  return user?.role === "admin";
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case "admin":
      return "Administrador";
    case "tecnico":
      return "Técnico";
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}
