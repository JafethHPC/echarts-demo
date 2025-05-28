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

@Component({
  selector: 'app-alignment',
  templateUrl: './alignment.component.html',
  styleUrls: ['./alignment.component.scss'],
  standalone: false,
})
export class AlignmentComponent implements OnChanges {
  // ============================================================================
  // INPUT PROPERTIES
  // ============================================================================

  @Input() title: string = '';
  @Input() data: GridDataResult = { data: [], total: 0 };
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
  @Input() nodeType: string = '';
  @Input() rowSelected: boolean = false;
  @Input() showActionButtons: boolean = true;
  @Input() actions: string[] = ['add', 'delete', 'manage', 'export'];
  @Input() scale: number = 1;

  // ============================================================================
  // OUTPUT EVENTS
  // ============================================================================

  @Output() dataStateChange = new EventEmitter<DataStateChangeEvent>();
  @Output() selectionChange = new EventEmitter<SelectionEvent>();
  @Output() addClick = new EventEmitter<void>();
  @Output() deleteClick = new EventEmitter<void>();
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
  // CONSTRUCTOR & LIFECYCLE
  // ============================================================================

  constructor(private el: ElementRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['scale']) {
      this.el.nativeElement.style.setProperty(
        '--btn-scale',
        this.scale?.toString() || '1'
      );
    }
  }

  // ============================================================================
  // COMPUTED PROPERTIES
  // ============================================================================

  get showJiraColumns(): boolean {
    return ['Jira Board', 'Team Backlog', 'SPK'].includes(this.nodeType);
  }

  get showTeamColumns(): boolean {
    return ['Team', 'PDT', 'Portfolio'].includes(this.nodeType);
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

  onAddClick(): void {
    this.addClick.emit();
  }

  onDeleteClick(): void {
    this.deleteClick.emit();
  }

  onManageColumnsClick(): void {
    this.manageColumnsClick.emit();
  }

  onExportClick(): void {
    this.exportClick.emit();
  }
}
