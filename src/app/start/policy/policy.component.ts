import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-policy',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './policy.component.html',
  styleUrl: './policy.component.scss',
})
export class PolicyComponent {
  constructor(private location: Location) {}

  goBack() {
    this.location.back();
  }
}
