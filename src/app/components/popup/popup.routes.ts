import { Routes } from '@angular/router';
import { PopupComponent } from './popup.component';

export const POPUP_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: PopupComponent
  }
]
