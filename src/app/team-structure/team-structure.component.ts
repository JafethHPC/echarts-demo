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
import {
  AlignmentService,
  Alignment,
  AlignmentType,
  Team,
} from './alignment.service';
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
 * Displays an organizational structure diagram using ECharts with interactive nodes.
 * Shows relationships between Portfolio, PDT, and Teams.
 * When a node is clicked, displays alignments data in a Kendo grid.
 */
@Component({
  selector: 'app-team-structure',
  templateUrl: './team-structure.component.html',
  styleUrls: ['./team-structure.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class TeamStructureComponent implements AfterViewInit, OnDestroy {
  // ============================================================================
  // CHART PROPERTIES
  // ============================================================================

  private chart: echarts.ECharts | null = null;
  private isResizing = false;
  private teamStructureData: TeamStructureData[] | null = null;

  // Layout tracking for dynamic height management
  private currentLayoutType: 'vertical' | 'compact' | 'default' = 'default';

  // Legend positioning tracking
  private currentLegendPosition: 'top-right' | 'top-center' = 'top-right';

  selectedNode: string | null = null;
  nodeDataCounts: Record<string, number> = {
    AIT: 0,
    'Team Backlog': 0,
    SPK: 0,
    'Jira Board': 0,
  };
  portfolioCount: number = 0;

  // ============================================================================
  // GRID PROPERTIES
  // ============================================================================

  rowSelected: boolean = false;
  alignmentData: Alignment[] = [];
  private subscriptions: Subscription[] = [];

  public gridView: GridDataResult = { data: [], total: 0 };
  public gridState: State = {
    sort: [],
    skip: 0,
    take: 10,
    filter: { logic: 'and', filters: [] },
  };
  public selectableSettings: SelectableSettings = {
    checkboxOnly: false,
    mode: 'single',
  };

  // ============================================================================
  // TEAM PROPERTIES
  // ============================================================================

  teamData: Team | null = null;
  public teamGridState: State = {
    sort: [],
    skip: 0,
    take: 10,
    filter: { logic: 'and', filters: [] },
  };

  // ============================================================================
  // CONSTRUCTOR & LIFECYCLE
  // ============================================================================

  constructor(
    private elementRef: ElementRef,
    public changeDetectorRef: ChangeDetectorRef,
    private configService: TeamStructureConfigService,
    private teamStructureService: TeamStructureService,
    private alignmentService: AlignmentService
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.loadTeamStructureData();
      this.initChart();
    }, 0);
  }

  ngOnDestroy(): void {
    this.disposeChart();
    this.unsubscribeAll();
  }

  // ============================================================================
  // CHART INITIALIZATION & MANAGEMENT
  // ============================================================================

  private loadTeamStructureData(): void {
    this.teamStructureData = this.teamStructureService.getTeamStructureData();
  }

  private initChart(): void {
    const chartDom = document.getElementById('chart');
    if (!chartDom) return;

    this.chart = echarts.init(chartDom, null, { renderer: 'canvas' });

    const containerWidth = chartDom.offsetWidth;
    const centerX = containerWidth / 2;
    const scale = this.configService.getResponsiveScale(containerWidth);
    const fonts = this.configService.getChartFonts(scale, containerWidth);

    // Set initial layout and height
    this.currentLayoutType = this.getLayoutType(containerWidth);
    this.updateChartHeight(this.currentLayoutType);

    // Set initial legend position
    this.currentLegendPosition = this.getLegendPosition(containerWidth);
    this.updateLegendPosition(this.currentLegendPosition);

    this.updateNodeDataCounts();
    this.setupChartClickHandler();

    const option = this.createChartOptions(
      containerWidth,
      centerX,
      scale,
      fonts
    );
    this.chart.setOption(option as echarts.EChartsOption);
    this.chart.resize();
    this.applyChartFormatting();

    // Ensure all nodes have proper labels with correct colors and font sizes
    this.updateNodeLabels();

    // Auto-select Team node by default
    setTimeout(() => {
      this.handleNodeSelection('Team');
    }, 100);
  }

  private createChartOptions(
    containerWidth: number,
    centerX: number,
    scale: number,
    fonts: ChartFonts
  ): any {
    if (!this.teamStructureData?.length) return {};

    const firstPortfolio = this.teamStructureData[0];
    const portfolioName = firstPortfolio.portfolioName ?? '';
    const trainName = firstPortfolio.children?.[0]?.pdtname ?? '';
    const teamName =
      firstPortfolio.children?.[0]?.children?.[0]?.teamName ?? '';

    const mainNodeSize = fonts.mainNodeSize;
    const teamNodeSize = fonts.teamNodeSize;

    return this.configService.getChartOptions(
      containerWidth,
      centerX,
      scale,
      mainNodeSize,
      teamNodeSize,
      fonts.mainFont,
      fonts.mainTitleFont,
      fonts.memberFont,
      fonts.memberBoldFont,
      this.formatNodeLabel.bind(this),
      this.getNodeLabel.bind(this),
      portfolioName,
      trainName,
      teamName,
      this.teamStructureData
    );
  }

  private applyChartFormatting(): void {
    if (!this.chart) return;

    const chartDom = this.chart.getDom();
    if (chartDom) {
      chartDom.style.cursor = 'default';
    }
  }

  private disposeChart(): void {
    if (this.chart) {
      this.chart.dispose();
      this.chart = null;
    }
  }

  private unsubscribeAll(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    if (this.isResizing) return;

    this.isResizing = true;
    setTimeout(() => {
      if (this.chart) {
        const chartDom = this.chart.getDom();
        if (chartDom) {
          const containerWidth = chartDom.offsetWidth;
          const centerX = containerWidth / 2;
          const scale = this.configService.getResponsiveScale(containerWidth);
          const fonts = this.configService.getChartFonts(scale, containerWidth);

          // Check if layout has changed and update height
          this.checkAndUpdateLayout(containerWidth);

          // Store the currently selected node before resize
          const previouslySelectedNode = this.selectedNode;

          // Update node positions
          const currentOption = this.chart.getOption() as any;
          if (currentOption?.series?.[0]?.data) {
            this.configService.updateNodePositions(
              currentOption.series[0].data,
              containerWidth,
              centerX,
              scale,
              fonts
            );
          }

          // Update chart options
          const newOption = this.createChartOptions(
            containerWidth,
            centerX,
            scale,
            fonts
          );
          this.chart.setOption(newOption, { replaceMerge: ['series'] });
          this.chart.resize();

          // Restore the selected node state after resize
          if (previouslySelectedNode) {
            this.selectedNode = previouslySelectedNode;
            this.updateNodeSizes(previouslySelectedNode);
            this.updateNodeLabels();
            this.changeDetectorRef.markForCheck();
          }
        }
      }
      this.isResizing = false;
    }, 100);
  }

  private setupChartClickHandler(): void {
    if (!this.chart) return;

    this.chart.on('click', (params: any) => {
      if (params.dataType === 'node') {
        const nodeName = params.data.name;
        if (!this.isNonInteractiveNode(nodeName)) {
          this.handleNodeSelection(nodeName);
        }
      }
    });
  }

  private handleNodeSelection(nodeName: string): void {
    this.selectedNode = nodeName;
    const nodeId = this.getNodeIdByType(nodeName);

    if (nodeName === 'Team') {
      this.loadTeamData(nodeId);
    } else {
      this.loadAlignmentData(nodeName, nodeId);
    }

    this.updateNodeSizes(nodeName);
    this.updateNodeLabels();

    this.changeDetectorRef.markForCheck();
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private isNonInteractiveNode(nodeName: string): boolean {
    return this.configService.isNonInteractiveNode(nodeName);
  }

  private getNodeIdByType(nodeName: string): string {
    return this.configService.getNodeIdByType(
      nodeName,
      this.teamStructureData || []
    );
  }

  public getCurrentScaleAndWidth(): { scale: number; width: number } {
    const chartDom = this.chart?.getDom();
    const width = chartDom?.offsetWidth || 800;
    const scale = this.configService.getResponsiveScale(width);
    return { scale, width };
  }

  public getCurrentScale(): number {
    return this.getCurrentScaleAndWidth().scale;
  }

  // ============================================================================
  // LAYOUT MANAGEMENT
  // ============================================================================

  /**
   * Determine layout type based on container width
   */
  private getLayoutType(
    containerWidth: number
  ): 'vertical' | 'compact' | 'default' {
    if (containerWidth <= 600) {
      return 'vertical';
    } else if (containerWidth <= 750) {
      return 'compact';
    } else {
      return 'default';
    }
  }

  /**
   * Update chart container height based on layout type
   */
  private updateChartHeight(
    layoutType: 'vertical' | 'compact' | 'default'
  ): void {
    const chartContainer =
      this.elementRef.nativeElement.querySelector('.chart-container');
    if (!chartContainer) return;

    let height: string;
    switch (layoutType) {
      case 'vertical':
        height = '750px';
        break;
      case 'compact':
        height = '400px';
        break;
      case 'default':
      default:
        height = '500px';
        break;
    }

    chartContainer.style.height = height;
    chartContainer.style.minHeight = height;
  }

  /**
   * Check if layout has changed and update height accordingly
   */
  private checkAndUpdateLayout(containerWidth: number): void {
    const newLayoutType = this.getLayoutType(containerWidth);

    if (newLayoutType !== this.currentLayoutType) {
      this.currentLayoutType = newLayoutType;
      this.updateChartHeight(newLayoutType);

      // Trigger chart resize after height change
      setTimeout(() => {
        if (this.chart) {
          this.chart.resize();
        }
      }, 50);
    }

    // Always check legend position on resize
    this.checkAndUpdateLegendPosition(containerWidth);
  }

  // ============================================================================
  // LEGEND POSITIONING MANAGEMENT
  // ============================================================================

  /**
   * Determine legend position based on container width
   */
  private getLegendPosition(
    containerWidth: number
  ): 'top-right' | 'top-center' {
    return containerWidth <= 600 ? 'top-center' : 'top-right';
  }

  /**
   * Update legend position based on layout type
   */
  private updateLegendPosition(position: 'top-right' | 'top-center'): void {
    const legendContainer =
      this.elementRef.nativeElement.querySelector('.legend-container');
    if (!legendContainer) return;

    // Remove existing position classes
    legendContainer.classList.remove('legend-top-right', 'legend-top-center');

    // Add new position class
    if (position === 'top-center') {
      legendContainer.classList.add('legend-top-center');
    } else {
      legendContainer.classList.add('legend-top-right');
    }
  }

  /**
   * Check if legend position has changed and update accordingly
   */
  private checkAndUpdateLegendPosition(containerWidth: number): void {
    const newLegendPosition = this.getLegendPosition(containerWidth);

    if (newLegendPosition !== this.currentLegendPosition) {
      this.currentLegendPosition = newLegendPosition;
      this.updateLegendPosition(newLegendPosition);
    }
  }

  // ============================================================================
  // NODE MANAGEMENT
  // ============================================================================

  private updateNodeSizes(selectedName: string): void {
    const nodes = this.getNodesFromOption();
    if (!nodes) return;

    const { scale, width } = this.getCurrentScaleAndWidth();
    const fonts = this.configService.getChartFonts(scale, width);
    const sizes = this.configService.getNormalNodeSizes(
      fonts.mainNodeSize,
      fonts.teamNodeSize
    );

    nodes.forEach((node) => {
      if (this.configService.NODE_TYPES.MAIN.includes(node.name)) {
        const normalSize = sizes[node.name] || sizes['Portfolio'];
        node.symbolSize =
          node.name === selectedName ? normalSize * 1.15 : normalSize;
      } else if (
        this.configService.NODE_TYPES.CONTRIBUTOR.includes(node.name)
      ) {
        const normalSize = sizes[node.name] || sizes['AIT'];
        node.symbolSize =
          node.name === selectedName ? normalSize * 1.15 : normalSize;
      }
    });

    this.chart?.setOption({ series: [{ data: nodes }] });
  }

  private updateNodeLabels(): void {
    const nodes = this.getNodesFromOption();
    if (!nodes) return;

    nodes.forEach((node) => {
      if (
        this.configService.NODE_TYPES.MAIN.includes(node.name) ||
        this.configService.NODE_TYPES.CONTRIBUTOR.includes(node.name)
      ) {
        node.label = this.getNodeLabel(node.name);
      }
    });

    this.chart?.setOption({ series: [{ data: nodes }] });
  }

  public resetSelectedNode(): void {
    this.selectedNode = null;
    this.alignmentData = [];
    this.teamData = null;
    this.gridView = { data: [], total: 0 };
    this.rowSelected = false;

    const nodes = this.getNodesFromOption();
    if (nodes) {
      const { scale, width } = this.getCurrentScaleAndWidth();
      const fonts = this.configService.getChartFonts(scale, width);
      this.resetAllNodeSizes(nodes, fonts);
    }

    this.changeDetectorRef.markForCheck();
  }

  private resetAllNodeSizes(nodes: NodeData[], fonts: ChartFonts): void {
    const sizes = this.configService.getNormalNodeSizes(
      fonts.mainNodeSize,
      fonts.teamNodeSize
    );

    nodes.forEach((node) => {
      if (this.configService.NODE_TYPES.MAIN.includes(node.name)) {
        node.symbolSize = sizes[node.name] || sizes['Portfolio'];
      } else if (
        this.configService.NODE_TYPES.CONTRIBUTOR.includes(node.name)
      ) {
        node.symbolSize = sizes[node.name] || sizes['AIT'];
      }

      if (
        this.configService.NODE_TYPES.MAIN.includes(node.name) ||
        this.configService.NODE_TYPES.CONTRIBUTOR.includes(node.name)
      ) {
        node.label = this.getNodeLabel(node.name);
      }
    });

    this.chart?.setOption({ series: [{ data: nodes }] });
  }

  private getNodesFromOption(): NodeData[] | null {
    if (!this.chart) return null;
    return this.configService.getNodesFromOption(this.chart.getOption());
  }

  private updateNodeDataCounts(): void {
    this.nodeDataCounts = {
      AIT: 0,
      'Team Backlog': 0,
      SPK: 0,
      'Jira Board': 0,
    };

    if (!this.teamStructureData?.length) {
      this.portfolioCount = 0;
      return;
    }

    this.portfolioCount = this.teamStructureData.length;

    const teamChildren =
      this.teamStructureData[0]?.children?.[0]?.children?.[0]?.children;
    if (!teamChildren) return;

    teamChildren.forEach((child: any) => {
      if (this.nodeDataCounts.hasOwnProperty(child.name)) {
        this.nodeDataCounts[child.name] = child.count;
      }
    });
  }

  private getNodeLabel(nodeName: string): any {
    const { scale, width } = this.getCurrentScaleAndWidth();
    const fonts = this.configService.getChartFonts(scale, width);

    if (!this.teamStructureData?.length) return null;

    const firstPortfolio = this.teamStructureData[0];

    switch (nodeName) {
      case 'Portfolio':
        return this.configService.createMainNodeLabel(
          firstPortfolio.portfolioName ?? '',
          'Portfolio',
          fonts,
          this.portfolioCount
        );
      case 'PDT':
        return this.configService.createMainNodeLabel(
          firstPortfolio.children?.[0]?.pdtname ?? '',
          'PDT',
          fonts
        );
      case 'Team':
        return this.configService.createMainNodeLabel(
          firstPortfolio.children?.[0]?.children?.[0]?.teamName ?? '',
          'Team',
          fonts
        );
      default:
        if (this.configService.NODE_TYPES.CONTRIBUTOR.includes(nodeName)) {
          return this.configService.createContributorNodeLabel(
            nodeName,
            fonts,
            this.nodeDataCounts
          );
        }
        return null;
    }
  }

  private formatNodeLabel(
    name: string,
    title: string,
    baseSize: number,
    isLight: boolean
  ): any {
    return this.configService.formatNodeLabel(name, title, baseSize, isLight);
  }

  // ============================================================================
  // GRID FUNCTIONALITY
  // ============================================================================

  private loadTeamData(teamId: string): void {
    this.teamData = this.alignmentService.getTeamAlignment(teamId);
    // Clear alignment data when showing team data
    this.alignmentData = [];
    this.updateGridView();
  }

  private loadAlignmentData(nodeName: string, nodeId: string): void {
    if (!this.teamStructureData?.length) {
      this.alignmentData = [];
      this.teamData = null;
      this.updateGridView();
      return;
    }

    // Clear team data when showing alignment data
    this.teamData = null;

    const teamId =
      this.teamStructureData[0]?.children?.[0]?.children?.[0]?.teamId?.toString() ||
      '301';
    const nodeToAlignmentTypeMap =
      this.configService.getNodeToAlignmentTypeMap();
    const alignmentType = nodeToAlignmentTypeMap[nodeName];

    if (!alignmentType) {
      this.alignmentData = [];
    } else if (alignmentType === 'PORTFOLIO') {
      this.alignmentData = this.alignmentService.getPortfolioAlignments(teamId);
    } else {
      this.alignmentData = this.alignmentService.getAlignment(
        alignmentType,
        teamId
      );
    }

    this.updateGridView();
  }

  private updateGridView(): void {
    if (!this.alignmentData.length) {
      this.gridView = { data: [], total: 0 };
      return;
    }

    const skip = this.gridState.skip || 0;
    const take = this.gridState.take || 10;
    const paginatedData = this.alignmentData.slice(skip, skip + take);

    this.gridView = {
      data: paginatedData,
      total: this.alignmentData.length,
    };

    this.changeDetectorRef.markForCheck();
  }

  public dataStateChange(state: DataStateChangeEvent): void {
    this.gridState = state;

    if (state.sort?.length) {
      const { dir, field } = state.sort[0];
      const isAsc = dir === 'asc';

      this.alignmentData = [...this.alignmentData].sort((a: any, b: any) => {
        const valA = a[field];
        const valB = b[field];

        if (valA < valB) return isAsc ? -1 : 1;
        if (valA > valB) return isAsc ? 1 : -1;
        return 0;
      });
    }

    this.updateGridView();
  }

  public onRowSelect(event: SelectionEvent): void {
    this.rowSelected = !!event.selectedRows?.length;
    this.changeDetectorRef.markForCheck();
  }

  // ============================================================================
  // TEAM GRID EVENT HANDLERS
  // ============================================================================

  public teamDataStateChange(state: DataStateChangeEvent): void {
    this.teamGridState = state;
    this.changeDetectorRef.markForCheck();
  }

  public onTeamRowSelect(event: SelectionEvent): void {
    this.rowSelected = !!event.selectedRows?.length;
    this.changeDetectorRef.markForCheck();
  }
}
