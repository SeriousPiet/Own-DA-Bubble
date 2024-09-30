import { Component, inject } from '@angular/core';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { EmojipickerService } from '../../utils/services/emojipicker.service';

type EmojiUseData = {
  unified: string;
  valid: boolean;
}
@Component({
  selector: 'app-emojipicker',
  standalone: true,
  imports: [PickerComponent],
  templateUrl: './emojipicker.component.html',
  styleUrl: './emojipicker.component.scss'
})
export class EmojipickerComponent {

  public emojiService = inject(EmojipickerService);

}