import { Component } from '@angular/core';
import { SearchbarComponent } from './searchbar/searchbar.component';
import { ProfileComponent } from './profile/profile.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [SearchbarComponent, ProfileComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {}
