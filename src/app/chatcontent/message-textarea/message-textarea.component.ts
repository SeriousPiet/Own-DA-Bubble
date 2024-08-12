import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-message-textarea',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message-textarea.component.html',
  styleUrl: './message-textarea.component.scss'
})
export class MessageTextareaComponent {

  isHovered = false;
  isActive = false;

  
}
