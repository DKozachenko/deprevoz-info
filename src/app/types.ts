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

export interface VisibleDepartureDate {
  date: DepartureDate;
  diffWithNow: number;
}
