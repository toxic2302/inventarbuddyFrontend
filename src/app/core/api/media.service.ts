import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MediaDto } from './models';

@Injectable({ providedIn: 'root' })
export class MediaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/media`;

  getAll(): Observable<MediaDto[]> {
    return this.http.get<MediaDto[]>(this.baseUrl);
  }

  getById(id: string): Observable<MediaDto> {
    return this.http.get<MediaDto>(`${this.baseUrl}/${id}`);
  }

  getByItem(itemId: string): Observable<MediaDto[]> {
    return this.http.get<MediaDto[]>(`${this.baseUrl}/item/${itemId}`);
  }

  /** Liefert den Dateiinhalt (Bild/PDF). Der Request läuft über den Interceptor, daher als Blob. */
  getContent(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/content`, { responseType: 'blob' });
  }

  upload(file: File, itemId?: string): Observable<MediaDto> {
    const body = new FormData();
    body.append('file', file);
    let params = new HttpParams();
    if (itemId) {
      params = params.set('itemId', itemId);
    }
    return this.http.post<MediaDto>(this.baseUrl, body, { params });
  }

  update(dto: MediaDto): Observable<MediaDto> {
    return this.http.post<MediaDto>(`${this.baseUrl}/update`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
  }

  /** Öffnet Bild/PDF in einem neuen Tab. */
  open(media: MediaDto): void {
    if (!media.id) {
      return;
    }
    this.getContent(media.id).subscribe((blob) => {
      const url = URL.createObjectURL(new Blob([blob], { type: media.contentType ?? blob.type }));
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    });
  }
}
