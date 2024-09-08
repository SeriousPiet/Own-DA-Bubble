import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { MessageService } from '../../utils/services/message.service';
import { FormsModule } from '@angular/forms';
import { Channel } from '../../shared/models/channel.class';
import { Chat } from '../../shared/models/chat.class';

type MessageAttachment = {
  name: string;
  src: any;
  size: number;
  lastModified: number;
  file: any;
}

@Component({
  selector: 'app-message-textarea',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './message-textarea.component.html',
  styleUrl: './message-textarea.component.scss'
})
export class MessageTextareaComponent {

  isHovered = false;
  isActive = false;

  message = ''

  attachments: MessageAttachment[] = [];

  public messageService = inject(MessageService);

  @Input() newMessageinChannel!: Channel | Chat;

  addNewMessage(newMessagePath: Channel | Chat, message: string) {
    if (newMessagePath instanceof Channel) {
      if (message) this.messageService.addNewMessageToCollection(newMessagePath, message);
      this.message = '';
    }
  }

  removeAttachment(attachment: MessageAttachment) {
    this.attachments = this.attachments.filter(a => a !== attachment);
  }

  changeAttachmentFile(event: any) {
    event.preventDefault();
    this.loadAttachments(event.target);
  }

  loadAttachments(fileList: any) {
    for (let i = 0; i < fileList.files.length; i++) {
      const file = fileList.files[i];
      if (this.fileAllreadyAttached(file)) continue;
      if (file.type.startsWith('image')) {
        this.attachments.push(this.readPicture(file));
      } else if (file.type === 'application/pdf') {
        this.attachments.push(this.readPDF(file));
      }
    }
  }

  fileAllreadyAttached(file: any): boolean {
    return this.attachments.find(a =>
      a.name === file.name
      && a.size === file.size
      && a.lastModified === file.lastModified
    ) ? true : false;
  }

  readPDF(file: any): MessageAttachment {
    const reader = new FileReader();
    const attachment: MessageAttachment = {
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
      src: './assets/icons/chat/write-message/pdf.svg',
      file: file
    }
    return attachment;
  }

  readPicture(file: any): MessageAttachment {
    const reader = new FileReader();
    const attachment: MessageAttachment = {
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
      src: './assets/icons/chat/write-message/attachment.svg',
      file: file
    }
    reader.onload = (e) => { attachment.src = e.target?.result; }
    reader.readAsDataURL(file);
    return attachment;
  }


  onDragEnter(event: DragEvent) {
    event.preventDefault();  // Verhindert die Standard-Aktion (z. B. das Öffnen der Datei)
    event.stopPropagation();
    this.highlightDropZone(event, true);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.highlightDropZone(event, true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.highlightDropZone(event, false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.highlightDropZone(event, false);

    this.loadAttachments(event.dataTransfer);
  }

  // Hebe die Drop-Zone hervor, wenn Dateien gezogen werden
  private highlightDropZone(event: DragEvent, highlight: boolean) {
    const dropZone = (event.target as HTMLElement);
    if (highlight) {
      dropZone.classList.add('drag-over');
    } else {
      dropZone.classList.remove('drag-over');
    }
  }
}
