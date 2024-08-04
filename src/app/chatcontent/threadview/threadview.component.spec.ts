import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreadviewComponent } from './threadview.component';

describe('ThreadviewComponent', () => {
  let component: ThreadviewComponent;
  let fixture: ComponentFixture<ThreadviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThreadviewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ThreadviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
