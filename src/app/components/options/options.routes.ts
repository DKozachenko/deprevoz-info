import { Routes } from '@angular/router';
import { OptionsComponent } from './options.component';

export const OPTIONS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: OptionsComponent
  }
]
