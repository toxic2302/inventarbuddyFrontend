import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { from, Observable, switchMap } from 'rxjs';
import { AuthService } from './auth.service';

export interface UserProfile {
  id?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  emailVerified?: boolean;
  attributes?: Record<string, string[]>;
}

/** Liest und ändert den Keycloak-Benutzer über die Account REST API von Keycloak. */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  get(): Observable<UserProfile> {
    return this.withAuth((headers) =>
      this.http.get<UserProfile>(this.auth.accountUrl, { headers }),
    );
  }

  update(profile: UserProfile): Observable<void> {
    return this.withAuth((headers) =>
      this.http.post<void>(this.auth.accountUrl, profile, { headers }),
    ).pipe(switchMap(() => from(this.auth.refreshToken())));
  }

  private withAuth<T>(request: (headers: HttpHeaders) => Observable<T>): Observable<T> {
    return from(this.auth.getToken()).pipe(
      switchMap((token) => request(new HttpHeaders({ Authorization: `Bearer ${token}` }))),
    );
  }
}
