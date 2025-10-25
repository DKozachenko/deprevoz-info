import { ApplicationConfig, InjectionToken, provideBrowserGlobalErrorListeners, Provider, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { ROUTES } from './app.routes';
import { environment } from './environments/environment.web';

export const BROWSER: InjectionToken<typeof browser> = new InjectionToken<typeof browser>('Browser extension browser');

const browserProvider: Provider = {
  provide: BROWSER,
  useValue: environment.mode === 'extension' ? browser : null,
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(ROUTES, withHashLocation()),
    provideHttpClient(),
    browserProvider,
  ]
};
