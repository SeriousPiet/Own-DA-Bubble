import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkspacemenuComponent } from './workspacemenu.component';

describe('WorkspacemenuComponent', () => {
  let component: WorkspacemenuComponent;
  let fixture: ComponentFixture<WorkspacemenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkspacemenuComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WorkspacemenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
