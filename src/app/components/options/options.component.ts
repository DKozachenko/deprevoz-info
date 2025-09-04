import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-options',
  templateUrl: './options.component.html',
  styleUrl: './options.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OptionsComponent {

  ngOnInit(): void {

  }
}
