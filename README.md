# Deprevoz Info

[Firefox extension](https://addons.mozilla.org/en-US/firefox/extensions/) for displaying departure dates of [DePrevoz](https://deprevoz.com/) written with [Angular](https://angular.dev/).

### Run as SPA in browser

```bash
npm ci
npm run start:web
```

### Run as extension

```bash
npm ci
npm run start:extension
```

### Build as extension

```bash
npm ci
npm run assembly:extension
```

[Install](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Your_first_WebExtension#installing) as custom extension using path `./dist/deprevoz-info/browser`.

### References

- https://habr.com/ru/articles/851234/
- https://habr.com/ru/articles/858078/

### CHANGELOG

#### [1.0.0] - 19.10.2025

### Added

- Getting information about dates from [DePrevoz page](https://deprevoz.com/datumi-polaska-html/)
- Displaying list of dates
- MIT License


