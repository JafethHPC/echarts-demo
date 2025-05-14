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
import { TeamStructureService } from './team-structure.service';
import { TeamStructureConfigService } from './team-structure-config.service';
import { ChartFonts, NodeData } from './team-structure.model';

/**
 * Team Structure Component
 *
 * This component displays an organizational structure diagram using ECharts.
 * It shows relationships between Portfolio, PDT, and Teams with interactive nodes.
 */
@Component({
  selector: 'app-team-structure',
  templateUrl: './team-structure.component.html',
  styleUrls: ['./team-structure.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class TeamStructureComponent implements AfterViewInit, OnDestroy {
  /** The ECharts instance */
  private chart: echarts.ECharts | null = null;

  /** Currently selected node name (null when no node is selected) */
  selectedNode: string | null = null;

  /**
   * Constructor
   */
  constructor(
    private elementRef: ElementRef,
    public changeDetectorRef: ChangeDetectorRef,
    private ngZone: NgZone,
    private configService: TeamStructureConfigService,
    private teamStructureService: TeamStructureService
  ) {}

  private teamStructureData: any;

  /**
   * Initialize the chart after the view is initialized
   */
  ngAfterViewInit() {
    setTimeout(() => {
      this.teamStructureData = this.teamStructureService.getTeamStructureData();
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

    // Set zoom: much larger for small windows
    let zoom = this.configService.getZoomLevel(scale);
    if (containerWidth <= 750) {
      zoom = 0.8;
    }

    // Update chart options
    this.chart.setOption({
      series: [
        {
          data: nodesOption,
          center: ['50%', '45%'],
          zoom,
        },
      ],
    });

    // Ensure label font sizes update on resize
    this.updateNodeLabels();
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
        case 'AIT':
        case 'SPK':
        case 'TPK':
        case 'Jira Board':
          const index = this.configService.NODE_TYPES.CONTRIBUTOR.indexOf(
            node.name
          );
          node.x = bottomRowStartX + index * bottomRowSpacing;
          node.y = (270 + (380 - 270) * 0.6) * scale;
          node.symbolSize = fonts.teamNodeSize;
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
    this.setupChartClickHandler();

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
      this.getNodeLabel.bind(this),
      this.teamStructureData?.PortfolioName ?? '',
      this.teamStructureData?.TrainName ?? '',
      this.teamStructureData?.TeamName ?? '',
      this.teamStructureData
    );

    // Set zoom: much larger for small windows
    if (containerWidth <= 750) {
      option.series[0].zoom = 0.8;
    }
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

  private setupChartClickHandler() {
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

      this.ngZone.run(() => {
        // Get current scale and font sizes
        const chartDom = document.getElementById('chart') as HTMLElement;
        const containerWidth = chartDom.offsetWidth;
        const scale = this.configService.getResponsiveScale(containerWidth);
        const fonts = this.configService.getChartFonts(scale);

        this.updateNodeSizes(
          params.name,
          fonts.mainNodeSize,
          fonts.teamNodeSize
        );

        // Update selected node
        this.selectedNode = params.name;

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
      AIT: teamNodeSize,
      SPK: teamNodeSize,
      TPK: teamNodeSize,
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
    AIT: 0,
    SPK: 0,
    TPK: 0,
    'Jira Board': 0,
  };

  // Call this after any data change to update nodeDataCounts
  private updateNodeDataCounts(): void {
    // Use teamStructureData for counts
    if (!this.teamStructureData) return;
    this.nodeDataCounts['AIT'] = this.teamStructureData.AITCount;
    this.nodeDataCounts['SPK'] = this.teamStructureData.SPKCount;
    this.nodeDataCounts['TPK'] = this.teamStructureData.TPKCount;
    this.nodeDataCounts['Jira Board'] = this.teamStructureData.JiraBoardCount;
  }

  /**
   * Reset the selected node and chart node sizes/labels
   */
  public resetSelectedNode(): void {
    this.selectedNode = null;

    if (this.chart) {
      // Reset all node sizes
      const options = this.chart.getOption();
      const nodesOption = this.getNodesFromOption(options);
      if (!nodesOption) return;

      // Use current scale and font sizes
      const chartDom = document.getElementById('chart') as HTMLElement;
      const containerWidth = chartDom.offsetWidth;
      const scale = this.configService.getResponsiveScale(containerWidth);
      const fonts = this.configService.getChartFonts(scale);
      const normalSizes: Record<string, number> = {
        Portfolio: fonts.mainNodeSize,
        PDT: fonts.mainNodeSize,
        TEAMS: fonts.mainNodeSize,
        AIT: fonts.teamNodeSize,
        SPK: fonts.teamNodeSize,
        TPK: fonts.teamNodeSize,
        'Jira Board': fonts.teamNodeSize,
      };

      nodesOption.forEach((node: NodeData) => {
        if (normalSizes[node.name]) {
          node.symbolSize = normalSizes[node.name];
        }
      });

      this.chart.setOption({ series: [{ data: nodesOption }] });
      this.updateNodeLabels();
      this.changeDetectorRef.markForCheck();
    }
  }

  private getNodeLabel(nodeName: string): any {
    // Get current scale to ensure font sizes are consistent
    const chartDom = document.getElementById('chart') as HTMLElement;
    if (!chartDom) return null;

    const containerWidth = chartDom.offsetWidth;
    const scale = this.configService.getResponsiveScale(containerWidth);
    const fonts = this.configService.getChartFonts(scale);

    // Main nodes: show name and subtitle from teamStructureData
    if (nodeName === 'Portfolio') {
      return {
        formatter: `{name|${
          this.teamStructureData?.PortfolioName ?? ''
        }}\n{title|Portfolio}`,
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
    if (nodeName === 'PDT') {
      return {
        formatter: `{name|${
          this.teamStructureData?.TrainName ?? ''
        }}\n{title|PDT}`,
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
    if (nodeName === 'TEAMS') {
      return {
        formatter: `{name|${
          this.teamStructureData?.TeamName ?? ''
        }}\n{title|Team}`,
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
    // Bottom nodes: show count or plus
    const count = this.nodeDataCounts[nodeName];
    const noData = count === 0;
    if (this.configService.NODE_TYPES.CONTRIBUTOR.includes(nodeName)) {
      return {
        formatter: noData
          ? `{name|${nodeName}}\n{plus|+}`
          : `{name|${nodeName}}\n{count|${count}}`,
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
    return null;
  }
}
