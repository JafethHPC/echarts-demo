import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreeDiagramComponent } from './network-diagram.component';

describe('TreeDiagramComponent', () => {
  let component: TreeDiagramComponent;
  let fixture: ComponentFixture<TreeDiagramComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreeDiagramComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TreeDiagramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
