import { inject } from '@angular/core';
import { CanActivateChildFn } from '@angular/router';
import { AuthService } from './auth.service';

/** Schützt die App-Bereiche. Nicht eingeloggte Nutzer werden zum Keycloak-Login geleitet. */
export const authGuard: CanActivateChildFn = (_route, state) => {
  const auth = inject(AuthService);
  if (auth.authenticated) {
    return true;
  }
  void auth.login(state.url);
  return false;
};
