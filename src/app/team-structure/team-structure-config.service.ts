import { Injectable } from '@angular/core';
import {
  NodeTypes,
  NodeColors,
  ChartOptions,
  NodeData,
  LinkData,
  ChartFonts,
} from './team-structure.model';
import { AlignmentType } from './alignment.service';

@Injectable({
  providedIn: 'root',
})
export class TeamStructureConfigService {
  // Node type constants
  readonly NODE_TYPES: NodeTypes = {
    MAIN: ['Portfolio', 'PDT', 'Team'],
    JUNCTION: ['vertical-junction', 'horizontal-line'],
    CONTRIBUTOR: ['AIT', 'Team Backlog', 'SPK', 'Jira Board'],
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
    // Calculate node positions using centralized method
    const positions = this.calculateNodePositions(
      containerWidth,
      centerX,
      scale,
      mainNodeSize
    );

    // Different settings for vertical vs horizontal layout
    const isVerticalLayout = positions.isVerticalLayout;
    const gridConfig = isVerticalLayout
      ? {
          left: '0%',
          right: '0%',
          top: '3%',
          bottom: '15%', // More bottom margin for vertical layout
          containLabel: true,
        }
      : {
          left: '0%',
          right: '0%',
          top: '5%',
          bottom: '10%',
          containLabel: true,
        };

    const centerConfig = isVerticalLayout
      ? ['50%', '50%'] // Perfect center for vertical layout
      : ['55%', '50%']; // Slightly right for horizontal layout

    return {
      grid: gridConfig,
      tooltip: this.getTooltipConfig(teamStructureData),
      series: [
        {
          animation: false,
          type: 'graph',
          layout: 'none',
          roam: false,
          zoom: 0.95, // Revert to 1, rely on positioning and node sizes
          center: centerConfig,
          scaleLimit: { min: 0.3, max: 3 },
          label: this.getDefaultLabelConfig(),
          edgeLabel: { show: false },
          data: [
            // Main nodes
            ...this.createMainNodes(
              positions.portfolioX,
              positions.pdtX,
              positions.teamsX,
              positions.portfolioY,
              positions.pdtY,
              positions.teamsY,
              mainNodeSize,
              mainFont,
              formatNodeLabel,
              getNodeLabel,
              portfolioName,
              trainName,
              teamName
            ),

            // Junction nodes
            ...this.createJunctionNodes(positions.teamsX, positions.junctionY),

            // Bottom row nodes
            ...this.createContributorNodes(
              positions.bottomRowStartX,
              positions.bottomRowSpacing,
              positions.contributorsY,
              teamNodeSize,
              memberFont,
              memberBoldFont,
              getNodeLabel
            ),

            // Vertical connection nodes
            ...this.createConnectorNodes(
              positions.bottomRowStartX,
              positions.bottomRowSpacing,
              positions.horizontalConnectorsY
            ),
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
            { name: 'team' },
            { name: 'junction' },
            { name: 'member' },
          ],
        },
      ],
    } as any;
  }

  // Get tooltip configuration
  private getTooltipConfig(teamStructureData: any) {
    return {
      trigger: 'item',
      backgroundColor: 'rgba(0,0,0,0)',
      borderWidth: 0,
      padding: 0,
      confine: true,
      position: function (
        pos: any,
        params: any,
        dom: any,
        rect: any,
        size: any
      ) {
        // Calculate position to ensure tooltip is fully visible
        const viewWidth = size.viewSize[0];
        const viewHeight = size.viewSize[1];
        const contentWidth = size.contentSize[0];
        const contentHeight = size.contentSize[1];

        let x = pos[0];
        let y = pos[1];

        // Add offset to avoid cursor overlap
        const offsetX = 15;
        const offsetY = 15;

        // Prevent tooltip from being cut off on the right
        if (x + contentWidth + offsetX > viewWidth) {
          x = Math.max(10, viewWidth - contentWidth - 10);
        } else {
          x = x + offsetX;
        }

        // Prevent tooltip from being cut off on the left
        if (x < 10) {
          x = 10;
        }

        // Prevent tooltip from being cut off at the bottom
        if (y + contentHeight + offsetY > viewHeight) {
          y = Math.max(10, viewHeight - contentHeight - 10);
        } else {
          y = y + offsetY;
        }

        // Prevent tooltip from being cut off at the top
        if (y < 10) {
          y = 10;
        }

        return [x, y];
      },
      extraCssText:
        'box-shadow: 0 0 8px 0 rgba(0,0,0,0.6); border-radius: 10px; max-width: none !important; word-wrap: break-word; overflow: hidden;',
      formatter: (params: { data: any }) => {
        const data = params.data;
        let content = '';

        // Skip tooltips for contributor nodes (AIT, Team Backlog, SPK, Jira Board)
        if (data.category === 'member') {
          return '';
        }

        // Fixed consistent sizing for all screen sizes - no responsive scaling
        const width = 220;
        const titleFont = 15;
        const bodyFont = 12;
        const padding = 8;

        // Helper function to wrap text if needed
        const wrapText = (
          text: string | null | undefined,
          maxLength: number
        ): string => {
          if (!text) return '';
          const textStr = String(text);
          if (textStr.length <= maxLength) return textStr;

          // Find a good break point
          const words = textStr.split(' ');
          if (words.length === 1) {
            // Single word, break it if too long
            if (textStr.length > maxLength) {
              return textStr.substring(0, maxLength - 3) + '...';
            }
            return textStr;
          }

          const midPoint = Math.floor(words.length / 2);
          const firstHalf = words.slice(0, midPoint).join(' ');
          const secondHalf = words.slice(midPoint).join(' ');

          return `${firstHalf}<br/>${secondHalf}`;
        };

        // Helper function to truncate text if it's too long
        const truncateText = (
          text: string | null | undefined,
          maxLength: number
        ): string => {
          if (!text) return '';
          const textStr = String(text);
          if (textStr.length <= maxLength) return textStr;
          return textStr.substring(0, maxLength - 3) + '...';
        };

        if (data.category === 'portfolio') {
          // Handle array structure - use first portfolio for tooltip
          const firstPortfolio = Array.isArray(teamStructureData)
            ? teamStructureData[0]
            : teamStructureData;
          const portfolioName = firstPortfolio?.portfolioName ?? '';
          const wrappedName = wrapText(portfolioName, 25);
          const portfolioId = truncateText(
            firstPortfolio?.portfolioId ?? '',
            30
          );
          const portfolioMgr = truncateText(
            firstPortfolio?.portfolioTechMgr ?? '',
            30
          );

          content = `
            <div style="background: #E0E0E0; color: #000; padding: ${padding}px; font-weight: normal; font-size: ${titleFont}px; text-align: center; border-top-left-radius: 10px; border-top-right-radius: 10px; line-height: 1.3; word-wrap: break-word; overflow-wrap: break-word;">
              ${wrappedName}
            </div>
            <div style="background: #fff; padding: ${padding}px; font-size: ${bodyFont}px; color: #000000; text-align: left; border-bottom-left-radius: 10px; border-bottom-right-radius: 10px; word-wrap: break-word; overflow-wrap: break-word;">
              Portfolio ID<br><span style='color:#888; word-wrap: break-word; overflow-wrap: break-word;'>${portfolioId}</span><br>
              Manager<br><span style='color:#888; word-wrap: break-word; overflow-wrap: break-word;'>${portfolioMgr}</span>
            </div>
          `;
        } else if (data.category === 'pdt') {
          // Handle array structure - use first portfolio for tooltip
          const firstPortfolio = Array.isArray(teamStructureData)
            ? teamStructureData[0]
            : teamStructureData;
          const pdtData = firstPortfolio?.children?.[0] ?? {};
          const pdtName = pdtData?.pdtname ?? '';
          const wrappedName = wrapText(pdtName, 25);
          const pdtId = truncateText(pdtData?.pdtid ?? '', 30);
          const pdtMgr = truncateText(pdtData?.pdtTechMgr ?? '', 30);

          content = `
            <div style="background: #C62828; color: #fff; padding: ${padding}px; font-weight: normal; font-size: ${titleFont}px; text-align: center; border-top-left-radius: 10px; border-top-right-radius: 10px; line-height: 1.3; word-wrap: break-word; overflow-wrap: break-word;">
              ${wrappedName}
            </div>
            <div style="background: #fff; padding: ${padding}px; font-size: ${bodyFont}px; color: #000000; text-align: left; border-bottom-left-radius: 10px; border-bottom-right-radius: 10px; word-wrap: break-word; overflow-wrap: break-word;">
              PDT ID<br><span style='color:#888; word-wrap: break-word; overflow-wrap: break-word;'>${pdtId}</span><br>
              PDT Manager<br><span style='color:#888; word-wrap: break-word; overflow-wrap: break-word;'>${pdtMgr}</span>
            </div>
          `;
        } else if (data.category === 'team') {
          // Handle array structure - use first portfolio for tooltip
          const firstPortfolio = Array.isArray(teamStructureData)
            ? teamStructureData[0]
            : teamStructureData;
          const teamData = firstPortfolio?.children?.[0]?.children?.[0] ?? {};
          const teamName = teamData?.teamName ?? '';
          const wrappedName = wrapText(teamName, 25);
          const teamId = truncateText(teamData?.teamId ?? '', 30);
          const teamType = truncateText(teamData?.type ?? '', 30);
          const methodology = truncateText(teamData?.methodology ?? '', 30);
          const teamMgr = truncateText(teamData?.teamTechmgr ?? '', 30);
          const teamPOC = truncateText(teamData?.teamPOC ?? '', 30);

          content = `
            <div style="background: #012169; color: #fff; padding: ${padding}px; font-weight: normal; font-size: ${titleFont}px; text-align: center; border-top-left-radius: 10px; border-top-right-radius: 10px; line-height: 1.3; word-wrap: break-word; overflow-wrap: break-word;">
              ${wrappedName}
            </div>
            <div style="background: #fff; padding: ${padding}px; font-size: ${bodyFont}px; color: #000000; text-align: left; border-bottom-left-radius: 10px; border-bottom-right-radius: 10px; word-wrap: break-word; overflow-wrap: break-word;">
              Team ID<br><span style='color:#888; word-wrap: break-word; overflow-wrap: break-word;'>${teamId}</span><br>
              Team Type<br><span style='color:#888; word-wrap: break-word; overflow-wrap: break-word;'>${teamType}</span><br>
              Methodology<br><span style='color:#888; word-wrap: break-word; overflow-wrap: break-word;'>${methodology}</span><br>
              Team Manager<br><span style='color:#888; word-wrap: break-word; overflow-wrap: break-word;'>${teamMgr}</span><br>
              Team POC<br><span style='color:#888; word-wrap: break-word; overflow-wrap: break-word;'>${teamPOC}</span>
            </div>
          `;
        }

        return `<div style="background: transparent; border-radius: 10px; width: ${width}px; max-width: ${width}px; min-width: ${width}px; overflow: hidden; box-shadow: none; word-wrap: break-word; overflow-wrap: break-word;">${content}</div>`;
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
    portfolioY: number,
    pdtY: number,
    teamsY: number,
    size: number,
    mainFont: number,
    formatNodeLabel: Function,
    getNodeLabel: Function,
    portfolioName: string,
    trainName: string,
    teamName: string
  ): NodeData[] {
    return [
      {
        name: 'Portfolio',
        category: 'portfolio',
        x: portfolioX,
        y: portfolioY,
        symbolSize: size,
        itemStyle: { color: this.COLORS.PORTFOLIO },
        label:
          getNodeLabel('Portfolio') ||
          formatNodeLabel(portfolioName, 'Portfolio', mainFont, true),
      },
      {
        name: 'PDT',
        category: 'pdt',
        x: pdtX,
        y: pdtY,
        symbolSize: size,
        itemStyle: { color: this.COLORS.PDT },
        label:
          getNodeLabel('PDT') ||
          formatNodeLabel(trainName, 'PDT', mainFont, false),
      },
      {
        name: 'Team',
        category: 'team',
        x: teamsX,
        y: teamsY,
        symbolSize: size,
        itemStyle: { color: this.COLORS.TEAM },
        label:
          getNodeLabel('Team') ||
          formatNodeLabel(teamName, 'Team', mainFont, false),
      },
    ];
  }

  // Create junction node configurations
  private createJunctionNodes(teamsX: number, junctionY: number): NodeData[] {
    return [
      {
        name: 'vertical-junction',
        category: 'junction',
        x: teamsX,
        y: junctionY,
        symbolSize: 0,
        itemStyle: { color: 'rgba(0,0,0,0)' },
        label: { show: false },
      },
    ];
  }

  // Create contributor node configurations
  private createContributorNodes(
    startX: number,
    spacing: number,
    contributorNodesY: number,
    size: number,
    memberFont: number,
    memberBoldFont: number,
    getNodeLabel: Function
  ): NodeData[] {
    return this.NODE_TYPES.CONTRIBUTOR.map((name, index) => ({
      name,
      category: 'member',
      x: startX + index * spacing,
      y: contributorNodesY,
      symbolSize: size * 1.0,
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
  private createConnectorNodes(
    startX: number,
    spacing: number,
    connectorNodesY: number
  ): NodeData[] {
    return [1, 2, 3, 4].map((i) => ({
      name: `v${i}`,
      category: 'junction',
      x: startX + (i - 1) * spacing,
      y: connectorNodesY,
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
        target: 'Team',
        lineStyle: { width: 1, color: this.COLORS.CONNECTIONS },
      },
    ];
  }

  // Create vertical link from teams to junction
  private createVerticalLink(): LinkData {
    return {
      source: 'Team',
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
    if (containerWidth <= 750) return 0.75;
    return 1;
  }

  // Calculate zoom level based on scale
  getZoomLevel(scale: number): number {
    if (scale === 1) return 0.8;
    if (scale === 0.8) return 0.7;
    return 0.65;
  }

  // Calculate font sizes based on scale and containerWidth
  getChartFonts(scale: number, containerWidth: number): ChartFonts {
    const verticalLayoutBreakpoint = 600;
    const isVerticalLayout = containerWidth <= verticalLayoutBreakpoint;
    const isSmallHorizontal =
      containerWidth > verticalLayoutBreakpoint && containerWidth <= 750;

    if (isVerticalLayout) {
      return {
        // Sizes for Vertical Layout (main nodes larger)
        mainNodeSize: 220 * scale,
        teamNodeSize: 100 * scale,
        mainFont: 20 * scale,
        mainTitleFont: 15 * scale,
        memberFont: 13 * scale,
        memberBoldFont: 15 * scale,
      };
    } else if (isSmallHorizontal) {
      // Sizes for Small Horizontal Layout (600px < width <= 750px) - bigger text to compensate for 0.75 scale
      return {
        mainNodeSize: 200 * scale,
        teamNodeSize: 85 * scale,
        mainFont: 22 * scale, // Increased from 18 to 22
        mainTitleFont: 17 * scale, // Increased from 14 to 17
        memberFont: 15 * scale, // Increased from 12 to 15
        memberBoldFont: 16 * scale, // Increased from 13 to 16
      };
    } else {
      // Sizes for Large Horizontal Layout (width > 750px)
      return {
        mainNodeSize: 200 * scale, // Consistent size for horizontal main nodes
        teamNodeSize: 85 * scale,
        mainFont: 18 * scale,
        mainTitleFont: 14 * scale,
        memberFont: 12 * scale,
        memberBoldFont: 13 * scale,
      };
    }
  }

  // Calculate node positions for given container dimensions
  calculateNodePositions(
    containerWidth: number,
    centerX: number,
    scale: number,
    mainNodeSize: number
  ) {
    const verticalLayoutBreakpoint = 600;
    const isVerticalLayout = containerWidth <= verticalLayoutBreakpoint;

    let portfolioX: number, pdtX: number, teamsX: number;
    let portfolioY: number, pdtY: number, teamsY: number;
    let junctionY: number, horizontalConnectorsY: number, contributorsY: number;
    let bottomRowSpacing: number,
      bottomRowWidth: number,
      bottomRowStartX: number;

    // Effective mainNodeSize is already scaled and passed in.
    // For internal calculations, like Y positions relative to node centers.
    const currentMainNodeRadius = mainNodeSize / 2;
    const fonts = this.getChartFonts(scale, containerWidth); // Get current fonts for teamNodeSize etc.
    const currentTeamNodeRadius = fonts.teamNodeSize / 2;

    if (isVerticalLayout) {
      portfolioX = centerX;
      pdtX = centerX;
      teamsX = centerX;

      // Y positions for vertical stacking (centers of nodes)
      // Using mainNodeSize which is larger in vertical layout
      const verticalSpacing = 30 * scale; // Space between stacked main nodes
      portfolioY = 60 * scale + currentMainNodeRadius; // Increased from 40 to 60 for more top spacing
      pdtY =
        portfolioY +
        currentMainNodeRadius +
        verticalSpacing +
        currentMainNodeRadius;
      teamsY =
        pdtY + currentMainNodeRadius + verticalSpacing + currentMainNodeRadius;

      junctionY = teamsY + currentMainNodeRadius + 40 * scale;
      horizontalConnectorsY = junctionY;
      contributorsY = junctionY + 35 * scale + currentTeamNodeRadius;

      bottomRowSpacing = Math.min(containerWidth / 3, 140 * scale); // Increased from 3.5 to 3 and from 100 to 120 for more spacing
      bottomRowWidth = 3 * bottomRowSpacing;
      bottomRowStartX = centerX - bottomRowWidth / 2;
    } else {
      // Horizontal Layout
      // MAXIMUM spacing by placing nodes at absolute edges
      // Portfolio at the very left edge, Team at the very right edge
      portfolioX = currentMainNodeRadius; // Absolute left edge
      teamsX = containerWidth - currentMainNodeRadius; // Absolute right edge
      pdtX = centerX; // Perfect center

      // Safety check for very narrow screens (shouldn't happen with 600px breakpoint)
      const minSpacing = 10 * scale; // Reduced minimum for maximum spread

      // Only adjust if there's actual overlap (very unlikely with proper breakpoint)
      if (
        pdtX - portfolioX <
        currentMainNodeRadius + minSpacing + currentMainNodeRadius
      ) {
        portfolioX =
          pdtX - currentMainNodeRadius - minSpacing - currentMainNodeRadius;
      }

      if (
        teamsX - pdtX <
        currentMainNodeRadius + minSpacing + currentMainNodeRadius
      ) {
        teamsX =
          pdtX + currentMainNodeRadius + minSpacing + currentMainNodeRadius;
      }

      // Common Y for main nodes in horizontal layout
      const mainNodesBaseY = 80 * scale;
      portfolioY = mainNodesBaseY + currentMainNodeRadius;
      pdtY = mainNodesBaseY + currentMainNodeRadius;
      teamsY = mainNodesBaseY + currentMainNodeRadius;

      // Cascade Y positions downwards from main nodes
      junctionY = teamsY + currentMainNodeRadius + 100 * scale;
      horizontalConnectorsY = junctionY;
      contributorsY = junctionY + 60 * scale + currentTeamNodeRadius;

      // Contributor X positioning, centered under the 'Team' node
      bottomRowSpacing = Math.min(containerWidth / 4, 125 * scale);
      bottomRowWidth = 3 * bottomRowSpacing;
      bottomRowStartX = teamsX - bottomRowWidth / 2; // Center under Team node
    }

    return {
      portfolioX,
      pdtX,
      teamsX,
      portfolioY,
      pdtY,
      teamsY,
      junctionY,
      horizontalConnectorsY,
      contributorsY,
      bottomRowStartX,
      bottomRowSpacing,
      isVerticalLayout,
    };
  }

  // Update node positions for existing nodes (used during resize)
  updateNodePositions(
    nodes: any[],
    containerWidth: number,
    centerX: number,
    scale: number,
    fonts: any
  ): void {
    const positions = this.calculateNodePositions(
      containerWidth,
      centerX,
      scale,
      fonts.mainNodeSize
    );

    for (const node of nodes) {
      this.positionNode(node, positions, scale, fonts);
    }
  }

  // Position a specific node based on its type (used by updateNodePositions)
  private positionNode(
    node: any,
    positions: any,
    scale: number,
    fonts: any
  ): void {
    switch (node.name) {
      case 'Portfolio':
        this.positionMainNode(
          node,
          positions.portfolioX,
          positions.portfolioY,
          scale,
          fonts
        );
        break;
      case 'PDT':
        this.positionMainNode(
          node,
          positions.pdtX,
          positions.pdtY,
          scale,
          fonts
        );
        break;
      case 'Team':
        this.positionMainNode(
          node,
          positions.teamsX,
          positions.teamsY,
          scale,
          fonts
        );
        break;
      case 'vertical-junction':
      case 'horizontal-line':
        node.x = positions.teamsX;
        node.y = positions.junctionY;
        break;
      case 'AIT':
      case 'SPK':
      case 'Team Backlog':
      case 'Jira Board':
        this.positionContributorNode(
          node,
          positions.bottomRowStartX,
          positions.bottomRowSpacing,
          positions.contributorsY,
          scale,
          fonts
        );
        break;
      case 'v1':
      case 'v2':
      case 'v3':
      case 'v4':
        const vIndex = parseInt(node.name.replace('v', '')) - 1;
        node.x =
          positions.bottomRowStartX + vIndex * positions.bottomRowSpacing;
        node.y = positions.horizontalConnectorsY;
        break;
    }
  }

  // Position a main node (Portfolio, PDT, Team)
  private positionMainNode(
    node: any,
    nodeX: number,
    nodeY: number,
    scale: number,
    fonts: any
  ): void {
    node.x = nodeX;
    node.y = nodeY;
    node.symbolSize = fonts.mainNodeSize;
    if (node.label?.rich) {
      node.label.rich.name.fontSize = fonts.mainFont;
      node.label.rich.title.fontSize = fonts.mainTitleFont;
    }
  }

  // Position a contributor node
  private positionContributorNode(
    node: any,
    startX: number,
    spacing: number,
    nodeY: number,
    scale: number,
    fonts: any
  ): void {
    const index = this.NODE_TYPES.CONTRIBUTOR.indexOf(node.name);
    node.x = startX + index * spacing;
    node.y = nodeY;
    node.symbolSize = fonts.teamNodeSize * 1.0;
  }

  // -------------- TEXT FORMATTING UTILITIES --------------

  /**
   * Format long text by adding line breaks intelligently
   */
  formatLongText(text: string, maxLength: number): string {
    if (text.length <= maxLength || text.includes('\n')) {
      return text;
    }

    // For very long text, try to break into multiple lines
    if (text.length > maxLength * 2) {
      return this.formatVeryLongText(text, maxLength);
    }

    // Find the best break point near the middle
    const halfIndex = Math.floor(text.length / 2);
    let breakIndex = text.lastIndexOf(' ', halfIndex + 5); // Allow some flexibility

    // If no space found near middle, look for other break points
    if (breakIndex === -1 || breakIndex < 3) {
      breakIndex = text.indexOf(' ', halfIndex - 5);
    }

    // If still no good break point, look for other characters
    if (breakIndex === -1) {
      const breakChars = ['-', '&', '/', '|'];
      for (const char of breakChars) {
        breakIndex = text.lastIndexOf(char, halfIndex + 3);
        if (breakIndex > 3) {
          breakIndex++; // Break after the character
          break;
        }
      }
    }

    // Last resort: break at a reasonable position
    if (breakIndex === -1) {
      breakIndex = Math.min(halfIndex, maxLength);
    }

    return (
      text.substring(0, breakIndex).trim() +
      '\n' +
      text.substring(breakIndex).trim()
    );
  }

  /**
   * Format very long text into multiple lines
   */
  private formatVeryLongText(text: string, maxLength: number): string {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length + word.length + 1 <= maxLength) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Single word longer than maxLength
          if (word.length > maxLength) {
            lines.push(word.substring(0, maxLength - 1) + '-');
            currentLine = word.substring(maxLength - 1);
          } else {
            currentLine = word;
          }
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    // Limit to 3 lines maximum for readability
    if (lines.length > 3) {
      lines[2] = lines[2] + '...';
      return lines.slice(0, 3).join('\n');
    }

    return lines.join('\n');
  }

  /**
   * Calculate font size based on text length
   */
  calculateFontSize(text: string, baseSize: number): number {
    if (text.length > 15) {
      return baseSize * 0.85;
    }
    if (text.length > 10) {
      return baseSize * 0.9;
    }
    return baseSize;
  }

  // -------------- NODE LABEL CREATION --------------

  /**
   * Create label for main nodes (Portfolio, PDT, Team)
   */
  createMainNodeLabel(
    name: string,
    title: string,
    fonts: ChartFonts,
    portfolioCount?: number
  ): any {
    // Apply text wrapping to the name
    const wrappedName = this.formatLongText(name, 15);

    // Determine text color based on node type
    // Portfolio has light background (#E0E0E0) so use black text
    // PDT has dark background (#C62828) so use white text
    // Team has dark background (#012169) so use white text
    const textColor = title === 'Portfolio' ? '#000000' : '#FFFFFF';

    // For Portfolio node, show count if there are multiple portfolios
    if (title === 'Portfolio' && portfolioCount && portfolioCount > 1) {
      return {
        formatter: `{name|${wrappedName}}\n{title|${title}}\n{count|${portfolioCount}}`,
        rich: {
          name: {
            fontSize: fonts.mainFont,
            fontWeight: 'normal',
            lineHeight: 22,
            color: textColor,
            fontFamily: 'Connections, Arial, sans-serif',
            padding: [0, 0, 0, 0],
            align: 'center',
            verticalAlign: 'middle',
          },
          title: {
            fontSize: fonts.mainTitleFont,
            fontWeight: 'normal',
            lineHeight: 18,
            color: textColor,
            fontFamily: 'Connections, Arial, sans-serif',
            align: 'center',
            verticalAlign: 'middle',
          },
          count: {
            fontSize: fonts.mainTitleFont,
            fontWeight: 'bold',
            lineHeight: 18,
            color: textColor,
            fontFamily: 'Connections, Arial, sans-serif',
            align: 'center',
            verticalAlign: 'middle',
          },
        },
      };
    }

    return {
      formatter: `{name|${wrappedName}}\n{title|${title}}`,
      rich: {
        name: {
          fontSize: fonts.mainFont,
          fontWeight: 'normal',
          lineHeight: 22,
          color: textColor,
          fontFamily: 'Connections, Arial, sans-serif',
          padding: [0, 0, 0, 0],
          align: 'center',
          verticalAlign: 'middle',
        },
        title: {
          fontSize: fonts.mainTitleFont,
          fontWeight: 'normal',
          lineHeight: 18,
          color: textColor,
          fontFamily: 'Connections, Arial, sans-serif',
          align: 'center',
          verticalAlign: 'middle',
        },
      },
    };
  }

  /**
   * Create label for contributor nodes (AIT, Team Backlog, etc.)
   */
  createContributorNodeLabel(
    nodeName: string,
    fonts: ChartFonts,
    nodeDataCounts: Record<string, number>
  ): any {
    const count = nodeDataCounts[nodeName] || 0;
    const noData = count === 0;

    // Apply text wrapping to long names
    let displayName = nodeName;
    if (nodeName === 'Team Backlog') {
      displayName = 'Team\nBacklog';
    } else if (nodeName.length > 10) {
      displayName = this.formatLongText(nodeName, 10);
    }

    return {
      formatter: noData
        ? `{name|${displayName}}\n{plus|+}`
        : `{name|${displayName}}\n{count|${count}}`,
      rich: {
        name: {
          fontSize: this.calculateFontSize(nodeName, fonts.memberBoldFont),
          fontWeight: 'normal',
          lineHeight: 16,
          color: '#000000',
          fontFamily: 'Connections, Arial, sans-serif',
          align: 'center',
          verticalAlign: 'middle',
        },
        plus: {
          fontSize: fonts.memberBoldFont,
          fontWeight: 'bold',
          color: '#000000',
          lineHeight: 20,
          align: 'center',
        },
        count: {
          fontSize: fonts.memberBoldFont,
          fontWeight: 'bold',
          color: '#000000',
          lineHeight: 18,
          align: 'center',
        },
      },
    };
  }

  /**
   * Formats a node label with proper text wrapping and dynamic sizing
   */
  formatNodeLabel(
    name: string,
    title: string,
    baseSize: number,
    isLight: boolean
  ): any {
    const nameText = this.formatLongText(name, 12);
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

  // -------------- NODE UTILITIES --------------

  /**
   * Check if a node is non-interactive
   */
  isNonInteractiveNode(nodeName: string): boolean {
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
   * Get zoom level for width with enhanced logic
   */
  getZoomForWidth(containerWidth: number, scale: number): number {
    // Use more conservative zoom levels to prevent cutoff
    if (containerWidth <= 500) {
      return 0.6; // Very small screens need more zoom out
    }
    if (containerWidth <= 750) {
      return 0.7; // Small screens
    }
    return this.getZoomLevel(scale);
  }

  /**
   * Extract nodes from chart options
   */
  getNodesFromOption(options: any): any[] | null {
    if (!options?.series?.[0]?.data || !Array.isArray(options.series[0].data)) {
      return null;
    }

    return options.series[0].data;
  }

  /**
   * Get node ID based on node type for alignment data
   */
  getNodeIdByType(nodeName: string, teamStructureData: any[]): string {
    if (!teamStructureData || teamStructureData.length === 0) {
      return '';
    }

    const firstPortfolio = teamStructureData[0];

    switch (nodeName) {
      case 'Portfolio':
        return firstPortfolio.portfolioId?.toString() ?? '';
      case 'PDT':
        return firstPortfolio.children?.[0]?.pdtid?.toString() ?? '';
      case 'Team':
        return (
          firstPortfolio.children?.[0]?.children?.[0]?.teamId?.toString() ?? ''
        );
      default:
        return '';
    }
  }

  /**
   * Calculate normal node sizes for different node types
   */
  getNormalNodeSizes(
    mainNodeSize: number,
    teamNodeSize: number
  ): Record<string, number> {
    return {
      Portfolio: mainNodeSize,
      PDT: mainNodeSize,
      Team: mainNodeSize,
      AIT: teamNodeSize * 1.0,
      SPK: teamNodeSize * 1.0,
      'Team Backlog': teamNodeSize * 1.0,
      'Jira Board': teamNodeSize * 1.0,
    };
  }

  /**
   * Get alignment type mapping for node names
   */
  getNodeToAlignmentTypeMap(): { [key: string]: AlignmentType | 'PORTFOLIO' } {
    return {
      Portfolio: 'PORTFOLIO', // Special case - uses getPortfolioAlignments
      PDT: 'TEAMTOTRAIN',
      Team: 'TEAMTOPDT',
      AIT: 'TEAMTOAIT',
      'Team Backlog': 'TEAMTOTPK',
      SPK: 'TEAMTOSPK',
      'Jira Board': 'TEAMTOJIRABOARD',
    };
  }
}
