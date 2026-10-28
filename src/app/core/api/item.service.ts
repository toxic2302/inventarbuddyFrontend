import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {ItemDto} from './models';

@Injectable({providedIn: 'root'})
export class ItemService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/items`;

  getAll(): Observable<ItemDto[]> {
    return this.http.get<ItemDto[]>(this.baseUrl);
  }

  getById(id: string): Observable<ItemDto> {
    return this.http.get<ItemDto>(`${this.baseUrl}/${id}`);
  }

  create(dto: ItemDto): Observable<ItemDto> {
    return this.http.post<ItemDto>(this.baseUrl, dto);
  }

  update(dto: ItemDto): Observable<ItemDto> {
    return this.http.post<ItemDto>(`${this.baseUrl}/update`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
  }
}
