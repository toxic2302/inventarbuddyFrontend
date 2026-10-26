import {inject, Injectable} from '@angular/core';
import {map, Observable, shareReplay} from 'rxjs';
import {MediaService} from './media.service';

/**
 * Stellt Bilder aus der Medien-API als `blob:`-URL für `<img [src]>` bereit.
 *
 * Warum der Umweg: `GET /media/{id}/content` braucht den `Authorization: Bearer`-Header.
 * Ein `<img src="...">` kann keine Header senden (-> 401). Deshalb laden wir die Datei per
 * `HttpClient` (der Auth-Interceptor hängt das Token an) und erzeugen daraus eine Object-URL.
 * Pro Media-ID wird nur einmal geladen (Cache), danach kommt die URL sofort aus dem Speicher.
 *
 * TODO(Backend + Frontend, später):
 *
 *  Aktuell: N+1 Requests (ein Request pro sichtbarem Bild) und es wird das ORIGINAL-Bild geladen,
 *  auch wenn nur eine kleine Vorschau gezeigt wird. Das ist ohne Backend-Änderung lauffähig,
 *  aber bei vielen/großen Bildern nicht optimal.
 *
 *  Backend (empfohlen, in dieser Reihenfolge):
 *   1. `ItemDto` um `thumbnailMediaId` (string) erweitern. Das Backend setzt dort die ID des
 *      ersten Bildes (`image/*`) des Gegenstands. Voraussetzung/Hinweis: `GET /items` muss
 *      bis dahin das `media`-Array befüllen, sonst gibt es aktuell keine Vorschau.
 *   2. Neuer Endpunkt `GET /media/{id}/thumbnail`, der ein verkleinertes Bild liefert
 *      (z. B. ~300 px Breite, JPEG/WebP). Damit werden Liste und Raster deutlich leichter.
 *   3. Optional: kurzlebige signierte URL, z. B. `thumbnailUrl` im `ItemDto` (Token als
 *      Query-Parameter, wenige Minuten gültig). Das Backend müsste dafür Token in der URL
 *      akzeptieren -> Sicherheits-Tradeoff, bewusst entscheiden.
 *   Bilder NICHT als Base64 im `ItemDto` mitschicken (bläht die Liste auf, nicht cachebar).
 *
 *  Frontend danach:
 *   - `MediaThumbnail` bekommt statt `media[]` direkt `thumbnailMediaId` und muss nicht mehr
 *     in `media[]` nach dem ersten Bild suchen (siehe TODO dort).
 *   - `url(id)` ruft dann `/media/{id}/thumbnail` statt `/content` auf (neue Methode
 *     `MediaService.getThumbnail(id)`); der Blob-Cache bleibt unverändert nützlich.
 *   - Mit signierter `thumbnailUrl` entfällt dieser Service ganz: `<img [src]="item.thumbnailUrl">`
 *     reicht, ohne Blob und ohne Extra-Request über den Interceptor.
 *   - Das Original (`/content`) wird dann nur noch beim Öffnen/Vergrößern geladen
 *     (`MediaService.open`).
 */
@Injectable({providedIn: 'root'})
export class MediaImageService {
  private readonly media = inject(MediaService);
  private readonly cache = new Map<string, Observable<string>>();

  /** Liefert die Object-URL des Bildes. Mehrfachaufrufe mit derselben ID teilen sich einen Request. */
  url(id: string, contentType?: string): Observable<string> {
    let request = this.cache.get(id);
    if (!request) {
      request = this.media.getContent(id).pipe(
        map((blob) => URL.createObjectURL(new Blob([blob], {type: contentType ?? blob.type}))),
        shareReplay({bufferSize: 1, refCount: false}),
      );
      this.cache.set(id, request);
    }
    return request;
  }

  /** Entfernt ein Bild aus dem Cache und gibt den Speicher frei (z. B. nach dem Löschen). */
  evict(id: string): void {
    const request = this.cache.get(id);
    if (!request) {
      return;
    }
    this.cache.delete(id);
    request.subscribe({next: (url) => URL.revokeObjectURL(url), error: () => undefined}).unsubscribe();
  }
}
