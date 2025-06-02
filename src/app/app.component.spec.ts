import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [], // Add imports if needed
      declarations: [AppComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should have team-structure as default active tab', () => {
    expect(component.activeTab).toEqual('team-structure');
  });

  it('should change the active tab when setActiveTab is called', () => {
    // Initial state
    expect(component.activeTab).toEqual('team-structure');

    // Act
    component.setActiveTab('world-map');

    // Assert
    expect(component.activeTab).toEqual('world-map');
  });

  it('should change to pdt-structure tab', () => {
    // Act
    component.setActiveTab('pdt-structure');

    // Assert
    expect(component.activeTab).toEqual('pdt-structure');
  });
});
