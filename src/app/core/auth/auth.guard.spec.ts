import {TestBed} from '@angular/core/testing';
import {ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import {authGuard} from './auth.guard';
import {AuthService} from './auth.service';

describe('authGuard', () => {
  const login = vi.fn().mockResolvedValue(undefined);
  let authenticated: boolean;

  function runGuard(url: string) {
    return TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {url} as RouterStateSnapshot),
    );
  }

  beforeEach(() => {
    login.mockClear();
    authenticated = false;
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            get authenticated() {
              return authenticated;
            },
            login,
          },
        },
      ],
    });
  });

  it('allows navigation for authenticated users without triggering a login', () => {
    authenticated = true;

    expect(runGuard('/items')).toBe(true);
    expect(login).not.toHaveBeenCalled();
  });

  it('blocks navigation and starts the login with the requested url for anonymous users', () => {
    expect(runGuard('/items')).toBe(false);
    expect(login).toHaveBeenCalledWith('/items');
  });
});
