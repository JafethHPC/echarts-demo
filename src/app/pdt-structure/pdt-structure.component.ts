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
import { PdtStructureService } from './pdt-structure.service';
import { PdtStructureConfigService } from './pdt-structure-config.service';
import {
  ChartFonts,
  NodeData,
  PDTStructureData,
  PDTData,
} from './pdt-structure.model';
import { Subscription } from 'rxjs';
import {
  AlignmentService,
  Alignment,
  AlignmentType,
  Team,
} from '../team-structure/alignment.service';
import {
  GridDataResult,
  DataStateChangeEvent,
  SelectableSettings,
  SelectionEvent,
} from '@progress/kendo-angular-grid';
import { State } from '@progress/kendo-data-query';

/**
 * PDT Structure Component
 *
 * Displays a PDT organizational structure diagram using ECharts with interactive nodes.
 * Shows relationships between Portfolio, PDT, Products, and Teams.
 */
@Component({
  selector: 'app-pdt-structure',
  templateUrl: './pdt-structure.component.html',
  styleUrls: ['./pdt-structure.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class PdtStructureComponent implements AfterViewInit, OnDestroy {
  // ============================================================================
  // CHART PROPERTIES
  // ============================================================================

  private chart: echarts.ECharts | null = null;
  private isResizing = false;
  private pdtStructureData: PDTStructureData | null = null;

  // Layout tracking for dynamic height management
  private currentLayoutType: 'vertical' | 'compact' | 'default' = 'default';

  // Legend positioning tracking
  private currentLegendPosition: 'top-right' | 'top-center' = 'top-right';

  selectedNode: string | null = null;
  nodeDataCounts: Record<string, number> = {
    Product: 5,
    Team: 10,
  };
  portfolioCount: number = 1;

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
  // PDT TABLE PROPERTIES
  // ============================================================================

  pdtData: PDTData | null = null;
  public pdtGridState: State = {
    sort: [],
    skip: 0,
    take: 10,
    filter: { logic: 'and', filters: [] },
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
    private configService: PdtStructureConfigService,
    private pdtStructureService: PdtStructureService,
    private alignmentService: AlignmentService
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.loadPDTStructureData();
      this.initChart();
    }, 0);
  }

  ngOnDestroy(): void {
    this.disposeChart();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  // ============================================================================
  // CHART INITIALIZATION & MANAGEMENT
  // ============================================================================

  private loadPDTStructureData(): void {
    const portfolios = this.pdtStructureService.getPdtStructureData();
    this.pdtStructureData = portfolios[0] || null; // Use first portfolio
  }

  private initChart(): void {
    const chartDom = document.getElementById('pdt-chart');
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

    // Auto-select PDT node by default
    setTimeout(() => {
      this.handleNodeSelection('PDT');
    }, 100);
  }

  private createChartOptions(
    containerWidth: number,
    centerX: number,
    scale: number,
    fonts: ChartFonts
  ): any {
    if (!this.pdtStructureData) return {};

    const portfolioName = this.pdtStructureData.portfolioName ?? '';
    const pdtName = this.pdtStructureData.pdt?.pdtName ?? '';

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
      pdtName,
      this.pdtStructureData
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

          // Check if legend position has changed and update accordingly
          this.checkAndUpdateLegendPosition(containerWidth);

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
    console.log('Selected node:', nodeName);

    this.updateNodeSizes(nodeName);
    this.updateNodeLabels();

    // Load appropriate data based on node type
    if (nodeName === 'PDT') {
      this.loadPDTData();
    } else if (nodeName.startsWith('Team')) {
      // For team nodes, load alignment data instead of team data
      this.loadAlignmentData(nodeName);
    } else {
      // For Portfolio and Product nodes, load alignment data
      this.loadAlignmentData(nodeName);
    }

    this.changeDetectorRef.markForCheck();
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private isNonInteractiveNode(nodeName: string): boolean {
    return this.configService.isNonInteractiveNode(nodeName);
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
        height = '850px';
        break;
      case 'compact':
        height = '500px';
        break;
      case 'default':
      default:
        height = '600px';
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
    }
  }

  // ============================================================================
  // LEGEND MANAGEMENT
  // ============================================================================

  /**
   * Determine legend position based on container width
   */
  private getLegendPosition(
    containerWidth: number
  ): 'top-right' | 'top-center' {
    return containerWidth <= 930 ? 'top-center' : 'top-right';
  }

  /**
   * Update legend position based on container width
   */
  private updateLegendPosition(position: 'top-right' | 'top-center'): void {
    const legendContainer =
      this.elementRef.nativeElement.querySelector('.legend-container');
    if (!legendContainer) return;

    // Remove existing position classes
    legendContainer.classList.remove('legend-top-right', 'legend-top-center');

    // Add new position class
    legendContainer.classList.add(`legend-${position}`);
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

  /**
   * Update node sizes based on selection
   */
  private updateNodeSizes(selectedNodeName: string): void {
    if (!this.chart) return;

    const option = this.chart.getOption() as any;
    const series = option.series?.[0];
    if (!series?.data) return;

    const { scale } = this.getCurrentScaleAndWidth();
    const fonts = this.configService.getChartFonts(scale, 800);

    series.data.forEach((node: NodeData) => {
      const isSelected = node.name === selectedNodeName;
      const isMainNode = ['Portfolio', 'PDT'].includes(node.name);

      if (isMainNode) {
        node.symbolSize = isSelected
          ? fonts.mainNodeSize * 1.2
          : fonts.mainNodeSize;
      } else if (node.name.startsWith('Team')) {
        node.symbolSize = isSelected
          ? [fonts.teamNodeSize * 2.64, fonts.teamNodeSize * 0.6]
          : [fonts.teamNodeSize * 2.2, fonts.teamNodeSize * 0.5];
      } else if (node.name.startsWith('Product')) {
        node.symbolSize = isSelected
          ? fonts.teamNodeSize * 1.326
          : fonts.teamNodeSize * 1.105;
      }
    });

    this.chart.setOption(option);
  }

  /**
   * Update node labels
   */
  private updateNodeLabels(): void {
    if (!this.chart) return;

    const option = this.chart.getOption() as any;
    const series = option.series?.[0];
    if (!series?.data) return;

    series.data.forEach((node: NodeData) => {
      // Only update labels for interactive nodes
      if (!this.isNonInteractiveNode(node.name)) {
        const newLabel = this.getNodeLabel(node.name);
        if (newLabel) {
          node.label = newLabel;
        }
      }
    });

    this.chart.setOption(option);
  }

  /**
   * Get node label
   */
  private getNodeLabel(nodeName: string): any {
    const { scale, width } = this.getCurrentScaleAndWidth();
    const fonts = this.configService.getChartFonts(scale, width);

    if (!this.pdtStructureData) return null;

    switch (nodeName) {
      case 'Portfolio':
        return this.configService.createMainNodeLabel(
          this.pdtStructureData.portfolioName ?? '',
          'Portfolio',
          fonts,
          this.portfolioCount
        );
      case 'PDT':
        return this.configService.createMainNodeLabel(
          this.pdtStructureData.pdt?.pdtName ?? '',
          'PDT',
          fonts
        );
      default:
        if (nodeName.startsWith('Product')) {
          const index = parseInt(nodeName.replace('Product', '')) - 1;
          const product = this.pdtStructureData.pdt?.products?.[index];
          if (product) {
            return this.configService.createProductNodeLabel(
              product.productName ?? '',
              fonts
            );
          }
        } else if (nodeName.startsWith('Team')) {
          const index = parseInt(nodeName.replace('Team', '')) - 1;
          const team = this.pdtStructureData.pdt?.teams?.[index];
          if (team) {
            return this.configService.createTeamNodeLabel(
              team.teamName ?? '',
              fonts
            );
          }
        }
        return null;
    }
  }

  /**
   * Format node label text
   */
  private formatNodeLabel(
    name: string,
    title: string,
    baseSize: number,
    isLight: boolean
  ): any {
    return this.configService.formatNodeLabel(name, title, baseSize, isLight);
  }

  /**
   * Update node data counts
   */
  private updateNodeDataCounts(): void {
    if (!this.pdtStructureData) return;

    this.nodeDataCounts = {
      Product: this.pdtStructureData.pdt?.products?.length || 0,
      Team: this.pdtStructureData.pdt?.teams?.length || 0,
    };
    this.portfolioCount = 1;
  }

  // ============================================================================
  // GRID FUNCTIONALITY
  // ============================================================================

  private loadPDTData(): void {
    this.pdtData = this.pdtStructureData?.pdt || null;
    // Clear other data when showing PDT data
    this.alignmentData = [];
    this.teamData = null;
    this.updateGridView();
  }

  private loadTeamData(teamId: string): void {
    this.teamData = this.alignmentService.getTeamAlignment(teamId);
    // Clear other data when showing team data
    this.alignmentData = [];
    this.pdtData = null;
    this.updateGridView();
  }

  private loadAlignmentData(nodeName: string): void {
    if (!this.pdtStructureData) {
      this.alignmentData = [];
      this.teamData = null;
      this.pdtData = null;
      this.updateGridView();
      return;
    }

    // Clear other data when showing alignment data
    this.teamData = null;
    this.pdtData = null;

    // Use the first team's ID for alignment lookups (similar to team-structure)
    const teamId =
      this.pdtStructureData.pdt?.teams?.[0]?.teamId?.toString() || '301';

    if (nodeName === 'Portfolio') {
      this.alignmentData = this.alignmentService.getPortfolioAlignments(teamId);
    } else if (nodeName.startsWith('Product')) {
      // For products, show AIT alignments as an example
      this.alignmentData = this.alignmentService.getAlignment(
        'TEAMTOAIT',
        teamId
      );
    } else if (nodeName.startsWith('Team')) {
      // For teams, show PDT alignments
      this.alignmentData = this.alignmentService.getAlignment(
        'TEAMTOPDT',
        teamId
      );
    } else {
      this.alignmentData = [];
    }

    this.updateGridView();
  }

  private updateGridView(): void {
    if (this.alignmentData.length > 0) {
      const skip = this.gridState.skip || 0;
      const take = this.gridState.take || 10;
      const paginatedData = this.alignmentData.slice(skip, skip + take);

      this.gridView = {
        data: paginatedData,
        total: this.alignmentData.length,
      };
    } else {
      this.gridView = { data: [], total: 0 };
    }
  }

  /**
   * Get grid data for alignment component
   */
  getAlignmentGridData(): GridDataResult {
    return this.gridView;
  }

  /**
   * Get node type for alignment component
   */
  getNodeType(): string {
    if (this.selectedNode === 'Portfolio') return 'Portfolio';
    if (this.selectedNode === 'PDT') return 'PDT';
    if (this.selectedNode?.startsWith('Team')) return 'Team';
    if (this.selectedNode?.startsWith('Product')) return 'Product';
    return '';
  }

  // ============================================================================
  // GRID EVENT HANDLERS
  // ============================================================================

  onDataStateChange(state: DataStateChangeEvent): void {
    this.gridState = state;
    this.updateGridView();
    this.changeDetectorRef.markForCheck();
  }

  onSelectionChange(event: SelectionEvent): void {
    this.rowSelected = (event.selectedRows?.length ?? 0) > 0;
    this.changeDetectorRef.markForCheck();
  }

  onPdtDataStateChange(state: DataStateChangeEvent): void {
    this.pdtGridState = state;
    this.changeDetectorRef.markForCheck();
  }

  onPdtSelectionChange(event: SelectionEvent): void {
    this.changeDetectorRef.markForCheck();
  }

  onTeamDataStateChange(state: DataStateChangeEvent): void {
    this.teamGridState = state;
    this.changeDetectorRef.markForCheck();
  }

  onTeamSelectionChange(event: SelectionEvent): void {
    this.changeDetectorRef.markForCheck();
  }

  onManageColumnsClick(): void {
    console.log('Manage columns clicked');
  }

  onExportClick(): void {
    console.log('Export clicked');
  }
}
