import { SetMetadata } from '@nestjs/common';

export const SUPER_ADMIN_KEY = 'super_admin_only';
export const SuperAdminOnly = () => SetMetadata(SUPER_ADMIN_KEY, true);

/** @deprecated Use SuperAdminOnly */
export const ROLES_KEY = SUPER_ADMIN_KEY;
/** @deprecated Use SuperAdminOnly */
export const Roles = (...roles: string[]) => {
  if (roles.includes('super_admin')) {
    return SuperAdminOnly();
  }
  return SetMetadata(SUPER_ADMIN_KEY, false);
};
