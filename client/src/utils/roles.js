/**
 * hasRole — utility to check if a user holds at least one of the given roles.
 * Import anywhere in the frontend for role-conditional rendering.
 *
 * Usage:
 *   import { hasRole } from '../utils/roles';
 *   {hasRole(user, 'clubAdmin', 'orgAdmin') && <CreateClubButton />}
 */

/**
 * @param {object|null} user – the user object from AuthContext
 * @param {...string}   roles – the roles to check for (at least one must match)
 * @returns {boolean}
 */
export const hasRole = (user, ...roles) =>
  roles.some((r) => user?.roles?.includes(r));

/**
 * Convenience role predicates for the most common checks.
 */
export const isOrgAdmin  = (user) => hasRole(user, "orgAdmin");
export const isClubAdmin = (user) => hasRole(user, "clubAdmin", "orgAdmin");
export const isEditor    = (user) => hasRole(user, "editor", "orgAdmin");
export const isMember    = (user) => hasRole(user, "member", "clubAdmin", "editor", "orgAdmin");
