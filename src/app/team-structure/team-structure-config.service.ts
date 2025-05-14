import { Injectable } from '@angular/core';
import {
  NodeTypes,
  NodeColors,
  ChartOptions,
  NodeData,
  LinkData,
  ChartFonts,
} from './team-structure.model';

@Injectable({
  providedIn: 'root',
})
export class TeamStructureConfigService {
  // Node type constants
  readonly NODE_TYPES: NodeTypes = {
    MAIN: ['Portfolio', 'PDT', 'TEAMS'],
    JUNCTION: ['vertical-junction', 'horizontal-line'],
    CONTRIBUTOR: ['AIT', 'SPK', 'TPK', 'Jira Board'],
    CONNECTOR: ['v1', 'v2', 'v3', 'v4'],
  };

  // Node colors
  readonly COLORS: NodeColors = {
    PORTFOLIO: '#E0E0E0',
    PDT: '#C62828',
    TEAM: '#012169',
    CONNECTIONS: '#B0BEC5',
    CONTRIBUTOR: {
      bg: '#FFFFFF',
      border: '#000000',
    },
    TEXT: {
      LIGHT: '#000000',
      DARK: '#FFFFFF',
    },
  };

  // Get chart options with responsive scaling
  getChartOptions(
    containerWidth: number,
    centerX: number,
    scale: number,
    mainNodeSize: number,
    teamNodeSize: number,
    mainFont: number,
    mainTitleFont: number,
    memberFont: number,
    memberBoldFont: number,
    formatNodeLabel: Function,
    getNodeLabel: Function,
    portfolioName: string,
    trainName: string,
    teamName: string,
    teamStructureData: any
  ): ChartOptions {
    // Calculate node positions
    const nodeSpacing = Math.min(containerWidth / 4, 240 * scale);
    const portfolioX = centerX - nodeSpacing;
    const pdtX = centerX;
    const teamsX = centerX + nodeSpacing;

    const bottomRowSpacing = Math.min(containerWidth / 7, 100 * scale);
    const bottomRowWidth = 3 * bottomRowSpacing;
    const bottomRowStartX = teamsX - bottomRowWidth / 2;

    return {
      grid: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        containLabel: true,
      },
      tooltip: this.getTooltipConfig(teamStructureData),
      series: [
        {
          type: 'graph',
          layout: 'none',
          roam: false,
          zoom: 0.95,
          center: ['50%', '40%'],
          scaleLimit: { min: 0.4, max: 2 },
          label: this.getDefaultLabelConfig(),
          edgeLabel: { show: false },
          data: [
            // Main nodes
            ...this.createMainNodes(
              portfolioX,
              pdtX,
              teamsX,
              mainNodeSize,
              mainFont,
              formatNodeLabel,
              portfolioName,
              trainName,
              teamName
            ),

            // Junction nodes
            ...this.createJunctionNodes(teamsX),

            // Bottom row nodes
            ...this.createContributorNodes(
              bottomRowStartX,
              bottomRowSpacing,
              teamNodeSize,
              memberFont,
              memberBoldFont,
              getNodeLabel
            ),

            // Vertical connection nodes
            ...this.createConnectorNodes(bottomRowStartX, bottomRowSpacing),
          ],
          links: [
            // Horizontal connections between main nodes
            ...this.createMainLinks(),

            // Vertical connection from Teams to junction
            this.createVerticalLink(),

            // Horizontal connections between v nodes
            ...this.createHorizontalLinks(),

            // Connection from junction to v1
            this.createJunctionLink(),

            // Vertical connections to bottom nodes
            ...this.createBottomLinks(),
          ],
          categories: [
            { name: 'portfolio' },
            { name: 'pdt' },
            { name: 'teams' },
            { name: 'junction' },
            { name: 'member' },
          ],
        },
      ],
    };
  }

  // Get tooltip configuration
  private getTooltipConfig(teamStructureData: any) {
    return {
      trigger: 'item',
      backgroundColor: 'rgba(0,0,0,0)',
      borderWidth: 0,
      padding: 0,
      extraCssText:
        'box-shadow: 0 8px 32px 0 rgba(0,0,0,0.22), 0 1.5px 8px 0 rgba(0,0,0,0.18); border-radius: 10px;',
      formatter: (params: { data: any }) => {
        const data = params.data;
        let content = '';

        if (data.category === 'portfolio') {
          content = `
            <div style="background: #E0E0E0; color: #000; padding: 10px; font-weight: normal; font-size: 16px; text-align: center; border-top-left-radius: 10px; border-top-right-radius: 10px;">
              ${teamStructureData?.PortfolioName ?? ''}
            </div>
            <div style="background: #fff; padding: 10px; font-size: 12px; color: #000000; text-align: left; border-bottom-left-radius: 10px; border-bottom-right-radius: 10px;">
              Portfolio ID<br><span style='color:#888;'>${
                teamStructureData?.PortfolioId ?? ''
              }</span><br>
              Manager<br><span style='color:#888;'>${
                teamStructureData?.PortfolioManager ?? ''
              }</span>
            </div>
          `;
        } else if (data.category === 'pdt') {
          content = `
            <div style="background: #C62828; color: #fff; padding: 10px; font-weight: normal; font-size: 16px; text-align: center; border-top-left-radius: 10px; border-top-right-radius: 10px;">
              ${teamStructureData?.TrainName ?? ''}
            </div>
            <div style="background: #fff; padding: 10px; font-size: 12px; color: #000000; text-align: left; border-bottom-left-radius: 10px; border-bottom-right-radius: 10px;">
              Train ID<br><span style='color:#888;'>${
                teamStructureData?.TrainId ?? ''
              }</span><br>
              PDT Manager<br><span style='color:#888;'>${
                teamStructureData?.PDTManager ?? ''
              }</span>
            </div>
          `;
        } else if (data.category === 'teams') {
          content = `
            <div style="background: #012169; color: #fff; padding: 10px; font-weight: normal; font-size: 16px; text-align: center; border-top-left-radius: 10px; border-top-right-radius: 10px;">
              ${teamStructureData?.TeamName ?? ''}
            </div>
            <div style="background: #fff; padding: 10px; font-size: 12px; color: #000000; text-align: left; border-bottom-left-radius: 10px; border-bottom-right-radius: 10px;">
              Team ID<br><span style='color:#888;'>${
                teamStructureData?.TeamId ?? ''
              }</span><br>
              Team Type<br><span style='color:#888;'>${
                teamStructureData?.TeamType ?? ''
              }</span><br>
              Methodology<br><span style='color:#888;'>${
                teamStructureData?.Methodology ?? ''
              }</span><br>
              Team Manager<br><span style='color:#888;'>${
                teamStructureData?.TeamManager ?? ''
              }</span>
            </div>
          `;
        }

        return `<div style="background: transparent; border-radius: 10px; width: 220px; overflow: hidden; box-shadow: none;">${content}</div>`;
      },
    };
  }

  // Get default label configuration
  private getDefaultLabelConfig() {
    return {
      show: true,
      position: 'inside',
      formatter: '{b}',
      fontSize: 14,
      color: '#333',
      fontWeight: 'bold',
      align: 'center',
      verticalAlign: 'middle',
      fontFamily: 'Connections, Arial, sans-serif',
    };
  }

  // Create main node configurations
  private createMainNodes(
    portfolioX: number,
    pdtX: number,
    teamsX: number,
    size: number,
    mainFont: number,
    formatNodeLabel: Function,
    portfolioName: string,
    trainName: string,
    teamName: string
  ): NodeData[] {
    return [
      {
        name: 'Portfolio',
        category: 'portfolio',
        x: portfolioX,
        y: 150,
        symbolSize: size,
        itemStyle: { color: this.COLORS.PORTFOLIO },
        label: formatNodeLabel(portfolioName, 'Portfolio', mainFont, true),
      },
      {
        name: 'PDT',
        category: 'pdt',
        x: pdtX,
        y: 150,
        symbolSize: size,
        itemStyle: { color: this.COLORS.PDT },
        label: formatNodeLabel(trainName, 'PDT', mainFont, false),
      },
      {
        name: 'TEAMS',
        category: 'teams',
        x: teamsX,
        y: 150,
        symbolSize: size,
        itemStyle: { color: this.COLORS.TEAM },
        label: formatNodeLabel(teamName, 'Team', mainFont, false),
      },
    ];
  }

  // Create junction node configurations
  private createJunctionNodes(teamsX: number): NodeData[] {
    return [
      {
        name: 'vertical-junction',
        category: 'junction',
        x: teamsX,
        y: 270,
        symbolSize: 0,
        itemStyle: { color: 'rgba(0,0,0,0)' },
        label: { show: false },
      },
      {
        name: 'horizontal-line',
        category: 'junction',
        x: teamsX,
        y: 270,
        symbolSize: 0,
        fixed: true,
        itemStyle: { color: 'rgba(0,0,0,0)' },
        label: { show: false },
      },
    ];
  }

  // Create contributor node configurations
  private createContributorNodes(
    startX: number,
    spacing: number,
    size: number,
    memberFont: number,
    memberBoldFont: number,
    getNodeLabel: Function
  ): NodeData[] {
    return this.NODE_TYPES.CONTRIBUTOR.map((name, index) => ({
      name,
      category: 'member',
      x: startX + index * spacing,
      y: 380,
      symbolSize: size,
      symbol: 'circle',
      itemStyle: {
        color: this.COLORS.CONTRIBUTOR.bg,
        borderColor: this.COLORS.CONTRIBUTOR.border,
        borderWidth: 1,
      },
      label: getNodeLabel(name) || {
        fontSize: memberBoldFont,
        fontWeight: 'normal',
        lineHeight: 18,
        color: this.COLORS.TEXT.LIGHT,
        fontFamily: 'Connections, Arial, sans-serif',
      },
    }));
  }

  // Create connector node configurations
  private createConnectorNodes(startX: number, spacing: number): NodeData[] {
    return [1, 2, 3, 4].map((i) => ({
      name: `v${i}`,
      category: 'junction',
      x: startX + (i - 1) * spacing,
      y: 270,
      symbolSize: 0,
      itemStyle: { color: 'rgba(0,0,0,0)' },
      label: { show: false },
    }));
  }

  // Create links between main nodes
  private createMainLinks(): LinkData[] {
    return [
      {
        source: 'Portfolio',
        target: 'PDT',
        lineStyle: { width: 1, color: this.COLORS.CONNECTIONS },
      },
      {
        source: 'PDT',
        target: 'TEAMS',
        lineStyle: { width: 1, color: this.COLORS.CONNECTIONS },
      },
    ];
  }

  // Create vertical link from teams to junction
  private createVerticalLink(): LinkData {
    return {
      source: 'TEAMS',
      target: 'vertical-junction',
      lineStyle: { width: 1, color: this.COLORS.CONNECTIONS },
    };
  }

  // Create horizontal links between connector nodes
  private createHorizontalLinks(): LinkData[] {
    return [1, 2, 3].map((i) => ({
      source: `v${i}`,
      target: `v${i + 1}`,
      lineStyle: { width: 1, color: this.COLORS.CONNECTIONS, curveness: 0 },
    }));
  }

  // Create link from junction to first connector
  private createJunctionLink(): LinkData {
    return {
      source: 'vertical-junction',
      target: 'v1',
      lineStyle: { width: 1, color: this.COLORS.CONNECTIONS, curveness: 0 },
    };
  }

  // Create vertical links to bottom nodes
  private createBottomLinks(): LinkData[] {
    return this.NODE_TYPES.CONTRIBUTOR.map((name, index) => ({
      source: `v${index + 1}`,
      target: name,
      lineStyle: { width: 1, color: this.COLORS.CONNECTIONS, curveness: 0 },
    }));
  }

  // Get responsive scale based on container width
  getResponsiveScale(containerWidth: number): number {
    if (containerWidth > 825) return 1;
    return 0.75;
  }

  // Calculate zoom level based on scale
  getZoomLevel(scale: number): number {
    if (scale === 1) return 0.75;
    if (scale === 0.8) return 0.7;
    return 0.7; // For scale = 0.7
  }

  // Calculate font sizes based on scale
  getChartFonts(scale: number): ChartFonts {
    return {
      mainNodeSize: 210 * scale,
      teamNodeSize: 100 * scale,
      mainFont: 19 * 1.2 * scale,
      mainTitleFont: 15 * 1.2 * scale,
      memberFont: 14 * scale,
      memberBoldFont: 16 * scale,
    };
  }
}
