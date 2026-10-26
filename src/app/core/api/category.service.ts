import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CategoryChildDto, CategoryParentDto } from './models';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/categories`;

  getAll(): Observable<CategoryParentDto[]> {
    return this.http.get<CategoryParentDto[]>(this.baseUrl);
  }

  // Laut Swagger ist "get by id" ein POST
  getById(id: string): Observable<CategoryParentDto> {
    return this.http.post<CategoryParentDto>(`${this.baseUrl}/${id}`, null);
  }

  create(dto: CategoryChildDto): Observable<CategoryChildDto> {
    return this.http.post<CategoryChildDto>(this.baseUrl, dto);
  }

  update(dto: CategoryChildDto): Observable<CategoryChildDto> {
    return this.http.post<CategoryChildDto>(`${this.baseUrl}/update`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
  }
}
