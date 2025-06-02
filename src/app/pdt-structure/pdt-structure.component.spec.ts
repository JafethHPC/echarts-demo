import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdtStructureComponent } from './pdt-structure.component';

describe('PdtStructureComponent', () => {
  let component: PdtStructureComponent;
  let fixture: ComponentFixture<PdtStructureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PdtStructureComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PdtStructureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
