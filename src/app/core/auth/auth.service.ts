import {inject, Injectable} from '@angular/core';
import Keycloak from 'keycloak-js';
import {environment} from '../../../environments/environment';
import {I18nService} from '../i18n/i18n.service';

@Injectable({providedIn: 'root'})
export class AuthService {
  private readonly i18n = inject(I18nService);
  private authenticatedState = false;
  private readonly keycloak = new Keycloak({
    url: environment.keycloak.url,
    realm: environment.keycloak.realm,
    clientId: environment.keycloak.clientId,
  });

  /**
   * Wird beim App-Start aufgerufen. Prüft nur im Hintergrund, ob bereits eine Keycloak-Session
   * besteht (check-sso). Nicht eingeloggte Nutzer werden nicht weitergeleitet, damit die
   * Landingpage öffentlich erreichbar bleibt. Der Login wird erst über login() angestoßen.
   */
  async init(): Promise<void> {
    try {
      this.authenticatedState = await this.keycloak.init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
        pkceMethod: 'S256',
        checkLoginIframe: false,
      });
    } catch (error) {
      console.error('Keycloak konnte nicht initialisiert werden', error);
      this.authenticatedState = false;
    }
  }

  get authenticated(): boolean {
    return this.authenticatedState && !!this.keycloak.authenticated;
  }

  /** Leitet zum Keycloak-Login. Nach erfolgreichem Login geht es zur angegebenen Route zurück. */
  login(path = '/dashboard'): Promise<void> {
    return this.keycloak.login({
      redirectUri: window.location.origin + path,
      locale: this.i18n.current(),
    });
  }

  get username(): string {
    const token = this.keycloak.tokenParsed;
    return (token?.['name'] ?? token?.['preferred_username'] ?? '') as string;
  }

  get email(): string {
    return (this.keycloak.tokenParsed?.['email'] ?? '') as string;
  }

  async getToken(): Promise<string> {
    try {
      await this.keycloak.updateToken(30);
    } catch {
      await this.keycloak.login({redirectUri: window.location.href});
    }
    return this.keycloak.token ?? '';
  }

  /** Basis-URL der Keycloak Account REST API des Realms. */
  get accountUrl(): string {
    return `${environment.keycloak.url}/realms/${environment.keycloak.realm}/account`;
  }

  /** Holt ein neues Token, damit geänderte Profildaten (Name, E-Mail) sofort sichtbar sind. */
  async refreshToken(): Promise<void> {
    await this.keycloak.updateToken(-1);
  }

  /** Leitet zur Keycloak-Aktion „Passwort ändern“ und danach zurück zum Profil. */
  changePassword(): Promise<void> {
    return this.keycloak.login({
      action: 'UPDATE_PASSWORD',
      locale: this.i18n.current(),
      redirectUri: window.location.origin + '/profile',
    });
  }

  logout(): Promise<void> {
    return this.keycloak.logout({redirectUri: window.location.origin});
  }
}
