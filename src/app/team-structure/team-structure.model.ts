/**
 * Team structure node types
 */
export interface NodeTypes {
  MAIN: string[];
  JUNCTION: string[];
  CONTRIBUTOR: string[];
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
  CONTRIBUTOR: {
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
  symbolSize: number;
  itemStyle?: any;
  label?: any;
  fixed?: boolean;
  symbol?: string;
  count?: number;
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
    left: number;
    right: number;
    top: number;
    bottom: number;
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
