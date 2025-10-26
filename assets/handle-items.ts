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
  console.log('EBAT', 'handleSearchResults');
}

