import {TestBed} from '@angular/core/testing';
import {of} from 'rxjs';
import {MediaImageService} from './media-image.service';
import {MediaService} from './media.service';

describe('MediaImageService', () => {
  const getContent = vi.fn();
  let service: MediaImageService;
  let createUrl: ReturnType<typeof vi.spyOn>;
  let revokeUrl: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    getContent.mockReset().mockImplementation(() => of(new Blob(['img'], {type: 'image/png'})));
    let counter = 0;
    createUrl = vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:${++counter}`);
    revokeUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    TestBed.configureTestingModule({
      providers: [{provide: MediaService, useValue: {getContent}}],
    });
    service = TestBed.inject(MediaImageService);
  });

  afterEach(() => vi.restoreAllMocks());

  function load(id: string, contentType?: string): string {
    let result = '';
    service.url(id, contentType).subscribe((url) => (result = url));
    return result;
  }

  it('provides an object url for the loaded image', () => {
    expect(load('m1')).toBe('blob:1');
    expect(getContent).toHaveBeenCalledWith('m1');
  });

  it('loads each image only once and serves repeated calls from the cache', () => {
    const first = load('m1');
    const second = load('m1');

    expect(second).toBe(first);
    expect(getContent).toHaveBeenCalledTimes(1);
    expect(createUrl).toHaveBeenCalledTimes(1);
  });

  it('loads different images separately', () => {
    expect(load('m1')).not.toBe(load('m2'));
    expect(getContent).toHaveBeenCalledTimes(2);
  });

  it('prefers the given content type over the blob type', () => {
    load('m1', 'image/jpeg');
    expect((createUrl.mock.calls[0][0] as Blob).type).toBe('image/jpeg');
  });

  it('falls back to the blob type when no content type is given', () => {
    load('m1');
    expect((createUrl.mock.calls[0][0] as Blob).type).toBe('image/png');
  });

  describe('evict', () => {
    it('revokes the object url and reloads on the next request', () => {
      const first = load('m1');

      service.evict('m1');
      expect(revokeUrl).toHaveBeenCalledWith(first);

      const second = load('m1');
      expect(getContent).toHaveBeenCalledTimes(2);
      expect(second).not.toBe(first);
    });

    it('ignores unknown ids', () => {
      expect(() => service.evict('unknown')).not.toThrow();
      expect(revokeUrl).not.toHaveBeenCalled();
    });
  });
});
