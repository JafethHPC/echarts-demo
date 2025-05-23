import { AlignmentComponent } from './alignment.component';
import { EventEmitter } from '@angular/core';
import {
  SelectionEvent,
  DataStateChangeEvent,
} from '@progress/kendo-angular-grid';

describe('AlignmentComponent', () => {
  let component: AlignmentComponent;
  let mockElementRef: any;

  beforeEach(() => {
    // Mock ElementRef
    mockElementRef = {
      nativeElement: {
        style: {
          setProperty: jest.fn(),
        },
      },
    };

    component = new AlignmentComponent(mockElementRef);
    // Set default test values
    component.title = 'Test Title';
    component.nodeType = 'Team';
    component.data = { data: [], total: 0 };
    component.state = {
      sort: [],
      skip: 0,
      take: 10,
      filter: {
        logic: 'and',
        filters: [],
      },
    };
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnChanges', () => {
    it('should set CSS scale property when scale changes', () => {
      const changes = {
        scale: {
          currentValue: 1.5,
          previousValue: 1,
          firstChange: false,
          isFirstChange: () => false,
        },
      };

      component.scale = 1.5;
      component.ngOnChanges(changes);

      expect(
        mockElementRef.nativeElement.style.setProperty
      ).toHaveBeenCalledWith('--btn-scale', '1.5');
    });

    it('should handle scale changes with undefined scale', () => {
      const changes = {
        scale: {
          currentValue: undefined,
          previousValue: 1,
          firstChange: false,
          isFirstChange: () => false,
        },
      };

      component.scale = undefined as any;
      component.ngOnChanges(changes);

      expect(
        mockElementRef.nativeElement.style.setProperty
      ).toHaveBeenCalledWith('--btn-scale', '1');
    });

    it('should not set scale property when scale does not change', () => {
      const changes = {
        title: {
          currentValue: 'New Title',
          previousValue: 'Old Title',
          firstChange: false,
          isFirstChange: () => false,
        },
      };

      component.ngOnChanges(changes);

      expect(
        mockElementRef.nativeElement.style.setProperty
      ).not.toHaveBeenCalled();
    });
  });

  describe('Computed properties', () => {
    it('should calculate showJiraColumns correctly', () => {
      // Team node type should not show Jira columns
      expect(component.showJiraColumns).toBe(false);

      // Jira Board node type should show Jira columns
      component.nodeType = 'Jira Board';
      expect(component.showJiraColumns).toBe(true);

      // Team Backlog node type should show Jira columns
      component.nodeType = 'Team Backlog';
      expect(component.showJiraColumns).toBe(true);

      // SPK node type should show Jira columns
      component.nodeType = 'SPK';
      expect(component.showJiraColumns).toBe(true);

      // Other node types should not show Jira columns
      component.nodeType = 'Other';
      expect(component.showJiraColumns).toBe(false);
    });

    it('should calculate showTeamColumns correctly', () => {
      // Team node type should show Team columns
      expect(component.showTeamColumns).toBe(true);

      // PDT node type should show Team columns
      component.nodeType = 'PDT';
      expect(component.showTeamColumns).toBe(true);

      // Portfolio node type should show Team columns
      component.nodeType = 'Portfolio';
      expect(component.showTeamColumns).toBe(true);

      // Jira Board node type should not show Team columns
      component.nodeType = 'Jira Board';
      expect(component.showTeamColumns).toBe(false);

      // Other node types should not show Team columns
      component.nodeType = 'Other';
      expect(component.showTeamColumns).toBe(false);
    });
  });

  describe('HostBinding', () => {
    it('should return rowSelected value for isRowSelected getter', () => {
      component.rowSelected = true;
      expect(component.isRowSelected).toBe(true);

      component.rowSelected = false;
      expect(component.isRowSelected).toBe(false);
    });
  });

  describe('Event emitters', () => {
    it('should emit dataStateChange event', () => {
      // Create a spy on the emit method
      const spy = jest.spyOn(component.dataStateChange, 'emit');

      // Create a test state change event
      const state: DataStateChangeEvent = {
        skip: 10,
        take: 5,
        sort: [{ field: 'name', dir: 'asc' }],
        filter: { logic: 'and', filters: [] },
      };

      // Call the method
      component.onDataStateChange(state);

      // Verify the emit was called with the right parameter
      expect(spy).toHaveBeenCalledWith(state);
    });

    it('should emit selectionChange event', () => {
      const spy = jest.spyOn(component.selectionChange, 'emit');
      const event = {
        selectedRows: [{ dataItem: { id: 1 } }],
      } as SelectionEvent;

      component.onSelectionChange(event);
      expect(spy).toHaveBeenCalledWith(event);
    });

    it('should emit addClick event', () => {
      const spy = jest.spyOn(component.addClick, 'emit');
      component.onAddClick();
      expect(spy).toHaveBeenCalled();
    });

    it('should emit deleteClick event', () => {
      const spy = jest.spyOn(component.deleteClick, 'emit');
      component.onDeleteClick();
      expect(spy).toHaveBeenCalled();
    });

    it('should emit manageColumnsClick event', () => {
      const spy = jest.spyOn(component.manageColumnsClick, 'emit');
      component.onManageColumnsClick();
      expect(spy).toHaveBeenCalled();
    });

    it('should emit exportClick event', () => {
      const spy = jest.spyOn(component.exportClick, 'emit');
      component.onExportClick();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Default properties', () => {
    it('should have default values for inputs', () => {
      // Create a fresh instance
      const freshComponent = new AlignmentComponent(mockElementRef);

      // Check default values
      expect(freshComponent.title).toBe('');
      expect(freshComponent.data).toEqual({ data: [], total: 0 });
      expect(freshComponent.state).toEqual({
        sort: [],
        skip: 0,
        take: 10,
        filter: {
          logic: 'and',
          filters: [],
        },
      });
      expect(freshComponent.selectableSettings).toEqual({
        checkboxOnly: false,
        mode: 'single',
      });
      expect(freshComponent.loading).toBe(false);
      expect(freshComponent.nodeType).toBe('');
      expect(freshComponent.rowSelected).toBe(false);
      expect(freshComponent.showActionButtons).toBe(true);
      expect(freshComponent.actions).toEqual([
        'add',
        'delete',
        'manage',
        'export',
      ]);
      expect(freshComponent.scale).toBe(1);
    });

    it('should have all EventEmitter properties initialized', () => {
      expect(component.dataStateChange).toBeInstanceOf(EventEmitter);
      expect(component.selectionChange).toBeInstanceOf(EventEmitter);
      expect(component.addClick).toBeInstanceOf(EventEmitter);
      expect(component.deleteClick).toBeInstanceOf(EventEmitter);
      expect(component.manageColumnsClick).toBeInstanceOf(EventEmitter);
      expect(component.exportClick).toBeInstanceOf(EventEmitter);
    });
  });
});
