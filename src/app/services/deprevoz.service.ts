import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export const DEPARTUES_DATES_URL: string = 'https://deprevoz.com/datumi-polaska-html';

@Injectable({ providedIn: 'root' })
export class DeprevozService {
  private readonly http: HttpClient = inject(HttpClient);

  getDepartureDatesPage(): Observable<string> {
    return this.http.get(DEPARTUES_DATES_URL, { responseType: 'text'});
  }
}
