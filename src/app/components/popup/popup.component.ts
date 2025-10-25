import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, Signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import { DEPARTUES_DATES_URL, DeprevozService } from '../../services/deprevoz.service';
import { BrowserStorageService } from './../../services/browser-storage.service';
import { DepartureDate, Resourse, ResourseFailed, ResourseInitial, ResoursSuccess, ResourseStatus, VisibleDepartureDate, VisibleDepartureDatesObject } from '../../types';

const REGEXP_DATES_GROUP: string = 'dates';

@Component({
  selector: 'app-popup',
  templateUrl: './popup.component.html',
  styleUrl: './popup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PopupComponent {
  private readonly deprevozService = inject(DeprevozService);
  private readonly browserStorageService = inject(BrowserStorageService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly ResourseStatus = ResourseStatus;
  protected readonly departuresDatesResourse = this.getDeparturesDatesResourse();

  constructor() {
    effect(() => {
      if (this.departuresDatesResourse().status === ResourseStatus.Success) {
        this.browserStorageService.set<VisibleDepartureDatesObject>({ data: this.departuresDatesResourse().data! })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe();
      }
    });
  }

  private getDeparturesDatesResourse(): Signal<Resourse<VisibleDepartureDate[]>> {
    const departuresDates$: Observable<Resourse<VisibleDepartureDate[]>> =
      of(<ResourseInitial>{
        data: null,
        status: ResourseStatus.Initial,
        error: null,
      }).pipe(
        switchMap(() => this.deprevozService.getDepartureDatesPage()),
        map((htmlPage) => {
          const headingRexexp: RegExp = /<h6 class="wp-block-heading">(?<wp_block_heading_inner>(?<strong_polazak_iz_de><strong>POLAZAK IZ DE<\/strong>)(?<dates>.+))<\/h6>/;
          const headingResult: RegExpMatchArray | null = htmlPage.match(headingRexexp);

          if (!headingResult || !headingResult?.groups?.[REGEXP_DATES_GROUP]) {
            return <ResourseFailed<Error>>{
              data: null,
              status: ResourseStatus.Error,
              error: new Error(`На странице с датами отправления не удалось распарсить текст`, { cause: headingRexexp })
            }
          }

          const dates: string = headingResult.groups[REGEXP_DATES_GROUP];
          const datesRexexp: RegExp = /(\d{1,2}\.\d{1,2})+/g;
          const datesResult: RegExpMatchArray | null = dates.match(datesRexexp);

          if (!datesResult || Array.from(datesResult).length === 0) {
            return <ResourseFailed<Error>>{
              data: null,
              status: ResourseStatus.Error,
              error: new Error(`На странице с датами изменился формат дат, нет подходящих под регулярное выражение: ${datesRexexp}`, { cause: datesResult })
            }
          }

          const datesResultArray = <DepartureDate[]>Array.from(datesResult);

          return <ResoursSuccess<VisibleDepartureDate[]>>{
            data: this.calculateDiffWithNowForDates(datesResultArray),
            status: ResourseStatus.Success,
            error: null,
          }
        }),
        catchError((err: unknown) => of((<ResourseFailed<Error>>{
          data: null,
          status: ResourseStatus.Error,
          error: new Error(`Произошла ошибка при обращении к ${DEPARTUES_DATES_URL}: ${err}`, { cause: err }),
        }))),
        takeUntilDestroyed(),
    );

    return toSignal(departuresDates$, {
      initialValue: {
        data: null,
        status: ResourseStatus.Initial,
        error: null,
      }
    });
  }

  private calculateDiffWithNowForDates(rawDates: DepartureDate[]): VisibleDepartureDate[] {
    return rawDates.map(rawDate => {
      const now = new Date();
      const [day, month] = rawDate.split('.');
      const fullRawDate = new Date(now.getFullYear(), Number(month) - 1, Number(day));

      return {
        date: rawDate,
        diffWithNow: this.getNumberOfDaysBetweenDates(now, fullRawDate),
      }
    });
  }

  private getNumberOfDaysBetweenDates(start: Date, end: Date): number {
    const oneDay = 1000 * 60 * 60 * 24;
    const diffInTime = end.getTime() - start.getTime();
    const diffInDays = Math.round(diffInTime / oneDay);
    return diffInDays + 1;
  }
}
