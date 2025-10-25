import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BROWSER } from '../app.config';
import { ProductColors, ProductColorsKeys, Options, OptionsKeys, DatesData, DatesDataKeys } from '../types';

@Injectable({ providedIn: 'root' })
export class BrowserStorageService {
  private readonly BROWSER: typeof browser = inject(BROWSER);

  get<T extends { [key: string]: any }>(keys: string | string[]): Observable<Partial<T>> {
    return new Observable(observer => {
      this.BROWSER.storage.sync.get(keys)
        .then((value: { [key: string]: any }) => {
          observer.next(<T>value);
          observer.complete();
        })
        .catch((err: any) => observer.error(err));
    });
  }

  set<T extends { [key: string]: any }>(value: T): Observable<void> {
    return new Observable(observer => {
      this.BROWSER.storage.sync.set(value)
        .then(() => {
          observer.next();
          observer.complete();
        })
        .catch((err: any) => observer.error(err));
    });
  }

  getOptions(): Observable<Partial<Options>> {
    return this.get<Options>([
      OptionsKeys.HIGHLIGHT_DATES_ON_SEARCH_PAGE,
    ]);
  }

  getProductColors(): Observable<Partial<ProductColors>> {
    return this.get<ProductColors>([
      ProductColorsKeys.COLOR_FOR_PRODUCT_IN_TIME,
      ProductColorsKeys.COLOR_FOR_UNCERTAIN_PRODUCT,
      ProductColorsKeys.COLOR_FOR_PRODUCT_NOT_IN_TIME,
    ]);
  }

  getDatesData(): Observable<Partial<DatesData>> {
    return this.get<DatesData>([
      DatesDataKeys.DATES_WITH_DIFFERENCE,
    ]);
  }
}
