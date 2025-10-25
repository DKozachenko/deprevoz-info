export enum ResourseStatus {
  Initial,
  Loading,
  Success,
  Error,
}

export interface ResourseInitial {
  data: null;
  status: ResourseStatus.Initial;
  error: null;
}

export interface ResourseLoading {
  data: null;
  status: ResourseStatus.Loading;
  error: null;
}

export interface ResoursSuccess<T> {
  data: T;
  status: ResourseStatus.Success;
  error: null;
}

export interface ResourseFailed<E extends Error> {
  data: null;
  status: ResourseStatus.Error;
  error: E;
}

export type Resourse<T, E extends Error = Error> =
  | ResourseInitial
  | ResourseLoading
  | ResoursSuccess<T>
  | ResourseFailed<E>;

export type DepartureDate = `${number}.${number}`;

// TODO: Чет мне кажется, надо переименовать
export interface VisibleDepartureDate {
  date: DepartureDate;
  diffWithNow: number;
}

export interface VisibleDepartureDatesObject {
  data: VisibleDepartureDate[]
}

export const enum DatesDataKeys {
  DATES_WITH_DIFFERENCE = 'datesWithDifference',
}

export interface DatesData {
  [DatesDataKeys.DATES_WITH_DIFFERENCE]: VisibleDepartureDatesObject;
}

export const enum OptionsKeys {
  HIGHLIGHT_DATES_ON_SEARCH_PAGE = 'highlightDatesOnSearchPage',
}

export interface Options {
  [OptionsKeys.HIGHLIGHT_DATES_ON_SEARCH_PAGE]: boolean;
}

export const enum ProductColorsKeys {
  COLOR_FOR_PRODUCT_IN_TIME = 'colorForProductInTime',
  COLOR_FOR_UNCERTAIN_PRODUCT = 'colorForUncertainProduct',
  COLOR_FOR_PRODUCT_NOT_IN_TIME = 'colorForProductNotInTime',
}

export interface ProductColors {
  [ProductColorsKeys.COLOR_FOR_PRODUCT_IN_TIME]: string;
  [ProductColorsKeys.COLOR_FOR_UNCERTAIN_PRODUCT]: string;
  [ProductColorsKeys.COLOR_FOR_PRODUCT_NOT_IN_TIME]: string;
}

export interface ExtensionStorage extends Options, ProductColors {};
