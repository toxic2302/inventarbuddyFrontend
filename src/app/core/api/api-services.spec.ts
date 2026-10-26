import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {Type} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {CategoryService} from './category.service';
import {ItemService} from './item.service';
import {StorageService} from './storage.service';

interface TreeCrudService {
  getAll(): Observable<unknown>;

  getById(id: string): Observable<unknown>;

  create(dto: { name: string; parentId?: string }): Observable<unknown>;

  update(dto: { id?: string; name: string }): Observable<unknown>;

  delete(id: string): Observable<void>;
}

const treeServices: [string, Type<TreeCrudService>, string][] = [
  ['CategoryService', CategoryService, 'categories'],
  ['StorageService', StorageService, 'storages'],
];

describe('API services', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('ItemService', () => {
    const base = `${environment.apiUrl}/items`;
    let service: ItemService;

    beforeEach(() => (service = TestBed.inject(ItemService)));

    it('loads all items via GET', () => {
      const items = [{id: '1', name: 'Bohrmaschine'}];
      let result: unknown;
      service.getAll().subscribe((r) => (result = r));

      const req = httpMock.expectOne(base);
      expect(req.request.method).toBe('GET');
      req.flush(items);
      expect(result).toEqual(items);
    });

    it('loads a single item via GET', () => {
      service.getById('42').subscribe();
      expect(httpMock.expectOne(`${base}/42`).request.method).toBe('GET');
    });

    it('creates an item via POST on the base url', () => {
      const dto = {name: 'Laptop', quantity: 2};
      service.create(dto).subscribe();

      const req = httpMock.expectOne(base);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
    });

    it('updates an item via POST on /update', () => {
      const dto = {id: '1', name: 'Laptop'};
      service.update(dto).subscribe();

      const req = httpMock.expectOne(`${base}/update`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
    });

    it('deletes an item via DELETE on /delete/{id}', () => {
      service.delete('7').subscribe();
      expect(httpMock.expectOne(`${base}/delete/7`).request.method).toBe('DELETE');
    });
  });

  describe.each(treeServices)('%s', (_name, serviceType, path) => {
    const base = `${environment.apiUrl}/${path}`;
    let service: TreeCrudService;

    beforeEach(() => (service = TestBed.inject(serviceType)));

    it('loads the tree via GET', () => {
      service.getAll().subscribe();
      expect(httpMock.expectOne(base).request.method).toBe('GET');
    });

    it('loads by id via POST without body (as defined in the API)', () => {
      service.getById('5').subscribe();

      const req = httpMock.expectOne(`${base}/5`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeNull();
    });

    it('creates an entry with parent reference via POST', () => {
      const dto = {name: 'Regal', parentId: 'p1'};
      service.create(dto).subscribe();

      const req = httpMock.expectOne(base);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
    });

    it('updates via POST on /update', () => {
      service.update({id: '1', name: 'Neu'}).subscribe();
      expect(httpMock.expectOne(`${base}/update`).request.method).toBe('POST');
    });

    it('deletes via DELETE on /delete/{id}', () => {
      service.delete('9').subscribe();
      expect(httpMock.expectOne(`${base}/delete/9`).request.method).toBe('DELETE');
    });
  });
});
