import type { User, UserRole } from "@/types";

export function isAdmin(user?: User | null): boolean {
  return user?.role === "admin";
}

/** Admin gerencia qualquer inspeção; técnico só as próprias. */
export function canManageInspection(user: User | null | undefined, tecnicoId: string): boolean {
  if (!user) return false;
  if (isAdmin(user)) return true;
  return user.id === tecnicoId;
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
