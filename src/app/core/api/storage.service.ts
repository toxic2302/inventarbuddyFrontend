import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StorageChildDto, StorageParentDto } from './models';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/storages`;

  getAll(): Observable<StorageParentDto[]> {
    return this.http.get<StorageParentDto[]>(this.baseUrl);
  }

  // Laut Swagger ist "get by id" ein POST
  getById(id: string): Observable<StorageParentDto> {
    return this.http.post<StorageParentDto>(`${this.baseUrl}/${id}`, null);
  }

  create(dto: StorageChildDto): Observable<StorageChildDto> {
    return this.http.post<StorageChildDto>(this.baseUrl, dto);
  }

  update(dto: StorageChildDto): Observable<StorageChildDto> {
    return this.http.post<StorageChildDto>(`${this.baseUrl}/update`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
  }
}
