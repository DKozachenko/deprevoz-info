import { Routes } from '@angular/router';

export const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'options',
  },
  {
    path: 'popup',
    loadChildren: () => import('./components/popup/popup.routes').then(c => c.POPUP_ROUTES)
  },
  {
    path: 'options',
    loadChildren: () => import('./components/options/options.routes').then(c => c.OPTIONS_ROUTES)
  }
];
