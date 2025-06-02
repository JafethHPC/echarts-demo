import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  OnChanges,
  SimpleChanges,
  HostBinding,
} from '@angular/core';
import {
  GridDataResult,
  DataStateChangeEvent,
  SelectableSettings,
  SelectionEvent,
} from '@progress/kendo-angular-grid';
import { State } from '@progress/kendo-data-query';
import { PDTData } from '../pdt-structure.model';

@Component({
  selector: 'app-pdt-table',
  templateUrl: './pdt-table.component.html',
  styleUrls: ['./pdt-table.component.scss'],
  standalone: false,
})
export class PdtTableComponent implements OnChanges {
  // ============================================================================
  // INPUT PROPERTIES
  // ============================================================================

  @Input() title: string = '';
  @Input() pdtData: PDTData | null = null;
  @Input() state: State = {
    sort: [],
    skip: 0,
    take: 10,
    filter: { logic: 'and', filters: [] },
  };
  @Input() selectableSettings: SelectableSettings = {
    checkboxOnly: false,
    mode: 'single',
  };
  @Input() loading: boolean = false;
  @Input() rowSelected: boolean = false;
  @Input() showActionButtons: boolean = true;
  @Input() actions: string[] = ['manage', 'export'];
  @Input() scale: number = 1;

  // ============================================================================
  // OUTPUT EVENTS
  // ============================================================================

  @Output() dataStateChange = new EventEmitter<DataStateChangeEvent>();
  @Output() selectionChange = new EventEmitter<SelectionEvent>();
  @Output() manageColumnsClick = new EventEmitter<void>();
  @Output() exportClick = new EventEmitter<void>();

  // ============================================================================
  // HOST BINDING
  // ============================================================================

  @HostBinding('class.row-selected')
  get isRowSelected(): boolean {
    return this.rowSelected;
  }

  // ============================================================================
  // COMPONENT PROPERTIES
  // ============================================================================

  public gridView: GridDataResult = { data: [], total: 0 };

  // ============================================================================
  // CONSTRUCTOR & LIFECYCLE
  // ============================================================================

  constructor(private el: ElementRef) {}

  // ============================================================================
  // LIFECYCLE HOOKS
  // ============================================================================

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['scale']) {
      this.el.nativeElement.style.setProperty(
        '--btn-scale',
        this.scale?.toString() || '1'
      );
    }

    if (changes['pdtData']) {
      this.updateGridView();
    }
  }

  // ============================================================================
  // GRID FUNCTIONALITY
  // ============================================================================

  private updateGridView(): void {
    if (!this.pdtData) {
      this.gridView = { data: [], total: 0 };
      return;
    }

    // Convert PDT object to array format for grid display
    const pdtArray = [this.pdtData];

    const skip = this.state.skip || 0;
    const take = this.state.take || 10;
    const paginatedData = pdtArray.slice(skip, skip + take);

    this.gridView = {
      data: paginatedData,
      total: pdtArray.length,
    };
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  onDataStateChange(state: DataStateChangeEvent): void {
    this.dataStateChange.emit(state);
  }

  onSelectionChange(event: SelectionEvent): void {
    this.selectionChange.emit(event);
  }

  onManageColumnsClick(): void {
    this.manageColumnsClick.emit();
  }

  onExportClick(): void {
    this.exportClick.emit();
  }
}
