import {
  Component,
  AfterViewInit,
  HostListener,
  OnDestroy,
  ElementRef,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import * as echarts from 'echarts';
import { TeamStructureService } from './team-structure.service';
import { TeamStructureConfigService } from './team-structure-config.service';
import {
  ChartFonts,
  NodeData,
  TeamStructureData,
} from './team-structure.model';
import { Subscription } from 'rxjs';
import { AlignmentService, Alignment } from './alignment.service';
import {
  GridDataResult,
  DataStateChangeEvent,
  SelectableSettings,
  SelectionEvent,
} from '@progress/kendo-angular-grid';
import { State } from '@progress/kendo-data-query';

/**
 * Team Structure Component
 *
 * This component displays an organizational structure diagram using ECharts.
 * It shows relationships between Portfolio, PDT, and Teams with interactive nodes.
 * When a node is clicked, it displays alignments data in a Kendo grid.
 */
@Component({
  selector: 'app-team-structure',
  templateUrl: './team-structure.component.html',
  styleUrls: ['./team-structure.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class TeamStructureComponent implements AfterViewInit, OnDestroy {
  // -------------- CHART PROPERTIES --------------

  /** The ECharts instance */
  private chart: echarts.ECharts | null = null;

  /** Currently selected node name (null when no node is selected) */
  selectedNode: string | null = null;

  /** The team structure data from service */
  private teamStructureData: TeamStructureData | null = null;

  // Store node data counts dynamically
  nodeDataCounts: Record<string, number> = {
    AIT: 0,
    'Team Backlog': 0,
    SPK: 0,
    'Jira Board': 0,
  };

  // -------------- GRID PROPERTIES --------------

  /** Flag to track if a grid row is selected */
  rowSelected: boolean = false;

  /** Alignment data for the grid */
  alignmentData: Alignment[] = [];

  /** Selected node ID for alignments */
  private selectedNodeId: string = '';

  /** Subscriptions to clean up */
  private subscriptions: Subscription[] = [];

  /** Grid view for Kendo UI Grid */
  public gridView: GridDataResult = {
    data: [],
    total: 0,
  };

  /** Grid state for Kendo UI Grid */
  public gridState: State = {
    sort: [],
    skip: 0,
    take: 10,
    filter: {
      logic: 'and',
      filters: [],
    },
  };

  /** Selection settings for Kendo UI Grid */
  public selectableSettings: SelectableSettings = {
    checkboxOnly: false,
    mode: 'single',
  };

  /**
   * Constructor
   */
  constructor(
    private elementRef: ElementRef,
    public changeDetectorRef: ChangeDetectorRef,
    private configService: TeamStructureConfigService,
    private teamStructureService: TeamStructureService,
    private alignmentService: AlignmentService
  ) {}

  // -------------- LIFECYCLE HOOKS --------------

  /**
   * Initialize the chart after the view is initialized
   */
  ngAfterViewInit(): void {
    // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.loadTeamStructureData();
      this.initChart();
    }, 0);
  }

  /**
   * Clean up resources when the component is destroyed
   */
  ngOnDestroy(): void {
    this.disposeChart();
    this.unsubscribeAll();
  }

  /**
   * Dispose chart to prevent memory leaks
   */
  private disposeChart(): void {
    if (this.chart) {
      this.chart.dispose();
      this.chart = null;
    }
  }

  /**
   * Unsubscribe from all subscriptions
   */
  private unsubscribeAll(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];
  }

  /**
   * Load team structure data from service
   */
  private loadTeamStructureData(): void {
    this.teamStructureData = this.teamStructureService.getTeamStructureData();
  }

  // -------------- CHART INITIALIZATION --------------

  /**
   * Initialize the ECharts diagram
   * Creates the tree diagram with interactive nodes
   */
  private initChart(): void {
    const chartDom = document.getElementById('chart');
    if (!chartDom) {
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
    this.setupChartClickHandler();

    // Get chart options
    const option = this.createChartOptions(
      containerWidth,
      centerX,
      scale,
      fonts
    );

    // Set zoom for small windows
    if (containerWidth <= 750) {
      option.series[0].zoom = 0.8;
    }

    this.chart.setOption(option as echarts.EChartsOption);

    // Apply formatting and update node labels
    this.applyChartFormatting();
  }

  /**
   * Apply formatting and update node labels after short delay
   */
  private applyChartFormatting(): void {
    setTimeout(() => {
      if (this.chart) {
        this.chart.resize();
        this.onResize();
        this.updateNodeLabels();
      }
    }, 100);
  }

  /**
   * Create chart options with current data
   */
  private createChartOptions(
    containerWidth: number,
    centerX: number,
    scale: number,
    fonts: ChartFonts
  ): any {
    if (!this.teamStructureData) {
      return this.configService.getChartOptions(
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
        this.getNodeLabel.bind(this),
        '',
        '',
        '',
        null
      );
    }

    return this.configService.getChartOptions(
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
      this.getNodeLabel.bind(this),
      this.teamStructureData.portfolioName ?? '',
      this.teamStructureData.children?.[0]?.pdtname ?? '',
      this.teamStructureData.children?.[0]?.children?.[0]?.teamName ?? '',
      this.teamStructureData
    );
  }

  // -------------- CHART EVENT HANDLERS --------------

  /**
   * Handle window resize events to resize the chart
   */
  @HostListener('window:resize')
  onResize(): void {
    if (!this.chart) return;

    this.chart.resize();

    const chartDom = document.getElementById('chart') as HTMLElement;
    if (!chartDom) return;

    const containerWidth = chartDom.offsetWidth;
    const centerX = containerWidth / 2;

    // Get responsive scale and fonts
    const scale = this.configService.getResponsiveScale(containerWidth);
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

    // Set zoom: much larger for small windows
    const zoom = this.getZoomForWidth(containerWidth, scale);

    // Update chart options
    this.chart.setOption({
      series: [
        {
          data: nodesOption,
          center: ['50%', '50%'],
          zoom,
        },
      ],
    });

    // Re-apply selected node enlargement if any
    if (this.selectedNode) {
      this.updateNodeSizes(
        this.selectedNode,
        fonts.mainNodeSize,
        fonts.teamNodeSize
      );
    }

    // Ensure label font sizes update on resize
    this.updateNodeLabels();
  }

  /**
   * Get appropriate zoom level based on container width
   */
  private getZoomForWidth(containerWidth: number, scale: number): number {
    if (containerWidth <= 750) {
      return 0.8;
    }
    return this.configService.getZoomLevel(scale);
  }

  /**
   * Set up chart click handler
   */
  private setupChartClickHandler(): void {
    if (!this.chart) return;

    this.chart.on('click', (params: any) => {
      // Check if params has necessary data
      if (!params.data?.name) {
        return;
      }

      const nodeName = params.data.name as string;

      // Skip non-interactive nodes
      if (this.isNonInteractiveNode(nodeName)) {
        return;
      }

      // Toggle selection - if same node clicked, deselect it
      if (this.selectedNode === nodeName) {
        this.resetSelectedNode();
        return;
      }

      this.handleNodeSelection(nodeName);
    });
  }

  /**
   * Handle node selection when a node is clicked
   */
  private handleNodeSelection(nodeName: string): void {
    // Set selected node
    this.selectedNode = nodeName;

    // Get node ID based on node type
    this.selectedNodeId = this.getNodeIdByType(nodeName);

    // Reset row selection state when switching nodes
    this.rowSelected = false;

    // Update visual appearance
    const scale = this.getCurrentScale();
    const fonts = this.configService.getChartFonts(scale);
    this.updateNodeSizes(nodeName, fonts.mainNodeSize, fonts.teamNodeSize);

    // Load alignment data for the grid
    this.loadAlignmentData(nodeName, this.selectedNodeId);

    // Trigger change detection
    this.changeDetectorRef.markForCheck();
  }

  // -------------- NODE HELPERS --------------

  /**
   * Check if a node is non-interactive
   */
  private isNonInteractiveNode(nodeName: string): boolean {
    return [
      'vertical-junction',
      'horizontal-line',
      'v1',
      'v2',
      'v3',
      'v4',
    ].includes(nodeName);
  }

  /**
   * Get node ID based on node type
   */
  private getNodeIdByType(nodeName: string): string {
    if (!this.teamStructureData) return '0';

    switch (nodeName) {
      case 'Portfolio':
        return this.teamStructureData.portfolioId?.toString() || '0';
      case 'PDT':
        return this.teamStructureData.children?.[0]?.pdtid?.toString() || '0';
      case 'Team':
        return (
          this.teamStructureData.children?.[0]?.children?.[0]?.teamId?.toString() ||
          '0'
        );
      default:
        return '0';
    }
  }

  /**
   * Get current scale based on chart container width
   */
  public getCurrentScale(): number {
    const chartDom = document.getElementById('chart');
    return this.configService.getResponsiveScale(chartDom?.offsetWidth || 1000);
  }

  /**
   * Extract nodes from chart options
   */
  private getNodesFromOption(options: any): NodeData[] | null {
    if (!options?.series?.[0]?.data || !Array.isArray(options.series[0].data)) {
      return null;
    }

    return options.series[0].data as NodeData[];
  }

  // -------------- NODE POSITIONING AND STYLING --------------

  /**
   * Update node positions based on container size
   */
  private updateNodePositions(
    nodes: NodeData[],
    containerWidth: number,
    centerX: number,
    scale: number,
    fonts: ChartFonts
  ): void {
    // Calculate node positions
    const nodeSpacing = Math.min(containerWidth / 4, 240 * scale);
    const portfolioX = centerX - nodeSpacing;
    const pdtX = centerX;
    const teamsX = centerX + nodeSpacing;

    const bottomRowSpacing = Math.min(containerWidth / 7, 100 * scale);
    const bottomRowWidth = 3 * bottomRowSpacing;
    const bottomRowStartX = teamsX - bottomRowWidth / 2;

    for (const node of nodes) {
      this.positionNode(
        node,
        portfolioX,
        pdtX,
        teamsX,
        bottomRowStartX,
        bottomRowSpacing,
        scale,
        fonts
      );
    }
  }

  /**
   * Position a specific node based on its type
   */
  private positionNode(
    node: NodeData,
    portfolioX: number,
    pdtX: number,
    teamsX: number,
    bottomRowStartX: number,
    bottomRowSpacing: number,
    scale: number,
    fonts: ChartFonts
  ): void {
    switch (node.name) {
      case 'Portfolio':
      case 'PDT':
      case 'Team':
        this.positionMainNode(node, portfolioX, pdtX, teamsX, scale, fonts);
        break;
      case 'vertical-junction':
      case 'horizontal-line':
        node.x = teamsX;
        node.y = 270 * scale;
        break;
      case 'AIT':
      case 'SPK':
      case 'Team Backlog':
      case 'Jira Board':
        this.positionContributorNode(
          node,
          bottomRowStartX,
          bottomRowSpacing,
          scale,
          fonts
        );
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

  /**
   * Position a main node (Portfolio, PDT, Team)
   */
  private positionMainNode(
    node: NodeData,
    portfolioX: number,
    pdtX: number,
    teamsX: number,
    scale: number,
    fonts: ChartFonts
  ): void {
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
  }

  /**
   * Position a contributor node (AIT, SPK, Team Backlog, Jira Board)
   */
  private positionContributorNode(
    node: NodeData,
    bottomRowStartX: number,
    bottomRowSpacing: number,
    scale: number,
    fonts: ChartFonts
  ): void {
    const index = this.configService.NODE_TYPES.CONTRIBUTOR.indexOf(node.name);
    node.x = bottomRowStartX + index * bottomRowSpacing;
    node.y = (270 + (380 - 270) * 0.6) * scale;
    node.symbolSize = fonts.teamNodeSize;
  }

  /**
   * Update node sizes to highlight selected node
   */
  private updateNodeSizes(
    selectedName: string,
    mainNodeSize: number,
    teamNodeSize: number
  ): void {
    if (!this.chart) return;

    const options = this.chart.getOption();
    const nodesOption = this.getNodesFromOption(options);
    if (!nodesOption) return;

    const normalSizes: Record<string, number> = {
      Portfolio: mainNodeSize,
      PDT: mainNodeSize,
      Team: mainNodeSize,
      AIT: teamNodeSize,
      SPK: teamNodeSize,
      'Team Backlog': teamNodeSize,
      'Jira Board': teamNodeSize,
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

  /**
   * Reset selected node state
   */
  public resetSelectedNode(): void {
    if (!this.selectedNode || !this.chart) return;

    // Clear selection state
    this.selectedNode = null;
    this.selectedNodeId = '';
    this.alignmentData = [];
    this.rowSelected = false;

    // Reset node sizes
    const scale = this.getCurrentScale();
    const fonts = this.configService.getChartFonts(scale);

    // Get current nodes
    const options = this.chart.getOption();
    const nodes = this.getNodesFromOption(options);
    if (!nodes) return;

    // Reset all node sizes
    this.resetAllNodeSizes(nodes, fonts);

    // Trigger change detection
    this.changeDetectorRef.markForCheck();
  }

  /**
   * Reset all nodes to their normal sizes
   */
  private resetAllNodeSizes(nodes: NodeData[], fonts: ChartFonts): void {
    for (const node of nodes) {
      if (
        this.configService.NODE_TYPES.MAIN.includes(node.name) ||
        node.name === 'Team'
      ) {
        node.symbolSize = fonts.mainNodeSize;
      } else if (
        this.configService.NODE_TYPES.CONTRIBUTOR.includes(node.name)
      ) {
        node.symbolSize = fonts.teamNodeSize;
      }
    }

    // Update chart
    this.chart?.setOption({
      series: [{ data: nodes }],
    });
  }

  // -------------- NODE DATA AND LABELS --------------

  /**
   * Call this after any data change to update nodeDataCounts
   */
  private updateNodeDataCounts(): void {
    // Reset counts
    this.nodeDataCounts = {
      AIT: 0,
      'Team Backlog': 0,
      SPK: 0,
      'Jira Board': 0,
    };

    if (!this.teamStructureData) return;

    // Find the first team's children which contain our node counts
    const teamChildren =
      this.teamStructureData.children?.[0]?.children?.[0]?.children;

    if (!teamChildren) return;

    // Update counts from the nested structure
    teamChildren.forEach((child: any) => {
      if (this.nodeDataCounts.hasOwnProperty(child.name)) {
        this.nodeDataCounts[child.name] = child.count;
      }
    });
  }

  /**
   * Get node label configuration based on node type
   */
  private getNodeLabel(nodeName: string): any {
    // Get current scale to ensure font sizes are consistent
    const scale = this.getCurrentScale();
    const fonts = this.configService.getChartFonts(scale);

    // Main nodes: show name and subtitle from teamStructureData
    if (nodeName === 'Portfolio') {
      return this.createMainNodeLabel(
        this.teamStructureData?.portfolioName ?? '',
        'Portfolio',
        fonts
      );
    }

    if (nodeName === 'PDT') {
      return this.createMainNodeLabel(
        this.teamStructureData?.children?.[0]?.pdtname ?? '',
        'PDT',
        fonts
      );
    }

    if (nodeName === 'Team') {
      return this.createMainNodeLabel(
        this.teamStructureData?.children?.[0]?.children?.[0]?.teamName ?? '',
        'Team',
        fonts
      );
    }

    // Bottom nodes: show count or plus
    if (this.configService.NODE_TYPES.CONTRIBUTOR.includes(nodeName)) {
      return this.createContributorNodeLabel(nodeName, fonts);
    }

    return null;
  }

  /**
   * Create label for main nodes (Portfolio, PDT, Team)
   */
  private createMainNodeLabel(
    name: string,
    title: string,
    fonts: ChartFonts
  ): any {
    return {
      formatter: `{name|${name}}\n{title|${title}}`,
      rich: {
        name: {
          fontSize: fonts.mainFont,
          fontWeight: 'normal',
          lineHeight: 26,
          color: '#000000',
          fontFamily: 'Connections, Arial, sans-serif',
          padding: [0, 0, 0, 0],
        },
        title: {
          fontSize: fonts.mainTitleFont,
          fontWeight: 'normal',
          lineHeight: 18,
          color: '#000000',
          fontFamily: 'Connections, Arial, sans-serif',
        },
      },
    };
  }

  /**
   * Create label for contributor nodes (AIT, Team Backlog, etc.)
   */
  private createContributorNodeLabel(nodeName: string, fonts: ChartFonts): any {
    const count = this.nodeDataCounts[nodeName];
    const noData = count === 0;

    // Force line break for Team Backlog
    const displayName =
      nodeName === 'Team Backlog' ? 'Team\nBacklog' : nodeName;

    return {
      formatter: noData
        ? `{name|${displayName}}\n{plus|+}`
        : `{name|${displayName}}\n{count|${count}}`,
      rich: {
        name: {
          fontSize: fonts.memberBoldFont,
          fontWeight: 'normal',
          lineHeight: 18,
          color: '#000000',
          fontFamily: 'Connections, Arial, sans-serif',
        },
        plus: {
          fontSize: fonts.memberBoldFont,
          fontWeight: 'bold',
          color: '#000000',
          lineHeight: 24,
        },
        count: {
          fontSize: fonts.memberBoldFont,
          fontWeight: 'bold',
          color: '#000000',
          lineHeight: 20,
        },
      },
    };
  }

  /**
   * Formats a node label with proper text wrapping and dynamic sizing
   */
  private formatNodeLabel(
    name: string,
    title: string,
    baseSize: number,
    isLight: boolean
  ): any {
    // Adjust name text for long names
    const nameText = this.formatLongText(name, 12);

    // Adjust font size based on text length
    const fontSize = this.calculateFontSize(name, baseSize);

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

  /**
   * Format long text by adding line breaks
   */
  private formatLongText(text: string, maxLength: number): string {
    if (text.length <= maxLength || text.includes('\n')) {
      return text;
    }

    const halfIndex = Math.floor(text.length / 2);
    let breakIndex = text.lastIndexOf(' ', halfIndex);

    if (breakIndex === -1 || breakIndex < 3) {
      breakIndex = text.indexOf(' ', halfIndex);
    }

    if (breakIndex === -1) {
      breakIndex = halfIndex;
    }

    return (
      text.substring(0, breakIndex) + '\n' + text.substring(breakIndex).trim()
    );
  }

  /**
   * Calculate font size based on text length
   */
  private calculateFontSize(text: string, baseSize: number): number {
    if (text.length > 15) {
      return baseSize * 0.85;
    }
    if (text.length > 10) {
      return baseSize * 0.9;
    }
    return baseSize;
  }

  // -------------- GRID FUNCTIONALITY --------------

  /**
   * Load alignment data based on the selected node
   * Gets data from AlignmentService and processes it for the grid
   */
  private loadAlignmentData(nodeName: string, nodeId: string): void {
    // Get the alignment data from the service based on the selected node
    this.alignmentData = this.alignmentService.getAlignments(
      nodeName,
      this.teamStructureData || {}
    );

    // Process the data with current grid state
    this.updateGridView();
  }

  /**
   * Update grid view with current alignment data and grid state
   * Uses simplified data handling for better performance
   */
  private updateGridView(): void {
    if (!this.alignmentData.length) {
      this.gridView = { data: [], total: 0 };
      return;
    }

    const skip = this.gridState.skip || 0;
    const take = this.gridState.take || 10;

    // Apply pagination
    const paginatedData = this.alignmentData.slice(skip, skip + take);

    this.gridView = {
      data: paginatedData,
      total: this.alignmentData.length,
    };

    // Trigger change detection to update the UI
    this.changeDetectorRef.markForCheck();
  }

  /**
   * Handle data state changes in the grid (sorting, filtering, paging)
   */
  public dataStateChange(state: DataStateChangeEvent): void {
    this.gridState = state;

    // If we have sort state, apply it
    if (state.sort && state.sort.length > 0) {
      const dir = state.sort[0].dir === 'asc';
      const field = state.sort[0].field;

      this.alignmentData = [...this.alignmentData].sort((a: any, b: any) => {
        const valA = a[field];
        const valB = b[field];

        if (valA < valB) return dir ? -1 : 1;
        if (valA > valB) return dir ? 1 : -1;
        return 0;
      });
    }

    this.updateGridView();
  }

  /**
   * Handle row selection in the grid
   */
  public onRowSelect(event: SelectionEvent): void {
    // Check selection status
    const hasSelectedRows = !!(
      event.selectedRows && event.selectedRows.length > 0
    );

    // Always set a definitive true/false value based on selected rows
    this.rowSelected = hasSelectedRows;

    // Force change detection to update the UI
    this.changeDetectorRef.markForCheck();
  }
}
