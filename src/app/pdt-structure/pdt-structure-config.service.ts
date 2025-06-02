import { Injectable } from '@angular/core';
import {
  NodeTypes,
  NodeColors,
  ChartOptions,
  NodeData,
  LinkData,
  ChartFonts,
  PDTStructureData,
} from './pdt-structure.model';

@Injectable({
  providedIn: 'root',
})
export class PdtStructureConfigService {
  // Node type constants
  readonly NODE_TYPES: NodeTypes = {
    MAIN: ['Portfolio', 'PDT'],
    JUNCTION: [
      'vertical-junction',
      'horizontal-junction',
      'team-junction',
      'team-vertical-junction',
    ],
    PRODUCT: ['Product1', 'Product2', 'Product3', 'Product4', 'Product5'],
    TEAM: ['Team1', 'Team2', 'Team3', 'Team4', 'Team5'],
    CONNECTOR: [
      'v1',
      'v2',
      'v3',
      'v4',
      'v5',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      't1',
      't2',
      't3',
      't4',
      't5',
    ],
  };

  // Node colors
  readonly COLORS: NodeColors = {
    PORTFOLIO: '#E0E0E0',
    PDT: '#C62828',
    TEAM: '#012169',
    CONNECTIONS: '#B0BEC5',
    PRODUCT: {
      bg: '#FFFFFF',
      border: '#000000',
    },
    TEXT: {
      LIGHT: '#000000',
      DARK: '#FFFFFF',
    },
  };

  /**
   * Get responsive scale based on container width
   */
  getResponsiveScale(containerWidth: number): number {
    if (containerWidth <= 750) return 0.75;
    return 1;
  }

  /**
   * Get chart fonts based on scale and container width
   */
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

  /**
   * Calculate node positions for PDT structure layout
   */
  calculateNodePositions(
    containerWidth: number,
    centerX: number,
    scale: number,
    mainNodeSize: number,
    numProducts: number = 5,
    numTeams: number = 5
  ) {
    const isVerticalLayout = containerWidth <= 600;

    if (isVerticalLayout) {
      // Vertical layout for mobile
      const productsSpacing = 100;
      const productsWidth = Math.max(0, (numProducts - 1) * productsSpacing); // Adjust for actual number of products
      const productsStartX = centerX - productsWidth / 2;
      const productsCenterX = centerX; // Center of the products group

      // Calculate team positioning with proper spacing above and below each node
      const teamNodeHeight = 45; // Increased from 35 to accommodate taller nodes
      const teamSpacing = Math.max(
        teamNodeHeight,
        Math.min(55, 220 / Math.max(1, numTeams - 1)) // Adjusted for 5 teams max
      ); // Ensure minimum spacing for visual separation
      const teamJunctionY = 300; // Increased from 250 to add top margin
      const totalTeamHeight = Math.max(0, (numTeams - 1) * teamSpacing);
      const teamStartY = teamJunctionY - totalTeamHeight / 2; // Center teams around junction

      return {
        isVerticalLayout: true,
        portfolioX: centerX,
        portfolioY: 150, // Increased from 100 to add top margin
        pdtX: centerX,
        pdtY: 300, // Increased from 250 to add top margin
        productsStartX: productsStartX,
        productsY: 500, // Increased from 450 to maintain spacing
        productsSpacing: productsSpacing,
        teamsStartX: centerX + 320, // Reduced from 400 to 320
        teamsY: teamStartY,
        teamsSpacing: teamSpacing,
        junctionY: 370, // Increased from 320 to maintain spacing
        horizontalConnectorsY: 430, // Increased from 380 to maintain spacing
        productsCenterX: productsCenterX,
        teamJunctionX: centerX + 220, // Reduced from 300 to 220
        teamJunctionY: teamJunctionY,
        teamConnectorsX: centerX + 220, // Reduced from 300 to 220
        numProducts: numProducts,
        numTeams: numTeams,
      };
    } else {
      // Horizontal layout for desktop
      const spacing = Math.max(200, containerWidth * 0.25);
      const productsSpacing = 100;
      const productsWidth = Math.max(0, (numProducts - 1) * productsSpacing); // Adjust for actual number of products
      const productsStartX = centerX - productsWidth / 2;
      const productsCenterX = centerX; // Center of the products group

      // Calculate team positioning with proper spacing above and below each node
      const teamNodeHeight = 40; // Increased from 30 to accommodate taller nodes
      const teamSpacing = Math.max(
        teamNodeHeight,
        Math.min(45, 180 / Math.max(1, numTeams - 1)) // Adjusted for 5 teams max
      ); // Ensure minimum spacing for visual separation
      const teamJunctionY = 250; // Increased from 200 to add top margin
      const totalTeamHeight = Math.max(0, (numTeams - 1) * teamSpacing);
      const teamStartY = teamJunctionY - totalTeamHeight / 2; // Center teams around junction

      return {
        isVerticalLayout: false,
        portfolioX: centerX - spacing,
        portfolioY: 250, // Increased from 200 to add top margin
        pdtX: centerX,
        pdtY: 250, // Increased from 200 to add top margin
        productsStartX: productsStartX,
        productsY: 450, // Increased from 400 to maintain spacing
        productsSpacing: productsSpacing,
        teamsStartX: centerX + 320, // Reduced from 400 to 320
        teamsY: teamStartY,
        teamsSpacing: teamSpacing,
        junctionY: 320, // Increased from 270 to maintain spacing
        horizontalConnectorsY: 380, // Increased from 330 to maintain spacing
        productsCenterX: productsCenterX,
        teamJunctionX: centerX + 220, // Reduced from 300 to 220
        teamJunctionY: teamJunctionY,
        teamConnectorsX: centerX + 220, // Reduced from 300 to 220
        numProducts: numProducts,
        numTeams: numTeams,
      };
    }
  }

  /**
   * Get chart options with responsive scaling
   */
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
    pdtName: string,
    pdtData: PDTStructureData
  ): ChartOptions {
    const numProducts = Math.min(5, pdtData.pdt?.products?.length || 0);
    const numTeams = Math.min(5, pdtData.pdt?.teams?.length || 0);

    const positions = this.calculateNodePositions(
      containerWidth,
      centerX,
      scale,
      mainNodeSize,
      numProducts,
      numTeams
    );

    const isVerticalLayout = positions.isVerticalLayout;
    const gridConfig = isVerticalLayout
      ? {
          left: '0%',
          right: '0%',
          top: '8%',
          bottom: '15%',
          containLabel: true,
        }
      : {
          left: '0%',
          right: '0%',
          top: '10%',
          bottom: '10%',
          containLabel: true,
        };

    const centerConfig = isVerticalLayout ? ['50%', '50%'] : ['50%', '50%'];

    return {
      grid: gridConfig,
      tooltip: this.getTooltipConfig(),
      series: [
        {
          animation: false,
          type: 'graph',
          layout: 'none',
          roam: false,
          zoom: 0.95,
          center: centerConfig,
          scaleLimit: { min: 0.3, max: 3 },
          label: this.getDefaultLabelConfig(),
          edgeLabel: { show: false },
          data: [
            // Main nodes (Portfolio and PDT)
            ...this.createMainNodes(
              positions.portfolioX,
              positions.pdtX,
              positions.portfolioY,
              positions.pdtY,
              mainNodeSize,
              mainFont,
              formatNodeLabel,
              getNodeLabel,
              portfolioName,
              pdtName,
              pdtData
            ),

            // Product nodes (bottom of PDT)
            ...this.createProductNodes(
              positions.productsStartX,
              positions.productsSpacing,
              positions.productsY,
              teamNodeSize,
              memberFont,
              memberBoldFont,
              getNodeLabel,
              pdtData.pdt?.products || [],
              numProducts
            ),

            // Team nodes (right of PDT)
            ...this.createTeamNodes(
              positions.teamsStartX,
              positions.teamsSpacing,
              positions.teamsY,
              teamNodeSize,
              memberFont,
              getNodeLabel,
              pdtData.pdt?.teams || [],
              numTeams
            ),

            // Junction and connector nodes
            ...this.createJunctionNodes(positions.pdtX, positions.junctionY),
            ...this.createHorizontalJunctionNodes(
              positions.productsCenterX,
              positions.horizontalConnectorsY
            ),
            ...this.createConnectorNodes(
              positions.productsStartX,
              positions.productsSpacing,
              positions.horizontalConnectorsY,
              numProducts
            ),
            ...this.createTeamJunctionNodes(
              positions.teamJunctionX,
              positions.teamJunctionY
            ),
            ...this.createTeamVerticalJunctionNodes(
              positions.teamJunctionX,
              positions.pdtY
            ),
            ...this.createTeamConnectorNodes(
              positions.teamConnectorsX,
              positions.teamsY,
              positions.teamsSpacing,
              numTeams
            ),
          ],
          links: [
            // Main connection between Portfolio and PDT
            this.createMainLink(),

            // Connections from PDT to products
            ...this.createProductLinks(),

            // Connections from PDT to teams
            ...this.createTeamLinks(),

            // Junction connections
            this.createJunctionLink(numProducts),

            // Horizontal connections between product connectors
            ...this.createHorizontalLinks(numProducts),

            // Team junction and connector links
            ...this.createTeamJunctionLinks(numTeams),
          ],
          categories: [
            { name: 'portfolio' },
            { name: 'pdt' },
            { name: 'product' },
            { name: 'team' },
            { name: 'junction' },
          ],
        },
      ],
    } as any;
  }

  /**
   * Create main nodes (Portfolio and PDT)
   */
  private createMainNodes(
    portfolioX: number,
    pdtX: number,
    portfolioY: number,
    pdtY: number,
    mainNodeSize: number,
    mainFont: number,
    formatNodeLabel: Function,
    getNodeLabel: Function,
    portfolioName: string,
    pdtName: string,
    pdtData: PDTStructureData
  ): NodeData[] {
    // Create fonts object from the passed parameters
    const fonts = {
      mainFont: mainFont,
      mainTitleFont: mainFont * 0.75,
      memberFont: mainFont * 0.65,
      memberBoldFont: mainFont * 0.7,
      mainNodeSize: mainNodeSize,
      teamNodeSize: mainNodeSize * 0.4,
    };

    // Calculate portfolio count (always 1 for PDT structure, but keeping consistent with team-structure)
    const portfolioCount = 1;

    return [
      {
        name: 'Portfolio',
        category: 'portfolio',
        x: portfolioX,
        y: portfolioY,
        symbolSize: mainNodeSize,
        itemStyle: { color: this.COLORS.PORTFOLIO },
        label:
          getNodeLabel('Portfolio') ||
          this.createMainNodeLabel(
            portfolioName,
            'Portfolio',
            fonts,
            portfolioCount
          ),
        fixed: true,
        portfolioName: pdtData.portfolioName,
        portfolioId: pdtData.portfolioId,
        portfolioTechMgr: pdtData.portfolioTechMgr,
      },
      {
        name: 'PDT',
        category: 'pdt',
        x: pdtX,
        y: pdtY,
        symbolSize: mainNodeSize,
        itemStyle: { color: this.COLORS.PDT },
        label:
          getNodeLabel('PDT') ||
          this.createMainNodeLabel(pdtName, 'PDT', fonts),
        fixed: true,
        pdtName: pdtData.pdt?.pdtName,
        pdtId: pdtData.pdt?.pdtId,
        pdtTechMgr: pdtData.pdt?.pdtTechMgr,
      },
    ];
  }

  /**
   * Create product nodes
   */
  private createProductNodes(
    startX: number,
    spacing: number,
    y: number,
    nodeSize: number,
    memberFont: number,
    memberBoldFont: number,
    getNodeLabel: Function,
    products: any[],
    numProducts: number
  ): NodeData[] {
    // Create fonts object from the passed parameters
    const fonts = {
      mainFont: memberFont * 1.2,
      mainTitleFont: memberFont,
      memberFont: memberFont * 3.6, // Increased from 2.4 to 3.6 (50% bigger: 2.4 * 1.5 = 3.6)
      memberBoldFont: memberBoldFont,
      mainNodeSize: nodeSize * 2,
      teamNodeSize: nodeSize,
    };

    return products.map((product, index) => ({
      name: `Product${index + 1}`,
      category: 'product',
      x: startX + index * spacing,
      y: y,
      symbolSize: nodeSize * 1.105, // Reduced from 1.3 to 1.105 (15% smaller: 1.3 * 0.85 = 1.105)
      symbol: 'circle',
      itemStyle: {
        color: this.COLORS.PRODUCT.bg,
        borderColor: this.COLORS.PRODUCT.border,
        borderWidth: 2,
      },
      label:
        getNodeLabel(`Product${index + 1}`) ||
        this.createProductNodeLabel(product.productName, fonts),
      fixed: true,
      productName: product.productName,
      productId: product.productId,
      productOwner: product.productOwner,
      productType: product.productType,
      status: product.status,
    }));
  }

  /**
   * Create team nodes
   */
  private createTeamNodes(
    startX: number,
    spacing: number,
    startY: number,
    nodeSize: number,
    memberFont: number,
    getNodeLabel: Function,
    teams: any[],
    numTeams: number
  ): NodeData[] {
    // Create fonts object from the passed parameters
    const fonts = {
      mainFont: memberFont * 1.2,
      mainTitleFont: memberFont,
      memberFont: memberFont * 3.825, // Increased from 2.55 to 3.825 (50% bigger: 2.55 * 1.5 = 3.825)
      memberBoldFont: memberFont * 1.6,
      mainNodeSize: nodeSize * 2,
      teamNodeSize: nodeSize,
    };

    // Limit to maximum of 5 teams
    const maxTeams = 5;
    const teamsToShow = teams.slice(0, maxTeams);

    return teamsToShow.map((team, index) => ({
      name: `Team${index + 1}`,
      category: 'team',
      x: startX,
      y: startY + index * spacing,
      symbolSize: [nodeSize * 2.2, nodeSize * 0.5], // Increased width from 1.8 to 2.2
      symbol:
        'path://M3,0 L117,0 Q120,0 120,3 L120,17 Q120,20 117,20 L3,20 Q0,20 0,17 L0,3 Q0,0 3,0 Z', // Increased width from 100 to 120
      itemStyle: {
        color: this.COLORS.TEAM,
      },
      label:
        getNodeLabel(`Team${index + 1}`) ||
        this.createTeamNodeLabel(team.teamName, fonts),
      fixed: true,
      teamName: team.teamName,
      teamId: team.teamId,
      type: team.type,
      methodology: team.methodology,
      teamTechMgr: team.teamTechMgr,
      teamPOC: team.teamPOC,
      capacity: team.capacity,
    }));
  }

  /**
   * Create junction nodes
   */
  private createJunctionNodes(pdtX: number, junctionY: number): NodeData[] {
    return [
      {
        name: 'vertical-junction',
        category: 'junction',
        x: pdtX,
        y: junctionY,
        symbolSize: 0,
        itemStyle: { color: 'rgba(0,0,0,0)' },
        label: { show: false },
        fixed: true,
      },
    ];
  }

  /**
   * Create horizontal junction nodes
   */
  private createHorizontalJunctionNodes(
    centerX: number,
    y: number
  ): NodeData[] {
    return [
      {
        name: 'horizontal-junction',
        category: 'junction',
        x: centerX,
        y: y,
        symbolSize: 0,
        itemStyle: { color: 'rgba(0,0,0,0)' },
        label: { show: false },
        fixed: true,
      },
    ];
  }

  /**
   * Create connector nodes
   */
  private createConnectorNodes(
    startX: number,
    spacing: number,
    y: number,
    numProducts: number
  ): NodeData[] {
    const connectors = [];
    for (let i = 0; i < numProducts; i++) {
      connectors.push({
        name: `v${i + 1}`,
        category: 'junction',
        x: startX + i * spacing,
        y: y,
        symbolSize: 0,
        itemStyle: { color: 'rgba(0,0,0,0)' },
        label: { show: false },
        fixed: true,
      });
    }
    return connectors;
  }

  /**
   * Create team junction nodes
   */
  private createTeamJunctionNodes(
    junctionX: number,
    junctionY: number
  ): NodeData[] {
    return [
      {
        name: 'team-junction',
        category: 'junction',
        x: junctionX,
        y: junctionY,
        symbolSize: 0,
        itemStyle: { color: 'rgba(0,0,0,0)' },
        label: { show: false },
        fixed: true,
      },
    ];
  }

  /**
   * Create team vertical junction nodes
   */
  private createTeamVerticalJunctionNodes(
    junctionX: number,
    pdtY: number
  ): NodeData[] {
    return [
      {
        name: 'team-vertical-junction',
        category: 'junction',
        x: junctionX,
        y: pdtY,
        symbolSize: 0,
        itemStyle: { color: 'rgba(0,0,0,0)' },
        label: { show: false },
        fixed: true,
      },
    ];
  }

  /**
   * Create team connector nodes
   */
  private createTeamConnectorNodes(
    x: number,
    startY: number,
    spacing: number,
    numTeams: number
  ): NodeData[] {
    const connectors = [];
    for (let i = 0; i < numTeams; i++) {
      connectors.push({
        name: `t${i + 1}`,
        category: 'junction',
        x: x,
        y: startY + i * spacing,
        symbolSize: 0,
        itemStyle: { color: 'rgba(0,0,0,0)' },
        label: { show: false },
        fixed: true,
      });
    }
    return connectors;
  }

  /**
   * Create main link between Portfolio and PDT
   */
  private createMainLink(): LinkData {
    return {
      source: 'Portfolio',
      target: 'PDT',
      lineStyle: {
        width: 1,
        color: this.COLORS.CONNECTIONS,
      },
    };
  }

  /**
   * Create links from PDT to products
   */
  private createProductLinks(): LinkData[] {
    return [
      {
        source: 'PDT',
        target: 'vertical-junction',
        lineStyle: {
          width: 1,
          color: this.COLORS.CONNECTIONS,
        },
      },
    ];
  }

  /**
   * Create links from PDT to teams
   */
  private createTeamLinks(): LinkData[] {
    return [
      {
        source: 'PDT',
        target: 'team-vertical-junction',
        lineStyle: {
          width: 1,
          color: this.COLORS.CONNECTIONS,
        },
      },
      {
        source: 'team-vertical-junction',
        target: 'team-junction',
        lineStyle: {
          width: 1,
          color: this.COLORS.CONNECTIONS,
        },
      },
    ];
  }

  /**
   * Create junction link
   */
  private createJunctionLink(numProducts: number): LinkData {
    return {
      source: 'vertical-junction',
      target: 'horizontal-junction',
      lineStyle: {
        width: 1,
        color: this.COLORS.CONNECTIONS,
        curveness: 0,
      },
    };
  }

  /**
   * Create horizontal links between connectors
   */
  private createHorizontalLinks(numProducts: number): LinkData[] {
    const links = [];

    // Connect horizontal junction to all product connectors
    for (let i = 1; i <= numProducts; i++) {
      links.push({
        source: 'horizontal-junction',
        target: `v${i}`,
        lineStyle: {
          width: 1,
          color: this.COLORS.CONNECTIONS,
          curveness: 0,
        },
      });
    }

    // Links from connectors to products
    for (let i = 1; i <= numProducts; i++) {
      links.push({
        source: `v${i}`,
        target: `Product${i}`,
        lineStyle: {
          width: 1,
          color: this.COLORS.CONNECTIONS,
          curveness: 0,
        },
      });
    }

    return links;
  }

  /**
   * Create team junction and connector links
   */
  private createTeamJunctionLinks(numTeams: number): LinkData[] {
    const links = [];

    // Horizontal links from team connectors to teams
    for (let i = 1; i <= numTeams; i++) {
      links.push({
        source: `t${i}`,
        target: `Team${i}`,
        lineStyle: {
          width: 1,
          color: this.COLORS.CONNECTIONS,
          curveness: 0,
        },
      });
    }

    // Links between team connectors (vertical line)
    for (let i = 1; i < numTeams; i++) {
      links.push({
        source: `t${i}`,
        target: `t${i + 1}`,
        lineStyle: {
          width: 1,
          color: this.COLORS.CONNECTIONS,
          curveness: 0,
        },
      });
    }

    // Horizontal link from team junction to first team connector
    links.push({
      source: 'team-junction',
      target: 't1',
      lineStyle: {
        width: 1,
        color: this.COLORS.CONNECTIONS,
        curveness: 0,
      },
    });

    return links;
  }

  /**
   * Get default label configuration
   */
  private getDefaultLabelConfig() {
    return {
      show: true,
      position: 'inside',
      fontSize: 12,
      fontWeight: 'normal',
    };
  }

  /**
   * Get tooltip configuration
   */
  private getTooltipConfig() {
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

        // Skip tooltips for junction and connector nodes
        if (data.category === 'junction') {
          return '';
        }

        // Fixed consistent sizing for all screen sizes
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
          const portfolioName = data.portfolioName || '';
          const wrappedName = wrapText(portfolioName, 25);
          const portfolioId = truncateText(data.portfolioId || '', 30);
          const portfolioMgr = truncateText(data.portfolioTechMgr || '', 30);

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
          const pdtName = data.pdtName || '';
          const wrappedName = wrapText(pdtName, 25);
          const pdtId = truncateText(data.pdtId || '', 30);
          const pdtMgr = truncateText(data.pdtTechMgr || '', 30);

          content = `
            <div style="background: #C62828; color: #fff; padding: ${padding}px; font-weight: normal; font-size: ${titleFont}px; text-align: center; border-top-left-radius: 10px; border-top-right-radius: 10px; line-height: 1.3; word-wrap: break-word; overflow-wrap: break-word;">
              ${wrappedName}
            </div>
            <div style="background: #fff; padding: ${padding}px; font-size: ${bodyFont}px; color: #000000; text-align: left; border-bottom-left-radius: 10px; border-bottom-right-radius: 10px; word-wrap: break-word; overflow-wrap: break-word;">
              PDT ID<br><span style='color:#888; word-wrap: break-word; overflow-wrap: break-word;'>${pdtId}</span><br>
              PDT Manager<br><span style='color:#888; word-wrap: break-word; overflow-wrap: break-word;'>${pdtMgr}</span>
            </div>
          `;
        } else if (data.category === 'product') {
          const productName = data.productName || '';
          const wrappedName = wrapText(productName, 25);
          const productId = truncateText(data.productId || '', 30);
          const productOwner = truncateText(data.productOwner || '', 30);
          const productType = truncateText(data.productType || '', 30);
          const status = truncateText(data.status || '', 30);

          content = `
            <div style="background: #FFFFFF; color: #000; border: 2px solid #000000; padding: ${padding}px; font-weight: normal; font-size: ${titleFont}px; text-align: center; border-top-left-radius: 10px; border-top-right-radius: 10px; line-height: 1.3; word-wrap: break-word; overflow-wrap: break-word;">
              ${wrappedName}
            </div>
            <div style="background: #fff; padding: ${padding}px; font-size: ${bodyFont}px; color: #000000; text-align: left; border-bottom-left-radius: 10px; border-bottom-right-radius: 10px; word-wrap: break-word; overflow-wrap: break-word;">
              Product ID<br><span style='color:#888; word-wrap: break-word; overflow-wrap: break-word;'>${productId}</span><br>
              Product Owner<br><span style='color:#888; word-wrap: break-word; overflow-wrap: break-word;'>${productOwner}</span><br>
              Type<br><span style='color:#888; word-wrap: break-word; overflow-wrap: break-word;'>${productType}</span><br>
              Status<br><span style='color:#888; word-wrap: break-word; overflow-wrap: break-word;'>${status}</span>
            </div>
          `;
        } else if (data.category === 'team') {
          const teamName = data.teamName || '';
          const wrappedName = wrapText(teamName, 25);
          const teamId = truncateText(data.teamId || '', 30);
          const teamType = truncateText(data.type || '', 30);
          const methodology = truncateText(data.methodology || '', 30);
          const teamMgr = truncateText(data.teamTechMgr || '', 30);
          const teamPOC = truncateText(data.teamPOC || '', 30);
          const capacity = truncateText(data.capacity || '', 30);

          content = `
            <div style="background: #012169; color: #fff; padding: ${padding}px; font-weight: normal; font-size: ${titleFont}px; text-align: center; border-top-left-radius: 10px; border-top-right-radius: 10px; line-height: 1.3; word-wrap: break-word; overflow-wrap: break-word;">
              ${wrappedName}
            </div>
            <div style="background: #fff; padding: ${padding}px; font-size: ${bodyFont}px; color: #000000; text-align: left; border-bottom-left-radius: 10px; border-bottom-right-radius: 10px; word-wrap: break-word; overflow-wrap: break-word;">
              Team ID<br><span style='color:#888; word-wrap: break-word; overflow-wrap: break-word;'>${teamId}</span><br>
              Team Type<br><span style='color:#888; word-wrap: break-word; overflow-wrap: break-word;'>${teamType}</span><br>
              Methodology<br><span style='color:#888; word-wrap: break-word; overflow-wrap: break-word;'>${methodology}</span><br>
              Team Manager<br><span style='color:#888; word-wrap: break-word; overflow-wrap: break-word;'>${teamMgr}</span><br>
              Team POC<br><span style='color:#888; word-wrap: break-word; overflow-wrap: break-word;'>${teamPOC}</span><br>
              Capacity<br><span style='color:#888; word-wrap: break-word; overflow-wrap: break-word;'>${capacity}</span>
            </div>
          `;
        }

        return `<div style="background: transparent; border-radius: 10px; width: ${width}px; max-width: ${width}px; min-width: ${width}px; overflow: hidden; box-shadow: none; word-wrap: break-word; overflow-wrap: break-word;">${content}</div>`;
      },
    };
  }

  /**
   * Check if node is non-interactive
   */
  isNonInteractiveNode(nodeName: string): boolean {
    return (
      this.NODE_TYPES.JUNCTION.includes(nodeName) ||
      this.NODE_TYPES.CONNECTOR.includes(nodeName)
    );
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
  private calculateFontSize(text: string, baseSize: number): number {
    if (text.length <= 10) return baseSize;
    if (text.length <= 15) return Math.max(baseSize * 0.9, 10);
    if (text.length <= 20) return Math.max(baseSize * 0.8, 9);
    return Math.max(baseSize * 0.7, 8);
  }

  // -------------- NODE LABEL CREATION --------------

  /**
   * Create label for main nodes (Portfolio, PDT)
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
    const textColor = title === 'Portfolio' ? '#000000' : '#FFFFFF';

    // For Portfolio node, always show count when provided
    if (title === 'Portfolio' && portfolioCount !== undefined) {
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
   * Create label for product nodes
   */
  createProductNodeLabel(productName: string, fonts: ChartFonts): any {
    // Apply text wrapping to long names
    let displayName = productName;
    if (productName.length > 12) {
      // Increased from 10 to accommodate bigger nodes
      displayName = this.formatLongText(productName, 12);
    }

    return {
      show: true,
      position: 'inside',
      formatter: displayName,
      fontSize: 14, // Set to reasonable 14px font size
      color: this.COLORS.TEXT.LIGHT,
      fontWeight: 'normal',
      fontFamily: 'Connections, Arial, sans-serif',
      align: 'center',
      verticalAlign: 'middle',
    };
  }

  /**
   * Create label for team nodes
   */
  createTeamNodeLabel(teamName: string, fonts: ChartFonts): any {
    // Truncate long names instead of wrapping to maintain consistent height
    // Increased character limit since nodes are wider now
    let displayName = teamName;
    const maxLength = 22; // Increased from 18 to accommodate wider nodes
    if (teamName.length > maxLength) {
      displayName = teamName.substring(0, maxLength - 3) + '...';
    }

    return {
      show: true,
      position: 'inside',
      formatter: displayName,
      fontSize: 15, // Set to reasonable 15px font size
      color: this.COLORS.TEXT.DARK,
      fontWeight: 'normal',
      fontFamily: 'Connections, Arial, sans-serif',
      align: 'center',
      verticalAlign: 'middle',
      lineHeight: 18, // Increased from 16 to accommodate taller nodes
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

  /**
   * Update node positions for responsive design
   */
  updateNodePositions(
    nodes: NodeData[],
    containerWidth: number,
    centerX: number,
    scale: number,
    fonts: ChartFonts,
    numProducts: number = 5,
    numTeams: number = 10
  ): void {
    const positions = this.calculateNodePositions(
      containerWidth,
      centerX,
      scale,
      fonts.mainNodeSize,
      numProducts,
      numTeams
    );

    nodes.forEach((node) => {
      switch (node.name) {
        case 'Portfolio':
          node.x = positions.portfolioX;
          node.y = positions.portfolioY;
          break;
        case 'PDT':
          node.x = positions.pdtX;
          node.y = positions.pdtY;
          break;
        case 'vertical-junction':
          node.x = positions.pdtX;
          node.y = positions.junctionY;
          break;
        case 'horizontal-junction':
          node.x = positions.productsCenterX;
          node.y = positions.horizontalConnectorsY;
          break;
        case 'team-junction':
          node.x = positions.teamJunctionX;
          node.y = positions.teamJunctionY;
          break;
        case 'team-vertical-junction':
          node.x = positions.teamJunctionX;
          node.y = positions.pdtY;
          break;
        default:
          if (node.name.startsWith('Product')) {
            const index = parseInt(node.name.replace('Product', '')) - 1;
            node.x =
              positions.productsStartX + index * positions.productsSpacing;
            node.y = positions.productsY;
          } else if (node.name.startsWith('Team')) {
            const index = parseInt(node.name.replace('Team', '')) - 1;
            node.x = positions.teamsStartX;
            node.y = positions.teamsY + index * positions.teamsSpacing;
          } else if (node.name.startsWith('v')) {
            const index = parseInt(node.name.replace('v', '')) - 1;
            node.x =
              positions.productsStartX + index * positions.productsSpacing;
            node.y = positions.horizontalConnectorsY;
          } else if (node.name.startsWith('t')) {
            const index = parseInt(node.name.replace('t', '')) - 1;
            node.x = positions.teamConnectorsX;
            node.y = positions.teamsY + index * positions.teamsSpacing;
          }
          break;
      }
    });
  }
}
