import { ChangeDetectionStrategy, Component, inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import { DEPARTUES_DATES_URL, DeprevozService } from '../../services/deprevoz.service';
import { DepartureDate, Resourse, ResourseFailed, ResourseInitial, ResoursSuccess, ResourseStatus } from '../../types';

const REGEXP_DATES_GROUP: string = 'dates';

@Component({
  selector: 'app-popup',
  templateUrl: './popup.component.html',
  styleUrl: './popup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PopupComponent {
  private readonly deprevozService = inject(DeprevozService);

  protected readonly ResourseStatus = ResourseStatus;
  protected readonly departuresDatesResourse = this.getDeparturesDatesResourse();

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
              error: new Error(`На странице с датами нет текста, подходящего под регулярное выражение: ${headingRexexp}`, { cause: headingResult })
            }
          }

          const dates: string = headingResult.groups[REGEXP_DATES_GROUP];
          const datesRexexp: RegExp = /(\d\d\.\d\d)+/g;
          const datesResult: RegExpMatchArray | null = dates.match(datesRexexp);

          if (!datesResult || Array.from(datesResult).length === 0) {
            return <ResourseFailed<Error>>{
              data: null,
              status: ResourseStatus.Error,
              error: new Error(`На странице с датами изменился формат дат, нет подходящих под регулярное выражение: ${datesRexexp}`, { cause: datesResult })
            }
          }

          return <ResoursSuccess<DepartureDate[]>>{
            data: <DepartureDate[]>Array.from(datesResult),
            status: ResourseStatus.Success,
            error: null,
          }
        }),
        catchError((err: unknown) => of((<ResourseFailed<Error>>{
          data: null,
          status: ResourseStatus.Error,
          error: new Error(`Произошла ошибка при обращении к ${DEPARTUES_DATES_URL}: ${err}`, { cause: err }),
        }))),
    );

    return toSignal(departuresDates$, {
      initialValue: {
        data: null,
        status: ResourseStatus.Initial,
        error: null,
      }
    });
  }
}
