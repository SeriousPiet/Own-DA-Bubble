import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageDateComponent } from './message-date.component';

describe('MessageDateComponent', () => {
  let component: MessageDateComponent;
  let fixture: ComponentFixture<MessageDateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessageDateComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MessageDateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
