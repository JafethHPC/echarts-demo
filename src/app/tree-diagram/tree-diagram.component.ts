import {
  Component,
  AfterViewInit,
  HostListener,
  OnDestroy,
  ElementRef,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  NgZone,
} from '@angular/core';
import * as echarts from 'echarts';
import data from './data.json';
import { TreeDiagramConfigService } from './tree-diagram-config.service';
import { ChartFonts, NodeData, TableRow } from './tree-diagram.model';

/**
 * Tree Diagram Component
 *
 * This component displays an organizational structure diagram using ECharts.
 * It shows relationships between Portfolio, PDT, and Teams with interactive nodes.
 * Clicking on a node displays detailed information in a table.
 */
@Component({
  selector: 'app-tree-diagram',
  templateUrl: './tree-diagram.component.html',
  styleUrls: ['./tree-diagram.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class TreeDiagramComponent implements AfterViewInit, OnDestroy {
  /** The ECharts instance */
  private chart: echarts.ECharts | null = null;

  /** Currently selected node name (null when no node is selected) */
  selectedNode: string | null = null;

  /** Headers for the details table */
  tableHeaders: string[] = [];

  /** Data rows for the details table */
  tableData: TableRow[] = [];

  /** Search term for filtering table data */
  searchTerm = '';

  /** Grid pagination settings */
  public pageSize = 5;
  public pageSizes = [5, 10, 20];
  public currentPage = 0;

  /** Computed total pages based on current data and page size */
  get totalPages(): number {
    return Math.ceil(this.filteredTableData.length / this.pageSize);
  }

  /** Paginated data for the current page */
  paginatedData: TableRow[] = [];

  /**
   * Filtered table data based on search term
   * Returns all data when search is empty, or filtered results when searching
   */
  get filteredTableData(): TableRow[] {
    let filteredData = this.tableData;

    // Apply global search if present
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

  /**
   * Constructor
   * @param elementRef Reference to the host element
   */
  constructor(
    private elementRef: ElementRef,
    public changeDetectorRef: ChangeDetectorRef,
    private ngZone: NgZone,
    private configService: TreeDiagramConfigService
  ) {}

  /**
   * Initialize the chart after the view is initialized
   */
  ngAfterViewInit() {
    setTimeout(() => {
      this.initChart();
    }, 0);
  }

  /**
   * Clean up resources when the component is destroyed
   */
  ngOnDestroy() {
    if (this.chart) {
      this.chart.dispose();
      this.chart = null;
    }
  }

  /**
   * Handle window resize events to resize the chart
   * @param event Resize event
   */
  @HostListener('window:resize')
  onResize() {
    if (!this.chart) return;

    this.chart.resize();

    const chartDom = document.getElementById('chart') as HTMLElement;
    if (!chartDom) return;

    const containerWidth = chartDom.offsetWidth;
    const centerX = containerWidth / 2;

    // Get responsive scale
    const scale = this.configService.getResponsiveScale(containerWidth);

    // Get font settings based on scale
    const fonts = this.configService.getChartFonts(scale);

    // Get node positions and update them
    const options = this.chart.getOption();
    const nodesOption = this.getNodesFromOption(options);
    if (!nodesOption) return;

    this.updateNodePositions(
      nodesOption,
      containerWidth,
      centerX,
      scale,
      fonts
    );

    // Update chart options
    this.chart.setOption({
      series: [
        {
          data: nodesOption,
          center: ['50%', '45%'],
          zoom: this.configService.getZoomLevel(scale),
        },
      ],
    });
  }

  private getNodesFromOption(options: any): NodeData[] | null {
    if (
      !options ||
      !options.series ||
      !Array.isArray(options.series) ||
      options.series.length === 0
    ) {
      return null;
    }

    const series = options.series[0];
    if (!series || !series.data || !Array.isArray(series.data)) {
      return null;
    }

    return series.data as NodeData[];
  }

  private updateNodePositions(
    nodes: NodeData[],
    containerWidth: number,
    centerX: number,
    scale: number,
    fonts: ChartFonts
  ) {
    // Calculate node positions
    const nodeSpacing = Math.min(containerWidth / 4, 240 * scale);
    const portfolioX = centerX - nodeSpacing;
    const pdtX = centerX;
    const teamsX = centerX + nodeSpacing;

    const bottomRowSpacing = Math.min(containerWidth / 7, 100 * scale);
    const bottomRowWidth = 3 * bottomRowSpacing;
    const bottomRowStartX = teamsX - bottomRowWidth / 2;

    for (const node of nodes) {
      switch (node.name) {
        case 'Portfolio':
        case 'PDT':
        case 'TEAMS':
          node.x =
            node.name === 'Portfolio'
              ? portfolioX
              : node.name === 'PDT'
              ? pdtX
              : teamsX;
          node.y = 150 * scale;
          node.symbolSize = fonts.mainNodeSize;
          if (node.label?.rich) {
            node.label.rich.name.fontSize = fonts.mainFont;
            node.label.rich.title.fontSize = fonts.mainTitleFont;
          }
          break;
        case 'vertical-junction':
        case 'horizontal-line':
          node.x = teamsX;
          node.y = 270 * scale;
          break;
        case 'Team\nMember':
        case 'AIT':
        case 'Team\nBacklog':
        case 'SPK':
          const index = this.configService.NODE_TYPES.CONTRIBUTOR.indexOf(
            node.name
          );
          node.x = bottomRowStartX + index * bottomRowSpacing;
          node.y = 380 * scale;
          node.symbolSize = fonts.teamNodeSize;
          if (node.label) {
            node.label.fontSize =
              node.name === 'Team\nMember'
                ? fonts.memberFont
                : fonts.memberBoldFont;
          }
          break;
        case 'v1':
        case 'v2':
        case 'v3':
        case 'v4':
          const vIndex = parseInt(node.name.replace('v', '')) - 1;
          node.x = bottomRowStartX + vIndex * bottomRowSpacing;
          node.y = 270 * scale;
          break;
      }
    }
  }

  /**
   * Initialize the ECharts diagram
   * Creates the tree diagram with interactive nodes
   */
  private initChart() {
    const chartDom = document.getElementById('chart');
    if (!chartDom) {
      console.error('Chart container #chart not found');
      return;
    }

    const containerWidth = chartDom.offsetWidth;
    const centerX = containerWidth / 2;
    const scale = this.configService.getResponsiveScale(containerWidth);
    const fonts = this.configService.getChartFonts(scale);

    this.chart = echarts.init(chartDom);

    // Initialize node data counts
    this.updateNodeDataCounts();

    // Set up click handler
    this.setupChartClickHandler(fonts.mainNodeSize, fonts.teamNodeSize);

    // Get chart options
    const option = this.configService.getChartOptions(
      containerWidth,
      centerX,
      scale,
      fonts.mainNodeSize,
      fonts.teamNodeSize,
      fonts.mainFont,
      fonts.mainTitleFont,
      fonts.memberFont,
      fonts.memberBoldFont,
      this.formatNodeLabel.bind(this),
      this.getNodeLabel.bind(this)
    );

    // Apply options to chart
    this.chart.setOption(option as echarts.EChartsOption);

    // Apply formatting and update node labels
    setTimeout(() => {
      if (this.chart) {
        this.chart.resize();
        this.onResize();
        this.updateNodeLabels();
      }
    }, 100);
  }

  private setupChartClickHandler(mainNodeSize: number, teamNodeSize: number) {
    if (!this.chart) return;

    this.chart.on('click', (params: any) => {
      if (params.dataType !== 'node') return;

      // Skip junction nodes
      if (
        params.name.startsWith('v') ||
        params.name === 'vertical-junction' ||
        params.name === 'horizontal-line'
      )
        return;

      // Toggle selection
      if (this.selectedNode === params.name) {
        this.resetSelectedNode();
        return;
      }

      // Handle node selection
      this.ngZone.run(() => {
        // Update node sizes (highlight selected node)
        this.updateNodeSizes(params.name, mainNodeSize, teamNodeSize);

        // Generate table data and update UI
        this.generateTableData(params.name);
        this.updateNodeLabels();
        this.changeDetectorRef.markForCheck();
      });
    });
  }

  private updateNodeSizes(
    selectedName: string,
    mainNodeSize: number,
    teamNodeSize: number
  ) {
    if (!this.chart) return;

    const options = this.chart.getOption();
    const nodesOption = this.getNodesFromOption(options);
    if (!nodesOption) return;

    const normalSizes: Record<string, number> = {
      Portfolio: mainNodeSize,
      PDT: mainNodeSize,
      TEAMS: mainNodeSize,
      'Team\nMember': teamNodeSize,
      AIT: teamNodeSize,
      'Team\nBacklog': teamNodeSize,
      SPK: teamNodeSize,
    };

    // Reset sizes first
    nodesOption.forEach((node: NodeData) => {
      if (normalSizes[node.name]) {
        node.symbolSize = normalSizes[node.name];
      }
    });

    // Make clicked node bigger
    const clickedNode = nodesOption.find(
      (n: NodeData) => n.name === selectedName
    );
    if (clickedNode && normalSizes[clickedNode.name]) {
      clickedNode.symbolSize = normalSizes[clickedNode.name] * 1.15;
    }

    this.chart.setOption({ series: [{ data: nodesOption }] });
  }

  /**
   * Update paginated data based on current page and page size
   */
  updatePaginatedData(): void {
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedData = this.filteredTableData.slice(start, end);
    this.changeDetectorRef.markForCheck();
  }

  /**
   * Handle page size change
   */
  onPageSizeChange(): void {
    this.currentPage = 0;
    this.updatePaginatedData();
  }

  /**
   * Generate the table data based on the clicked node
   * Each node type has different table columns and dummy data
   * @param nodeName The name of the clicked node
   */
  private generateTableData(nodeName: string): void {
    this.selectedNode = nodeName;
    this.currentPage = 0;
    this.columnFilters = {};

    // Get headers for this node type
    this.tableHeaders = this.configService.getTableHeaders(nodeName);

    // Initialize column filters
    this.tableHeaders.forEach((h) => (this.columnFilters[h] = ''));

    // Get data for the selected node
    this.tableData = this.getNodeDataArray(nodeName);

    // Update paginated data
    this.updatePaginatedData();

    // Update node data counts
    this.updateNodeDataCounts();
  }

  /**
   * Updates node labels to show/hide the plus icon based on data availability
   */
  private updateNodeLabels(): void {
    if (!this.chart) return;

    const options = this.chart.getOption();
    const nodesOption = this.getNodesFromOption(options);
    if (!nodesOption) return;

    this.configService.NODE_TYPES.CONTRIBUTOR.forEach((nodeName) => {
      const node = nodesOption.find((n: NodeData) => n.name === nodeName);
      if (node) {
        const nodeLabel = this.getNodeLabel(nodeName);
        if (nodeLabel) {
          node.label = nodeLabel;
        }
      }
    });

    this.chart.setOption({ series: [{ data: nodesOption }] });
  }

  // Add a helper method to format node labels with dynamic sizing
  /**
   * Formats a node label with proper text wrapping and dynamic sizing
   * @param name The main name text to display
   * @param title The subtitle text to display
   * @param baseSize The base font size before adjustment
   * @param isLight Whether the background is light (true) or dark (false)
   * @returns Formatted label configuration
   */
  private formatNodeLabel(
    name: string,
    title: string,
    baseSize: number,
    isLight: boolean
  ): any {
    // Handle long names by adding line breaks if needed
    let nameText = name;
    const maxLength = 12;

    // Adjust font size based on text length
    let fontSize = baseSize;
    if (name.length > 15) {
      fontSize = baseSize * 0.85;
    } else if (name.length > 10) {
      fontSize = baseSize * 0.9;
    }

    // Add manual line breaks for long text
    if (name.length > maxLength && !name.includes('\n')) {
      const halfIndex = Math.floor(name.length / 2);
      let breakIndex = name.lastIndexOf(' ', halfIndex);

      if (breakIndex === -1 || breakIndex < 3) {
        breakIndex = name.indexOf(' ', halfIndex);
      }

      if (breakIndex === -1) {
        breakIndex = halfIndex;
      }

      nameText =
        name.substring(0, breakIndex) +
        '\n' +
        name.substring(breakIndex).trim();
    }

    return {
      formatter: `{name|${nameText}}\n{title|${title}}`,
      rich: {
        name: {
          fontSize,
          fontWeight: 'normal',
          lineHeight: 26,
          color: isLight ? '#000000' : '#FFFFFF',
          fontFamily: 'Connections, Arial, sans-serif',
          padding: [0, 0, 0, 0],
        },
        title: {
          fontSize: baseSize * 0.65,
          fontWeight: 'normal',
          lineHeight: 18,
          color: isLight ? '#000000' : '#FFFFFF',
          fontFamily: 'Connections, Arial, sans-serif',
        },
      },
    };
  }

  // Store node data counts dynamically
  nodeDataCounts: Record<string, number> = {
    'Team\nMember': 0,
    AIT: 0,
    'Team\nBacklog': 0,
    SPK: 0,
  };

  // Helper to get the data array for a node
  private getNodeDataArray(nodeName: string): TableRow[] {
    switch (nodeName) {
      case 'Team\nMember':
        return data['Team Member'] as TableRow[];
      case 'AIT':
        return data['AIT'] as TableRow[];
      case 'Team\nBacklog':
        return data['Team Backlog'] as TableRow[];
      case 'SPK':
        return data['SPK'] as TableRow[];
      case 'Portfolio':
        return data['Portfolio'] as TableRow[];
      case 'PDT':
        return data['PDT'] as TableRow[];
      case 'TEAMS':
        return data['Team'] as TableRow[];
      default:
        return [];
    }
  }

  // Call this after any data change to update nodeDataCounts
  private updateNodeDataCounts(): void {
    this.configService.NODE_TYPES.CONTRIBUTOR.forEach((name) => {
      if (name === this.selectedNode) {
        this.nodeDataCounts[name] = this.tableData.length;
      } else {
        this.nodeDataCounts[name] = this.getNodeDataArray(name).length;
      }
    });
  }

  /**
   * Reset the selected node, table, and chart node sizes/labels
   */
  private resetSelectedNode(): void {
    this.selectedNode = null;
    this.tableHeaders = [];
    this.tableData = [];

    if (this.chart) {
      // Reset all node sizes
      const options = this.chart.getOption();
      const nodesOption = this.getNodesFromOption(options);
      if (!nodesOption) return;

      const normalSizes: Record<string, number> = {
        Portfolio: 210,
        PDT: 210,
        TEAMS: 210,
        'Team\nMember': 100,
        AIT: 100,
        'Team\nBacklog': 100,
        SPK: 100,
      };

      nodesOption.forEach((node: NodeData) => {
        if (normalSizes[node.name]) {
          node.symbolSize = normalSizes[node.name];
        }
      });

      this.chart.setOption({ series: [{ data: nodesOption }] });
      this.updatePaginatedData();
      this.updateNodeLabels();
      this.changeDetectorRef.markForCheck();
    }
  }

  // Add this property to the class:
  columnFilters: { [key: string]: string } = {};

  // Add these properties to the class:
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';

  // Add this method:
  onSort(header: string): void {
    if (this.sortColumn === header) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = header;
      this.sortDirection = 'asc';
    }
    this.updatePaginatedData();
  }

  private getNodeLabel(nodeName: string): any {
    const noData = this.nodeDataCounts[nodeName] === 0;

    if (this.configService.NODE_TYPES.CONTRIBUTOR.includes(nodeName)) {
      let baseFont = nodeName === 'Team\nMember' ? 14 : 16;
      let fontWeight = nodeName === 'Team\nBacklog' ? '300' : 'normal';

      return {
        formatter: noData ? `${nodeName}\n{plus|+}` : nodeName,
        fontSize: baseFont,
        fontWeight,
        lineHeight: 18,
        color: '#000000',
        fontFamily: 'Connections, Arial, sans-serif',
        rich: noData
          ? {
              plus: {
                fontSize: 20,
                fontWeight: 'bold',
                color: '#000000',
                lineHeight: 24,
              },
            }
          : undefined,
      };
    }

    return null;
  }
}
