import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageTextareaComponent } from './message-textarea.component';

describe('MessageTextareaComponent', () => {
  let component: MessageTextareaComponent;
  let fixture: ComponentFixture<MessageTextareaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessageTextareaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MessageTextareaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
