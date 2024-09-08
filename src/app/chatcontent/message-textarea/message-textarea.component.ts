import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, inject, Input } from '@angular/core';
import { MessageService } from '../../utils/services/message.service';
import { FormsModule } from '@angular/forms';
import { Channel } from '../../shared/models/channel.class';
import { Chat } from '../../shared/models/chat.class';
import { UsersService } from '../../utils/services/user.service';

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
  dropzonehighlighted = false;

  public messageService = inject(MessageService);
  private userservice = inject(UsersService);

  @Input() newMessageinChannel!: Channel | Chat;

  constructor(private el: ElementRef) { }
  @HostListener('dragenter', ['$event'])
  onDragEnter(event: DragEvent) {
    event.preventDefault();  // Verhindert die Standard-Aktion (z. B. das Öffnen der Datei)
    this.highlightDropZone(true);
  }

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.highlightDropZone(true);
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    if (this.isLeavingDropZone(event)) {
      this.highlightDropZone(false);
    }
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent) {
    event.preventDefault();
    this.highlightDropZone(false);

    this.loadAttachments(event.dataTransfer);
  }

  private isLeavingDropZone(event: DragEvent): boolean {
    const dropZone = this.el.nativeElement;
    const relatedTarget = event.relatedTarget as Node;
    return !dropZone.contains(relatedTarget);
  }

  private highlightDropZone(highlight: boolean) {
    const nativeElement = this.el.nativeElement;
    if (highlight) this.dropzonehighlighted = true;
    else setTimeout(() => {
      this.dropzonehighlighted = false;
    }, 100);
  }


  async addNewMessage(newMessagePath: Channel | Chat, message: string) {
    if(message && await this.userservice.ifCurrentUserVerified()) {
      this.messageService.addNewMessageToCollection(newMessagePath, message);
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



}
