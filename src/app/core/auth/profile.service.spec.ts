import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {AuthService} from './auth.service';
import {ProfileService} from './profile.service';

describe('ProfileService', () => {
  const accountUrl = 'http://keycloak/realms/test/account';
  const auth = {
    accountUrl,
    getToken: vi.fn(),
    refreshToken: vi.fn(),
  };
  let service: ProfileService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    auth.getToken.mockReset().mockResolvedValue('tok');
    auth.refreshToken.mockReset().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {provide: AuthService, useValue: auth},
      ],
    });
    service = TestBed.inject(ProfileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('loads the profile from the account url with the bearer token', async () => {
    const profile = {username: 'flo', email: 'flo@example.com'};
    let result: unknown;
    service.get().subscribe((p) => (result = p));

    const req = await vi.waitFor(() => httpMock.expectOne(accountUrl));
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok');
    req.flush(profile);
    expect(result).toEqual(profile);
  });

  it('saves the profile and refreshes the token afterwards', async () => {
    const profile = {firstName: 'Flo', lastName: 'K'};
    let done = false;
    service.update(profile).subscribe(() => (done = true));

    const req = await vi.waitFor(() => httpMock.expectOne(accountUrl));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(profile);
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok');
    expect(auth.refreshToken).not.toHaveBeenCalled();

    req.flush(null);
    await vi.waitFor(() => expect(done).toBe(true));
    expect(auth.refreshToken).toHaveBeenCalledTimes(1);
  });

  it('does not refresh the token when saving fails', async () => {
    let failed = false;
    service.update({}).subscribe({error: () => (failed = true)});

    const req = await vi.waitFor(() => httpMock.expectOne(accountUrl));
    req.flush('error', {status: 400, statusText: 'Bad Request'});

    expect(failed).toBe(true);
    expect(auth.refreshToken).not.toHaveBeenCalled();
  });
});
