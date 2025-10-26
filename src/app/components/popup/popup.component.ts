import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, Signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import { differenceInDays } from 'date-fns';
import { DEPARTUES_DATES_URL, DeprevozService } from '../../services/deprevoz.service';
import { BrowserStorageService } from './../../services/browser-storage.service';
import { DepartureDateRaw, Resourse, ResourseFailed, ResourseInitial, ResoursSuccess, ResourseStatus, DepartureDate, DatesDataKeys, DatesData } from '../../types';

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
        this.browserStorageService.set<DatesData>({
          [DatesDataKeys.DATES_WITH_DIFFERENCE]: this.departuresDatesResourse().data!
        })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe();
      }
    });
  }

  private getDeparturesDatesResourse(): Signal<Resourse<DepartureDate[]>> {
    const departuresDates$: Observable<Resourse<DepartureDate[]>> =
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

          const datesResultArray = <DepartureDateRaw[]>Array.from(datesResult);

          return <ResoursSuccess<DepartureDate[]>>{
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

  private calculateDiffWithNowForDates(rawDates: DepartureDateRaw[]): DepartureDate[] {
    return rawDates.map(rawDate => {
      const now = new Date();
      const [day, month] = rawDate.split('.');
      // TODO: set timezone
      const fullRawDate = new Date(now.getFullYear(), Number(month) - 1, Number(day));

      return {
        date: rawDate,
        dateObject: fullRawDate,
        diffWithNow: differenceInDays(fullRawDate, now),
      }
    });
  }
}
