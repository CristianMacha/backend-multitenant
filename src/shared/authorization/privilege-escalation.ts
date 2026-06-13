import { RequestContextStorage } from '@shared/context/request-context';
import { ForbiddenActionException } from '@shared/exceptions';

/**
 * Prevents privilege escalation through role/permission management.
 *
 * The acting user (from the request context) may only grant permissions
 * they themselves hold. Platform admins are exempt — they hold everything
 * by definition. Use this in any handler that lets a user widen another
 * principal's authority (assigning a role, editing a role's permissions).
 */
export function assertCanGrantPermissions(
  grantedCodes: readonly string[],
): void {
  const actor = RequestContextStorage.getUser();
  if (!actor) {
    throw new ForbiddenActionException('No authenticated actor in context');
  }
  if (actor.isPlatformAdmin) return;

  const held = new Set(actor.permissions);
  const escalated = grantedCodes.filter((code) => !held.has(code));
  if (escalated.length > 0) {
    throw new ForbiddenActionException(
      'You cannot grant permissions you do not hold yourself',
      { escalated },
    );
  }
}
