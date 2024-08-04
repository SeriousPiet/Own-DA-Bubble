import { Component } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-start',
  standalone: true,
  imports: [
    RouterModule,
    RouterLink
  ],
  templateUrl: './start.component.html',
  styleUrl: './start.component.scss'
})
export class StartComponent {

}
