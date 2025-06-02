/**
 * PDT structure node types
 */
export interface NodeTypes {
  MAIN: string[];
  JUNCTION: string[];
  PRODUCT: string[];
  TEAM: string[];
  CONNECTOR: string[];
}

/**
 * Node colors
 */
export interface NodeColors {
  PORTFOLIO: string;
  PDT: string;
  TEAM: string;
  CONNECTIONS: string;
  PRODUCT: {
    bg: string;
    border: string;
  };
  TEXT: {
    LIGHT: string;
    DARK: string;
  };
}

/**
 * Chart font settings
 */
export interface ChartFonts {
  mainNodeSize: number;
  teamNodeSize: number;
  mainFont: number;
  mainTitleFont: number;
  memberFont: number;
  memberBoldFont: number;
}

/**
 * Node data and size information
 */
export interface NodeData {
  name: string;
  category: string;
  x: number;
  y: number;
  symbolSize: number | number[];
  itemStyle?: any;
  label?: any;
  fixed?: boolean;
  symbol?: string;
  count?: number;
  // Tooltip data properties
  portfolioName?: string;
  portfolioId?: string | number;
  portfolioTechMgr?: string;
  pdtName?: string;
  pdtId?: string | number;
  pdtTechMgr?: string;
  productName?: string;
  productId?: string | number;
  productOwner?: string;
  productType?: string;
  status?: string;
  teamName?: string;
  teamId?: string | number;
  type?: string;
  methodology?: string;
  teamTechMgr?: string;
  teamPOC?: string;
  capacity?: number;
}

/**
 * Link data between nodes
 */
export interface LinkData {
  source: string;
  target: string;
  lineStyle: {
    width: number;
    color: string;
    curveness?: number;
  };
}

/**
 * Chart options interface
 */
export interface ChartOptions {
  grid: {
    left: string;
    right: string;
    top: string;
    bottom: string;
    containLabel: boolean;
  };
  tooltip: any;
  series: Array<{
    type: string;
    layout: string;
    roam: boolean;
    zoom: number;
    center: string[];
    scaleLimit: {
      min: number;
      max: number;
    };
    label: any;
    edgeLabel: any;
    data: NodeData[];
    links: LinkData[];
    categories: Array<{ name: string }>;
  }>;
}

/**
 * PDT structure data interface
 */
export interface PDTStructureData {
  portfolioId?: string | number;
  portfolioName?: string;
  portfolioTechMgr?: string;
  pdtCount?: number;
  teamCount?: number;
  productCount?: number;
  pdt?: PDTData;
}

/**
 * PDT data interface
 */
export interface PDTData {
  pdtId?: string | number;
  pdtName?: string;
  pdtTechMgr?: string;
  teamCount?: number;
  productCount?: number;
  products?: ProductData[];
  teams?: TeamData[];
}

/**
 * Product data interface
 */
export interface ProductData {
  productId?: string | number;
  productName?: string;
  productOwner?: string;
  productType?: string;
  status?: string;
}

/**
 * Team data interface
 */
export interface TeamData {
  teamId?: string | number;
  teamName?: string;
  type?: string;
  methodology?: string;
  teamTechMgr?: string;
  teamPOC?: string;
  status?: string;
  capacity?: number;
}
