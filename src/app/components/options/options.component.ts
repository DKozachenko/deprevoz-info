import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, forkJoin, startWith, Subscription, switchMap } from 'rxjs';
import { BrowserStorageService } from '../../services/browser-storage.service';
import { Options, OptionsKeys, ProductColors, ProductColorsKeys } from '../../types';

type FormGroupTypeOptions = { [ OptKey in OptionsKeys ]: FormControl<boolean | null> };

type FormGroupValueOptions = { [ OptKey in OptionsKeys ]: boolean | null };

type FormGroupTypeProductColors = { [ ProductKey in ProductColorsKeys ]: FormControl<string | null> };

type FormGroupValueProductColors = { [ ProductKey in ProductColorsKeys ]: string | null };

type FormGroupType = FormGroupTypeOptions & FormGroupTypeProductColors;

type FormGroupValue = FormGroupValueOptions & FormGroupValueProductColors;

@Component({
  selector: 'app-options',
  templateUrl: './options.component.html',
  styleUrl: './options.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, FormsModule]
})
export class OptionsComponent implements OnInit, OnDestroy {
  private readonly browserStorageService: BrowserStorageService = inject(BrowserStorageService);
  private formSubscription!: Subscription;
  private highlightOnSearchControlSubscription!: Subscription;

  protected form: FormGroup<FormGroupType> = new FormGroup<FormGroupType>({
    [OptionsKeys.HIGHLIGHT_DATES_ON_SEARCH_PAGE]: new FormControl<boolean>(false),
    [ProductColorsKeys.COLOR_FOR_PRODUCT_IN_TIME]: new FormControl<string>(''),
    [ProductColorsKeys.COLOR_FOR_UNCERTAIN_PRODUCT]: new FormControl<string>(''),
    [ProductColorsKeys.COLOR_FOR_PRODUCT_NOT_IN_TIME]: new FormControl<string>(''),
  });

  ngOnInit(): void {
    this.patchFormByOptions();

    this.highlightOnSearchControlSubscription = this.form.controls[OptionsKeys.HIGHLIGHT_DATES_ON_SEARCH_PAGE]
      .valueChanges
      .pipe(startWith(false))
      .subscribe({
        next: (value: boolean | null) => {
          // TODO: при вкл / выкл чекбокса эти значения могут заполнять прошлыми
          if (value) {
            this.form.get(ProductColorsKeys.COLOR_FOR_PRODUCT_IN_TIME)?.enable();
            this.form.get(ProductColorsKeys.COLOR_FOR_UNCERTAIN_PRODUCT)?.enable();
            this.form.get(ProductColorsKeys.COLOR_FOR_PRODUCT_NOT_IN_TIME)?.enable();
          } else {
            this.form.get(ProductColorsKeys.COLOR_FOR_PRODUCT_IN_TIME)?.disable();
            this.form.get(ProductColorsKeys.COLOR_FOR_UNCERTAIN_PRODUCT)?.disable();
            this.form.get(ProductColorsKeys.COLOR_FOR_PRODUCT_NOT_IN_TIME)?.disable();

            this.form.patchValue({
              [ProductColorsKeys.COLOR_FOR_PRODUCT_IN_TIME]: '',
              [ProductColorsKeys.COLOR_FOR_UNCERTAIN_PRODUCT]: '',
              [ProductColorsKeys.COLOR_FOR_PRODUCT_NOT_IN_TIME]: '',
            });
          }
        }
      })

    this.formSubscription = this.form.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap((value: Partial<FormGroupValue>) => this.browserStorageService.set<Partial<FormGroupValue>>(value))
      )
      .subscribe({
        error: (err) => {
          console.error(`Ошибка при сохрании объекта ${this.form.value} в хранилище: ${err}`)
        }
      });
  }

  private patchFormByOptions(): void {
    forkJoin([
      this.browserStorageService.getOptions(),
      this.browserStorageService.getProductColors(),
    ]).subscribe({
      next: ([optionsValue, colorsValue]: [Partial<Options>, Partial<ProductColors>]) => {
        this.form.patchValue({
          ...optionsValue,
          ...colorsValue,
        });
      },
      error: (err) => {
        console.error(`Ошибка при получении ключей '${OptionsKeys.HIGHLIGHT_DATES_ON_SEARCH_PAGE}', '${ProductColorsKeys.COLOR_FOR_PRODUCT_IN_TIME}',
          '${ProductColorsKeys.COLOR_FOR_UNCERTAIN_PRODUCT}', '${ProductColorsKeys.COLOR_FOR_PRODUCT_NOT_IN_TIME}' из хранилища: ${err}`);
      }
    });
  }

  ngOnDestroy(): void {
    this.formSubscription.unsubscribe();
    this.highlightOnSearchControlSubscription.unsubscribe();
  }
}
