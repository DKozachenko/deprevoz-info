import { differenceInDays, parse, isValid, addDays } from 'date-fns';
import { DatesData, DatesDataKeys, DepartureDate, ExtensionStorage, Options, OptionsKeys, ProductColors, ProductColorsKeys } from '../src/app/types';

function throttle(func: Function, delay: number) {
  let lastCall = 0;

  return function(...args: any[]) {
    const now = Date.now();

    if (now - lastCall >= delay) {
      // @ts-ignore
      func.apply(this, args);
      lastCall = now;
    }
  };
}

const RANGE_REGEX: RegExp = /^(?<startDateDay>\d{1,2})(?<startDateMonth> [A-Z][a-z]{1,2})* - (?<endDateDay>\d{1,2})(?<endDateMonth> [A-Z][a-z]{1,2})*(?<endDateYear>, \d{4})*/;
const enum RangeRegexGroups {
  START_DATE_DAY = 'startDateDay',
  START_DATE_MONTH = 'startDateMonth',
  END_DATE_DAY = 'endDateDay',
  END_DATE_MONTH = 'endDateMonth',
  END_DATE_YEAR = 'endDateYear',
}

let intervalId: NodeJS.Timeout | null = null;
const UPDATE_TIME = 2000;
intervalId = setInterval(main, UPDATE_TIME);

function main() {
  const searchResultsDiv = document.querySelector<HTMLDivElement>('.s-search-results');

  if (!searchResultsDiv) {
    return;
  }

  const resultItemDivs = searchResultsDiv.querySelectorAll<HTMLDivElement>('.s-result-item');

  if (resultItemDivs.length < 1) {
    return;
  }

  // Call it at first time
  handleSearchResults();

  // After that watch for list with result items, because it's only way to track
  // when page had changed (for example, if user click next page in pagination);
  // use throttle function as well so there are no a lot of function calls (1s - optimal time)
  const observer = new MutationObserver(throttle(handleSearchResults, 1000));
  observer.observe(searchResultsDiv, {
    subtree: false,
    childList: true,
    characterData: false,
    attributes: false,
    attributeOldValue: false,
    characterDataOldValue: false
  });

  browser.storage.sync.onChanged.addListener(handleSearchResults);

  dropInterval();
}

function dropInterval() {
  if (!intervalId) {
    return;
  }

  clearInterval(intervalId);
  intervalId = null;
}


function handleSearchResults() {
  getConfig()
    .then(config => {
      if (!config[OptionsKeys.HIGHLIGHT_DATES_ON_SEARCH_PAGE]) {
        return;
      }

      if (!config[DatesDataKeys.DATES_WITH_DIFFERENCE] || config[DatesDataKeys.DATES_WITH_DIFFERENCE]?.length < 1) {
        return;
      }

      if (!config[ProductColorsKeys.COLOR_FOR_PRODUCT_IN_TIME] &&
        !config[ProductColorsKeys.COLOR_FOR_UNCERTAIN_PRODUCT] &&
        !config[ProductColorsKeys.COLOR_FOR_PRODUCT_NOT_IN_TIME]) {
        return;
      }

      const resultItemDivs = document.querySelectorAll<HTMLDivElement>('.s-result-item');
      resultItemDivs.forEach(searchItem => handleSearchItemOnSearchPage(searchItem, config));
    })
    .catch(err => {
      console.error(`Ошибка при получении ключей '${OptionsKeys.HIGHLIGHT_DATES_ON_SEARCH_PAGE}', '${ProductColorsKeys.COLOR_FOR_PRODUCT_IN_TIME}',
        '${ProductColorsKeys.COLOR_FOR_PRODUCT_NOT_IN_TIME}', '${ProductColorsKeys.COLOR_FOR_UNCERTAIN_PRODUCT}', '${DatesDataKeys.DATES_WITH_DIFFERENCE}'
        из хранилища: ${err}`)
    });
}

async function getConfig(): Promise<Partial<ExtensionStorage>> {
  return Promise.all([getOptions(), getProductColors(), getDatesData()]).then(([options, colors, dates]) => ({
    ...options,
    ...colors,
    ...dates
  }));
}

async function getOptions(): Promise<Partial<Options>> {
  return browser.storage.sync.get([
    OptionsKeys.HIGHLIGHT_DATES_ON_SEARCH_PAGE,
  ]);
}

async function getProductColors(): Promise<Partial<ProductColors>> {
  return browser.storage.sync.get([
    ProductColorsKeys.COLOR_FOR_PRODUCT_IN_TIME,
    ProductColorsKeys.COLOR_FOR_UNCERTAIN_PRODUCT,
    ProductColorsKeys.COLOR_FOR_PRODUCT_NOT_IN_TIME,
  ]);
}

async function getDatesData(): Promise<Partial<DatesData>> {
  return browser.storage.sync.get([
    DatesDataKeys.DATES_WITH_DIFFERENCE,
  ]);
}

function handleSearchItemOnSearchPage(item: HTMLDivElement, config: Partial<ExtensionStorage>) {
  const primaryDeliveryMessage = item.querySelector<HTMLDivElement>('.udm-primary-delivery-message');
  const primaryDeliveryDateElem = primaryDeliveryMessage?.querySelector<HTMLSpanElement>('.a-text-bold');

  if (!primaryDeliveryDateElem) {
    return;
  }

  handleDeliveryElement(primaryDeliveryDateElem, config);

  const secondaryDeliveryMessage = item.querySelector<HTMLDivElement>('.udm-secondary-delivery-message');
  const secondaryDeliveryDateElem = secondaryDeliveryMessage?.querySelector<HTMLSpanElement>('.a-text-bold');

  if (secondaryDeliveryDateElem) {
    handleDeliveryElement(secondaryDeliveryDateElem, config);
  }
}

function handleDeliveryElement(deliveryDateElem: HTMLSpanElement, config: Partial<ExtensionStorage>) {
  if (!config || !config[DatesDataKeys.DATES_WITH_DIFFERENCE] || config[DatesDataKeys.DATES_WITH_DIFFERENCE].length < 1) {
    return;
  }

  const closestDepartureDate = config[DatesDataKeys.DATES_WITH_DIFFERENCE]
    // Filter only future and today dates
    .filter(departureDate => departureDate.diffWithNow >= 0)
    // Sort by closest to today date
    .toSorted((a, b) => a.diffWithNow - b.diffWithNow)
    ?.at(0);

  if (!closestDepartureDate) {
    return;
  }

  if (isDateRange(deliveryDateElem.textContent.trim())) {
    handleElementWithRangeDate(deliveryDateElem, closestDepartureDate, config);
    return;
  }

  handleElementWithOnlyDate(deliveryDateElem, closestDepartureDate, config);
}

function isDateRange(textContent: string): boolean {
  return RANGE_REGEX.test(textContent);
}

function handleElementWithOnlyDate(deliveryDateElem: HTMLSpanElement, closestDepartureDate: DepartureDate, config: Partial<ExtensionStorage>): void {
  const elemText: string = deliveryDateElem.textContent.trim();
  const deliveryDate = parseOnlyDate(elemText);

  if (!isValid(deliveryDate)) {
    return;
  }

  const daysBetweenDeliveryAndDeparture = differenceInDays(closestDepartureDate.dateObject, deliveryDate);
  const suitableColor = getColorByDaysGap(daysBetweenDeliveryAndDeparture, config);

  deliveryDateElem.style.color = suitableColor;
}

function parseOnlyDate(elemText: string): Date {
  if (elemText.includes('Today')) {
    return new Date();
  }

  if (elemText.includes('Tomorrow') || elemText.includes('Overnight by')) {
    return addDays(new Date(), 1);
  }

  // Mon 10 Nov
  return parse(elemText, 'EEE dd MMM', new Date());
}

function getColorByDaysGap(days: number, config: Partial<ExtensionStorage>): string {
  if (days > 0) {
    return config[ProductColorsKeys.COLOR_FOR_PRODUCT_IN_TIME] ?? 'initial';
  }

  if (days === 0) {
    return config[ProductColorsKeys.COLOR_FOR_UNCERTAIN_PRODUCT] ?? 'initial';
  }

  return config[ProductColorsKeys.COLOR_FOR_PRODUCT_NOT_IN_TIME] ?? 'initial';
}

function handleElementWithRangeDate(deliveryDateElem: HTMLSpanElement, closestDepartureDate: DepartureDate, config: Partial<ExtensionStorage>): void {
  const elemText: string = deliveryDateElem.textContent.trim();
  const dateRange = parseDateRange(elemText);

  if (!dateRange) {
    return;
  }

  const suitableColor = getColorByRangeDaysGap(dateRange[0], dateRange[1], closestDepartureDate.dateObject, config);

  deliveryDateElem.style.color = suitableColor;
}

function parseDateRange(elemText: string): [Date, Date] | null {
  const rangeResult: RegExpMatchArray | null = elemText.match(RANGE_REGEX);

  if (!rangeResult || !rangeResult?.groups) {
    return null;
  }

  const startDateDay: string | undefined = rangeResult.groups[RangeRegexGroups.START_DATE_DAY];
  const startDateMonth: string | undefined = rangeResult.groups[RangeRegexGroups.START_DATE_MONTH];
  const endDateDay: string | undefined = rangeResult.groups[RangeRegexGroups.END_DATE_DAY];
  const endDateMonth: string | undefined = rangeResult.groups[RangeRegexGroups.END_DATE_MONTH];
  const endDateYear: string | undefined = rangeResult.groups[RangeRegexGroups.END_DATE_YEAR];

  // 19 Jan - 14 May, 2026
  if (startDateDay && startDateMonth && endDateDay && endDateMonth && endDateYear) {
    const start = parse(`${startDateDay}${startDateMonth}`, 'dd MMM', new Date());
    const end = parse(`${endDateDay}${endDateMonth}${endDateYear}`, 'dd MMM, YYYY', new Date());

    if (!isValid(start) || !isValid(end)) {
      return null;
    }

    return [start, end];
  }

  // 28 Nov - 4 Dec
  if (startDateDay && startDateMonth && endDateDay && endDateMonth) {
    const start = parse(`${startDateDay}${startDateMonth}`, 'dd MMM', new Date());
    const end = parse(`${endDateDay}${endDateMonth}`, 'dd MMM', new Date());

    if (!isValid(start) || !isValid(end)) {
      return null;
    }

    return [start, end];
  }

  // 24 - 26 Nov
  if (startDateDay && endDateDay && endDateMonth) {
    const start = parse(`${startDateDay}`, 'dd', new Date());
    const end = parse(`${endDateDay}${endDateMonth}`, 'dd MMM', new Date());

    if (!isValid(start) || !isValid(end)) {
      return null;
    }

    return [start, end];
  }

  return null;
}

function getColorByRangeDaysGap(startDate: Date, endDate: Date, closestDate: Date, config: Partial<ExtensionStorage>): string {
  // Whole range BEFORE closestDate
  if (endDate < closestDate) {
    return config[ProductColorsKeys.COLOR_FOR_PRODUCT_IN_TIME] ?? 'initial';
  }

  // closesDate BETWEEN range dates
  if (startDate <= closestDate && closestDate <= endDate) {
    return config[ProductColorsKeys.COLOR_FOR_UNCERTAIN_PRODUCT] ?? 'initial';
  }

  // Whole range AFTER closestDate
  return config[ProductColorsKeys.COLOR_FOR_PRODUCT_NOT_IN_TIME] ?? 'initial';
}
