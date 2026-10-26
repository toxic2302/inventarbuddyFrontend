import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';
import {SkeletonModule} from 'primeng/skeleton';
import {MediaImageService} from '../../core/api/media-image.service';
import {MediaDto} from '../../core/api/models';

/**
 * Zeigt das Vorschaubild eines Gegenstands (erstes Medium mit `image/*`).
 * Das Bild wird erst geladen, wenn die Komponente (fast) sichtbar ist, damit lange Listen
 * nicht sofort alle Bilder anfordern. Ohne Bild wird ein Icon angezeigt (PDF-Icon, wenn nur PDFs).
 *
 * TODO(Backend + Frontend, später): Details siehe `MediaImageService`.
 *  Sobald das Backend `ItemDto.thumbnailMediaId` liefert, den Input `media` durch
 *  `thumbnailMediaId = input<string>()` ersetzen. Dann entfällt die Suche in `media[]` (`thumb`)
 *  und das Bild kommt direkt über `MediaImageService.url(thumbnailMediaId)`. In `items.html`
 *  wird entsprechend `[thumbnailMediaId]="item.thumbnailMediaId"` statt `[media]="item.media"`
 *  übergeben. Dann kann `GET /items` auch das `media`-Array weglassen.
 */
@Component({
  selector: 'app-media-thumbnail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SkeletonModule],
  host: {class: 'flex size-full items-center justify-center overflow-hidden rounded-[inherit] text-muted-color'},
  template: `
    @if (src(); as source) {
      <img class="size-full object-cover" [src]="source" [alt]="alt()"/>
    } @else if (pending()) {
      <p-skeleton width="100%" height="100%" borderRadius="0"/>
    } @else {
      <i class="pi text-5xl" [class.pi-box]="!pdfOnly()" [class.pi-file-pdf]="pdfOnly()"></i>
    }
  `,
})
export class MediaThumbnail {
  private readonly images = inject(MediaImageService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly media = input<MediaDto[] | undefined>();
  readonly alt = input('');

  protected readonly src = signal<string | null>(null);
  private readonly visible = signal(false);
  private readonly failed = signal(false);

  // TODO: entfällt mit `thumbnailMediaId` aus dem Backend (siehe Klassenkommentar).
  private readonly thumb = computed(
    () => this.media()?.find((m) => m.id && m.contentType?.startsWith('image/')),
    {equal: (a, b) => a?.id === b?.id},
  );

  /** Ein Bild ist vorhanden, wurde aber noch nicht geladen: Skeleton statt Icon anzeigen. */
  protected readonly pending = computed(() => !!this.thumb() && !this.src() && !this.failed());

  protected readonly pdfOnly = computed(
    () => !this.thumb() && (this.media() ?? []).some((m) => m.contentType === 'application/pdf'),
  );

  constructor() {
    afterNextRender(() => {
      if (typeof IntersectionObserver === 'undefined') {
        this.visible.set(true);
        return;
      }
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            this.visible.set(true);
            observer.disconnect();
          }
        },
        {rootMargin: '200px'},
      );
      observer.observe(this.host.nativeElement);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });

    effect((onCleanup) => {
      const thumb = this.thumb();
      this.failed.set(false);
      if (!thumb?.id) {
        this.src.set(null);
        return;
      }
      if (!this.visible()) {
        return;
      }
      const subscription = this.images.url(thumb.id, thumb.contentType).subscribe({
        next: (url) => this.src.set(url),
        error: () => {
          this.src.set(null);
          this.failed.set(true);
        },
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }
}
