import { Injectable } from '@angular/core';
import {
  NodeTypes,
  NodeColors,
  ChartOptions,
  NodeData,
  LinkData,
  ChartFonts,
} from './tree-diagram.model';

@Injectable({
  providedIn: 'root',
})
export class TreeDiagramConfigService {
  // Node type constants
  readonly NODE_TYPES: NodeTypes = {
    MAIN: ['Portfolio', 'PDT', 'TEAMS'],
    JUNCTION: ['vertical-junction', 'horizontal-line'],
    CONTRIBUTOR: ['Team\nMember', 'AIT', 'Team\nBacklog', 'SPK'],
    CONNECTOR: ['v1', 'v2', 'v3', 'v4'],
  };

  // Node colors
  readonly COLORS: NodeColors = {
    PORTFOLIO: '#E0E0E0',
    PDT: '#C62828',
    TEAM: '#1a4b8c',
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
    getNodeLabel: Function
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
      tooltip: this.getTooltipConfig(),
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
              formatNodeLabel
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
  private getTooltipConfig() {
    return {
      trigger: 'item',
      backgroundColor: '#FFFFFF',
      borderColor: '#000000',
      borderWidth: 1,
      padding: 0,
      formatter: (params: { data: any }) => {
        const data = params.data;
        let content = '';

        if (data.category === 'portfolio') {
          content = `
            <div style="background: #000000; color: #FFFFFF; padding: 10px; font-weight: bold; font-size: 14px;">Portfolio</div>
            <div style="padding: 10px; font-size: 12px; color: #000000; text-align: left;">
              Portfolio ID: P001<br>
              Portfolio Name: Enterprise Solutions<br>
              Type: Strategic<br>
              Tech Mgr: John Doe
            </div>
          `;
        } else if (data.category === 'pdt') {
          content = `
            <div style="background: #000000; color: #FFFFFF; padding: 10px; font-weight: bold; font-size: 14px;">PDT</div>
            <div style="padding: 10px; font-size: 12px; color: #000000; text-align: left;">
              PDT ID: PDT001<br>
              PDT Name: Core Development<br>
              Lead: Jane Smith
            </div>
          `;
        } else if (data.category === 'teams') {
          content = `
            <div style="background: #000000; color: #FFFFFF; padding: 10px; font-weight: bold; font-size: 14px;">Team Details</div>
            <div style="padding: 10px; font-size: 12px; color: #000000; text-align: left;">
              Team ID: T001<br>
              Team Name: Development Squad<br>
              Manager: Alice Johnson
            </div>
          `;
        }

        return `<div style="background: #FFFFFF; border: 1px solid #000000; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">${content}</div>`;
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
    formatNodeLabel: Function
  ): NodeData[] {
    return [
      {
        name: 'Portfolio',
        category: 'portfolio',
        x: portfolioX,
        y: 150,
        symbolSize: size,
        itemStyle: { color: this.COLORS.PORTFOLIO },
        label: formatNodeLabel('Demo 1', 'Portfolio', mainFont, true),
      },
      {
        name: 'PDT',
        category: 'pdt',
        x: pdtX,
        y: 150,
        symbolSize: size,
        itemStyle: { color: this.COLORS.PDT },
        label: formatNodeLabel('Demo 2', 'PDT', mainFont, false),
      },
      {
        name: 'TEAMS',
        category: 'teams',
        x: teamsX,
        y: 150,
        symbolSize: size,
        itemStyle: { color: this.COLORS.TEAM },
        label: formatNodeLabel('Demo 3', 'Team', mainFont, false),
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
        fontSize: name === 'Team\nMember' ? memberFont : memberBoldFont,
        fontWeight: name === 'Team\nBacklog' ? '300' : 'normal',
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

  // Get table headers based on node type
  getTableHeaders(nodeName: string): string[] {
    switch (nodeName) {
      case 'Portfolio':
        return [
          'ID',
          'Portfolio Name',
          'Type',
          'Description',
          'Manager',
          'Budget',
          'Status',
        ];
      case 'PDT':
        return [
          'ID',
          'PDT Name',
          'Lead',
          'Members',
          'Focus Area',
          'Projects',
          'Stakeholders',
        ];
      case 'TEAMS':
        return [
          'ID',
          'Team Name',
          'Manager',
          'Size',
          'Focus',
          'Location',
          'Performance',
        ];
      case 'Team\nMember':
        return [
          'ID',
          'Name',
          'Role',
          'Experience',
          'Skills',
          'Current Project',
          'Performance',
        ];
      case 'AIT':
        return [
          'ID',
          'Name',
          'Category',
          'Description',
          'Status',
          'Owner',
          'Last Updated',
        ];
      case 'Team\nBacklog':
        return [
          'ID',
          'Story',
          'Points',
          'Priority',
          'Status',
          'Sprint',
          'Assignee',
        ];
      case 'SPK':
        return [
          'ID',
          'Name',
          'Role',
          'Department',
          'Key Interest',
          'Engagement Level',
          'Last Contact',
        ];
      default:
        return [];
    }
  }

  // Get responsive scale based on container width
  getResponsiveScale(containerWidth: number): number {
    if (containerWidth <= 800) return 0.7;
    if (containerWidth <= 1000) return 0.8;
    return 1;
  }

  // Calculate zoom level based on scale
  getZoomLevel(scale: number): number {
    if (scale === 1) return 0.75;
    if (scale === 0.8) return 0.7;
    return 0.625; // For scale = 0.7
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
