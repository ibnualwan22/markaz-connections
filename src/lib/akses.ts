import { Grants, Role, UserRoles } from "./store";

// Tile dashboard = gabungan grants langsung + aplikasi dari role user.
// (Fase 6 nanti: provisioning menjadi syarat tambahan; di Fase 2 belum.)
export function effectiveAppIds(
  userId: string,
  grants: Grants,
  roles: Role[],
  userRoles: UserRoles
): string[] {
  const hasil = new Set<string>(grants[userId] || []);
  const roleById = new Map(roles.map((r) => [r.id, r]));
  for (const roleId of userRoles[userId] || []) {
    const role = roleById.get(roleId);
    if (role) for (const appId of role.apps) hasil.add(appId);
  }
  return [...hasil];
}
