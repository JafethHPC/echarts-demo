import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { TableRow } from '../tree-diagram.model';

@Component({
  selector: 'app-tree-table',
  templateUrl: './tree-table.component.html',
  styleUrls: ['./tree-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class TreeTableComponent implements OnChanges {
  // Inputs from parent component
  @Input() selectedNode: string | null = null;
  @Input() tableHeaders: string[] = [];
  @Input() tableData: TableRow[] = [];

  // Pagination properties
  pageSize = 5;
  pageSizes = [5, 10, 20];
  currentPage = 0;
  paginatedData: TableRow[] = [];

  // Filtering and sorting
  searchTerm = '';
  columnFilters: { [key: string]: string } = {};
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges) {
    // Reset pagination, filters, and sorting when data or headers change
    if (changes['tableData'] || changes['tableHeaders']) {
      this.currentPage = 0;
      this.sortColumn = null;
      this.sortDirection = 'asc';
      this.columnFilters = {};
      this.tableHeaders.forEach((h) => (this.columnFilters[h] = ''));
      this.updatePaginatedData();
    }
  }

  // Computed property for total pages
  get totalPages(): number {
    return Math.ceil(this.filteredTableData.length / this.pageSize);
  }

  // Computed property for filtered data
  get filteredTableData(): TableRow[] {
    let filteredData = this.tableData;

    // Apply global search
    if (this.searchTerm?.trim()) {
      const searchTermLower = this.searchTerm.toLowerCase();
      filteredData = filteredData.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(searchTermLower)
        )
      );
    }

    // Apply column filters
    Object.entries(this.columnFilters).forEach(([header, filter]) => {
      if (filter?.trim()) {
        const filterLower = filter.toLowerCase();
        filteredData = filteredData.filter((row) =>
          String(row[header] ?? '')
            .toLowerCase()
            .includes(filterLower)
        );
      }
    });

    // Apply sorting
    if (this.sortColumn) {
      filteredData = [...filteredData].sort((a, b) => {
        const aVal = a[this.sortColumn!];
        const bVal = b[this.sortColumn!];

        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        const direction = this.sortDirection === 'asc' ? 1 : -1;
        return aVal < bVal ? -direction : aVal > bVal ? direction : 0;
      });
    }

    return filteredData;
  }

  // Update paginated data based on current filter/sort/page
  updatePaginatedData(): void {
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedData = this.filteredTableData.slice(start, end);
    this.changeDetectorRef.markForCheck();
  }

  // Handle page size change
  onPageSizeChange(): void {
    this.currentPage = 0;
    this.updatePaginatedData();
  }

  // Handle column sorting
  onSort(header: string): void {
    if (this.sortColumn === header) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = header;
      this.sortDirection = 'asc';
    }
    this.updatePaginatedData();
  }
}
