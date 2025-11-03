import { differenceInDays, parse, isValid } from 'date-fns';
import { DatesData, DatesDataKeys, ExtensionStorage, Options, OptionsKeys, ProductColors, ProductColorsKeys } from '../src/app/types';

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

function handleDeliveryElement(primaryDeliveryDateElem: HTMLSpanElement, config: Partial<ExtensionStorage>) {
  // TODO: parse Today / Tomorrow
  // TODO: parse range
  const deliveryDate = parse(primaryDeliveryDateElem.textContent.trim(), 'EEE dd MMM', new Date());

  if (!isValid(deliveryDate)) {
    return;
  }

  if (!config[DatesDataKeys.DATES_WITH_DIFFERENCE] || config[DatesDataKeys.DATES_WITH_DIFFERENCE].length < 1) {
    return;
  }


  const closestDepartureDate = config[DatesDataKeys.DATES_WITH_DIFFERENCE]
    .toSorted((a, b) => a.diffWithNow - b.diffWithNow)
    .filter(departureDate => departureDate.diffWithNow >= 0)
    ?.at(0);

  if (!closestDepartureDate) {
    return;
  }

  const daysBetweenDeliveryAndDeparture = differenceInDays(closestDepartureDate.dateObject, deliveryDate);

  if (daysBetweenDeliveryAndDeparture > 0) {
    const suitableColor = config[ProductColorsKeys.COLOR_FOR_PRODUCT_IN_TIME] ?? 'initial';
    primaryDeliveryDateElem.style.color = suitableColor;
  } else if (daysBetweenDeliveryAndDeparture === 0) {
    const suitableColor = config[ProductColorsKeys.COLOR_FOR_UNCERTAIN_PRODUCT] ?? 'initial';
    primaryDeliveryDateElem.style.color = suitableColor;
  } else {
    const suitableColor = config[ProductColorsKeys.COLOR_FOR_PRODUCT_NOT_IN_TIME] ?? 'initial';
    primaryDeliveryDateElem.style.color = suitableColor;
  }
}
