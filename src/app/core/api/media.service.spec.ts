import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {environment} from '../../../environments/environment';
import {MediaService} from './media.service';

describe('MediaService', () => {
  const base = `${environment.apiUrl}/media`;
  let service: MediaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MediaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('loads media of an item', () => {
    service.getByItem('i1').subscribe();
    expect(httpMock.expectOne(`${base}/item/i1`).request.method).toBe('GET');
  });

  it('requests the content as blob', () => {
    service.getContent('m1').subscribe();

    const req = httpMock.expectOne(`${base}/m1/content`);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
  });

  describe('upload', () => {
    const file = new File(['abc'], 'foto.png', {type: 'image/png'});

    it('sends the file as multipart form data with itemId param', () => {
      service.upload(file, 'i1').subscribe();

      const req = httpMock.expectOne((r) => r.url === base);
      expect(req.request.method).toBe('POST');
      expect(req.request.params.get('itemId')).toBe('i1');
      expect(req.request.body).toBeInstanceOf(FormData);
      expect((req.request.body as FormData).get('file')).toBeInstanceOf(File);
    });

    it('omits the itemId param when no item is given', () => {
      service.upload(file).subscribe();

      const req = httpMock.expectOne((r) => r.url === base);
      expect(req.request.params.has('itemId')).toBe(false);
    });
  });

  it('updates and deletes media', () => {
    service.update({id: 'm1', fileName: 'neu.png'}).subscribe();
    expect(httpMock.expectOne(`${base}/update`).request.method).toBe('POST');

    service.delete('m1').subscribe();
    expect(httpMock.expectOne(`${base}/delete/m1`).request.method).toBe('DELETE');
  });

  describe('open', () => {
    it('does nothing without an id', () => {
      service.open({fileName: 'x.pdf'});
      httpMock.expectNone(() => true);
    });

    it('opens the loaded content in a new tab and revokes the object url later', () => {
      vi.useFakeTimers();
      const createUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
      const revokeUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
      const openWindow = vi.spyOn(window, 'open').mockReturnValue(null);

      service.open({id: 'm1', contentType: 'application/pdf'});
      httpMock.expectOne(`${base}/m1/content`).flush(new Blob(['pdf']));

      expect(createUrl).toHaveBeenCalledTimes(1);
      expect((createUrl.mock.calls[0][0] as Blob).type).toBe('application/pdf');
      expect(openWindow).toHaveBeenCalledWith('blob:test', '_blank');
      expect(revokeUrl).not.toHaveBeenCalled();

      vi.advanceTimersByTime(60_000);
      expect(revokeUrl).toHaveBeenCalledWith('blob:test');
    });
  });
});
