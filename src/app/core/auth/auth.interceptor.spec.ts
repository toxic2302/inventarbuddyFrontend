import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  const getToken = vi.fn();
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    getToken.mockReset().mockResolvedValue('abc123');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { getToken } },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('adds the bearer token to requests against the API', async () => {
    http.get(`${environment.apiUrl}/items`).subscribe();

    // getToken ist asynchron, der Request wird erst nach dem aufgelösten Promise abgesetzt
    await vi.waitFor(() => httpMock.expectOne(`${environment.apiUrl}/items`));
    expect(getToken).toHaveBeenCalledTimes(1);
  });

  it('sends the Authorization header with the token', async () => {
    http.get(`${environment.apiUrl}/items`).subscribe();

    const req = await vi.waitFor(() => httpMock.expectOne(`${environment.apiUrl}/items`));
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc123');
  });

  it('does not touch requests to other hosts', () => {
    http.get('https://example.com/data').subscribe();

    const req = httpMock.expectOne('https://example.com/data');
    expect(req.request.headers.has('Authorization')).toBe(false);
    expect(getToken).not.toHaveBeenCalled();
  });
});
