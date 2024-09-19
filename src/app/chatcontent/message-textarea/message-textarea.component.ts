import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, inject, Input, ViewChild } from '@angular/core';
import { MessageAttachment, MessageService } from '../../utils/services/message.service';
import { FormsModule } from '@angular/forms';
import { Channel } from '../../shared/models/channel.class';
import { Chat } from '../../shared/models/chat.class';
import { UsersService } from '../../utils/services/user.service';
import { QuillModule } from 'ngx-quill';
import { MessageEditorComponent } from '../message-editor/message-editor.component';

@Component({
  selector: 'app-message-textarea',
  standalone: true,
  imports: [CommonModule, FormsModule, QuillModule, MessageEditorComponent],
  templateUrl: './message-textarea.component.html',
  styleUrls: [
    './message-textarea.component.scss',
  ]
})
export class MessageTextareaComponent {

  @ViewChild('messageeditor', { static: true }) messageeditor!: MessageEditorComponent;

  @Input() newMessageinChannel!: Channel | Chat;

  isHovered = false;
  isActive = false;

  // message = ''

  attachments: MessageAttachment[] = [];
  dropzonehighlighted = false;
  ifMessageUploading = false;
  errorInfo = '';

  quillstyle = {
    minHeight: '3rem',
    maxHeight: '16rem',
    width: '100%',
    backgroundColor: 'white',
    color: 'black',
    fontFamily: 'Nunito',
    border: 'none',
  };

  private fileValidators = [
    {
      name: 'maxFileSize',
      validator: (file: any) => file.size <= 500000,
      error: 'Die Datei ist zu groß. Maximal 500KB erlaubt.'
    },
    {
      name: 'fileType',
      validator: (file: any) => file.type === 'image/png' || file.type === 'image/gif' || file.type === 'image/jpeg' || file.type === 'application/pdf',
      error: 'Nur Bilder und PDFs erlaubt.'
    }
  ]

  public messageService = inject(MessageService);
  private userservice = inject(UsersService);


  constructor(private el: ElementRef) { }

  openUserPicker() {
    this.messageeditor.openUserPicker();
  }

  @HostListener('dragenter', ['$event'])
  onDragEnter(event: DragEvent) {
    event.preventDefault();
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
    this.dropzonehighlighted = highlight;
  }


  async addNewMessage() {
    const newHTMLMessage = this.messageeditor.getMessageAsHTML();
    this.clearErrorInfo();
    if (newHTMLMessage === '<p></p>' && this.attachments.length === 0) {
      this.handleErrors('Nachricht darf nicht leer sein.');
    }
    else if (await this.userservice.ifCurrentUserVerified()) {
      this.ifMessageUploading = true;
      const error = await this.messageService.addNewMessageToCollection(this.newMessageinChannel, newHTMLMessage, this.attachments)
      if (error) {
        this.handleErrors(error);
      } else {
        this.messageeditor.clearEditor();
        this.attachments = [];
      }
      this.ifMessageUploading = false;
    }
  }


  handleErrors(error: string) {
    this.errorInfo = error;
    setTimeout(() => {
      this.clearErrorInfo();
    }, 8000);
  }


  clearErrorInfo() {
    this.errorInfo = '';
  }


  removeAttachment(attachment: MessageAttachment) {
    this.attachments = this.attachments.filter(a => a !== attachment);
  }

  changeAttachmentFile(event: any) {
    event.preventDefault();
    this.loadAttachments(event.target);
  }

  loadAttachments(fileList: any) {
    this.clearErrorInfo();
    if ((fileList.files.length + this.attachments.length) > 5) {
      this.handleErrors('Maximal 5 Dateien erlaubt.');
      return;
    }
    for (let i = 0; i < fileList.files.length; i++) {
      const file = fileList.files[i];
      if (this.fileAllreadyAttached(file)) continue;
      if (!this.fileValidators.every(validator => validator.validator(file))) {
        this.errorInfo += file.name + ': ' + (this.fileValidators.find(validator => !validator.validator(file))?.error as string) + '\n';
        continue;
      }
      if (file.type.startsWith('image')) {
        this.attachments.push(this.readPicture(file));
      } else if (file.type === 'application/pdf') {
        this.attachments.push(this.readPDF(file));
      }
    }
  }

  ifFilePropertysValid(file: any): boolean {
    return file.name && file.size && file.lastModified ? true : false;
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
