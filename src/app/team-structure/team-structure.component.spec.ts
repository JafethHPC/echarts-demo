import { ChangeDetectorRef, ElementRef, NgZone } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TeamStructureComponent } from './team-structure.component';
import { TeamStructureService } from './team-structure.service';
import { TeamStructureConfigService } from './team-structure-config.service';
import { AlignmentService, Alignment } from './alignment.service';
import * as echarts from 'echarts';
import {
  ChartFonts,
  NodeData,
  TeamStructureData,
} from './team-structure.model';
import {
  GridDataResult,
  DataStateChangeEvent,
  SelectableSettings,
  SelectionEvent,
} from '@progress/kendo-angular-grid';

// Mock data
const mockTeamStructureData: TeamStructureData = {
  portfolioId: '1',
  portfolioName: 'Test Portfolio',
  children: [
    {
      pdtid: '2',
      pdtname: 'Test PDT',
      children: [
        {
          teamId: '3',
          teamName: 'Test Team',
          children: [
            { name: 'AIT', count: 5 },
            { name: 'Team Backlog', count: 10 },
            { name: 'SPK', count: 3 },
            { name: 'Jira Board', count: 7 },
          ],
        },
      ],
    },
  ],
};

const mockAlignments: Alignment[] = [
  {
    alignToId: '1',
    alignToName: 'Alignment 1',
    jiraInstance: 'JIRA-1',
    techManagerName: 'Manager 1',
    alignFromId: '100',
    alignFromName: 'From 1',
    alignToActive: 1,
    alignmentActive: 1,
    alignmentId: 'a1',
    alignmentType: 'Portfolio',
    horizon: '',
    memberAlignment: '',
    projectUrl: '',
    techManagerNbk: '',
  },
  {
    alignToId: '2',
    alignToName: 'Alignment 2',
    jiraInstance: 'JIRA-2',
    techManagerName: 'Manager 2',
    alignFromId: '200',
    alignFromName: 'From 2',
    alignToActive: 1,
    alignmentActive: 1,
    alignmentId: 'a2',
    alignmentType: 'PDT',
    horizon: '',
    memberAlignment: '',
    projectUrl: '',
    techManagerNbk: '',
  },
];

const mockChartFonts: ChartFonts = {
  mainNodeSize: 70,
  teamNodeSize: 50,
  mainFont: 16,
  mainTitleFont: 12,
  memberFont: 14,
  memberBoldFont: 14,
};

// Mock services
class MockTeamStructureService {
  getTeamStructureData() {
    return mockTeamStructureData;
  }
}

class MockTeamStructureConfigService {
  NODE_TYPES = {
    MAIN: ['Portfolio', 'PDT'],
    CONTRIBUTOR: ['AIT', 'Team Backlog', 'SPK', 'Jira Board'],
    JUNCTION: ['vertical-junction', 'horizontal-line'],
    CONNECTOR: ['v1', 'v2', 'v3', 'v4'],
  };

  getResponsiveScale(width: number) {
    return width > 1000 ? 1 : 0.8;
  }

  getChartFonts(scale: number) {
    return {
      mainNodeSize: 70 * scale,
      teamNodeSize: 50 * scale,
      mainFont: 16 * scale,
      mainTitleFont: 12 * scale,
      memberFont: 14 * scale,
      memberBoldFont: 14 * scale,
    };
  }

  getZoomLevel(scale: number) {
    return scale > 0.9 ? 1 : 0.9;
  }

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
    formatNodeLabel: any,
    getNodeLabel: any,
    portfolioName: string,
    pdtName: string,
    teamName: string,
    teamStructureData: any
  ) {
    return {
      grid: { left: 0, right: 0, top: 0, bottom: 0, containLabel: true },
      tooltip: { show: true },
      series: [
        {
          type: 'graph',
          layout: 'none',
          roam: true,
          zoom: 1,
          center: ['50%', '50%'],
          scaleLimit: { min: 0.6, max: 1.5 },
          label: { show: true },
          edgeLabel: { show: false },
          data: [
            {
              name: 'Portfolio',
              category: 'main',
              x: 100,
              y: 100,
              symbolSize: mainNodeSize,
            },
            {
              name: 'PDT',
              category: 'main',
              x: 200,
              y: 100,
              symbolSize: mainNodeSize,
            },
            {
              name: 'Team',
              category: 'main',
              x: 300,
              y: 100,
              symbolSize: mainNodeSize,
            },
            {
              name: 'AIT',
              category: 'contributor',
              x: 250,
              y: 200,
              symbolSize: teamNodeSize,
            },
            {
              name: 'Team Backlog',
              category: 'contributor',
              x: 300,
              y: 200,
              symbolSize: teamNodeSize,
            },
            {
              name: 'SPK',
              category: 'contributor',
              x: 350,
              y: 200,
              symbolSize: teamNodeSize,
            },
            {
              name: 'Jira Board',
              category: 'contributor',
              x: 400,
              y: 200,
              symbolSize: teamNodeSize,
            },
            {
              name: 'vertical-junction',
              category: 'junction',
              x: 300,
              y: 150,
              symbolSize: 1,
            },
            {
              name: 'horizontal-line',
              category: 'junction',
              x: 325,
              y: 200,
              symbolSize: 1,
            },
          ],
          links: [
            { source: 'Portfolio', target: 'PDT' },
            { source: 'PDT', target: 'Team' },
            { source: 'Team', target: 'vertical-junction' },
            { source: 'vertical-junction', target: 'horizontal-line' },
            { source: 'horizontal-line', target: 'AIT' },
            { source: 'horizontal-line', target: 'Team Backlog' },
            { source: 'horizontal-line', target: 'SPK' },
            { source: 'horizontal-line', target: 'Jira Board' },
          ],
          categories: [
            {
              name: 'main',
              itemStyle: { color: '#FFD700' },
              label: { fontSize: mainFont, fontWeight: 'bold' },
            },
            {
              name: 'contributor',
              itemStyle: { color: '#87CEEB' },
              label: { fontSize: memberFont },
            },
            {
              name: 'junction',
              itemStyle: { color: 'transparent' },
              label: { show: false },
            },
          ],
        },
      ],
    };
  }
}

class MockAlignmentService {
  getAlignments(nodeName: string, teamStructureData: any) {
    return mockAlignments;
  }
}

class MockNgZone implements NgZone {
  hasPendingMacrotasks = false;
  hasPendingMicrotasks = false;
  isStable = true;
  onMicrotaskEmpty = { subscribe: () => ({ unsubscribe: () => {} }) } as any;
  onStable = { subscribe: () => ({ unsubscribe: () => {} }) } as any;
  onError = { subscribe: () => ({ unsubscribe: () => {} }) } as any;
  onUnstable = { subscribe: () => ({ unsubscribe: () => {} }) } as any;

  run<T>(fn: (...args: any[]) => T): T {
    return fn();
  }

  runGuarded<T>(fn: (...args: any[]) => T): T {
    return fn();
  }

  runOutsideAngular<T>(fn: (...args: any[]) => T): T {
    return fn();
  }

  runTask<T>(fn: (...args: any[]) => T): T {
    return fn();
  }
}

class MockChangeDetectorRef implements ChangeDetectorRef {
  markForCheck() {}
  detectChanges() {}
  detach() {}
  reattach() {}
  checkNoChanges() {}
}

// Mock echarts
jest.mock('echarts', () => {
  const mockChart = {
    resize: jest.fn(),
    getOption: jest.fn().mockReturnValue({
      series: [
        {
          data: [
            {
              name: 'Portfolio',
              category: 'main',
              x: 100,
              y: 100,
              symbolSize: 70,
            },
            { name: 'PDT', category: 'main', x: 200, y: 100, symbolSize: 70 },
            { name: 'Team', category: 'main', x: 300, y: 100, symbolSize: 70 },
            {
              name: 'AIT',
              category: 'contributor',
              x: 250,
              y: 200,
              symbolSize: 50,
            },
            {
              name: 'Team Backlog',
              category: 'contributor',
              x: 300,
              y: 200,
              symbolSize: 50,
            },
            {
              name: 'SPK',
              category: 'contributor',
              x: 350,
              y: 200,
              symbolSize: 50,
            },
            {
              name: 'Jira Board',
              category: 'contributor',
              x: 400,
              y: 200,
              symbolSize: 50,
            },
          ],
        },
      ],
    }),
    setOption: jest.fn(),
    dispose: jest.fn(),
    on: jest.fn((event, callback) => {
      // Store the click callback for testing
      if (event === 'click') {
        mockChart.clickCallback = callback;
      }
    }),
    clickCallback: null as any,
  };

  return {
    init: jest.fn().mockReturnValue(mockChart),
  };
});

describe('TeamStructureComponent', () => {
  let component: TeamStructureComponent;
  let teamStructureService: MockTeamStructureService;
  let configService: MockTeamStructureConfigService;
  let alignmentService: MockAlignmentService;
  let changeDetectorRef: MockChangeDetectorRef;
  let elementRef: ElementRef;
  let mockEchartsInstance: any;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    // Set up DOM
    const mockElement = document.createElement('div');
    mockElement.style.width = '1000px';
    mockElement.style.height = '500px';
    elementRef = { nativeElement: mockElement } as ElementRef;

    // Mock services
    teamStructureService = new MockTeamStructureService();
    configService = new MockTeamStructureConfigService();
    alignmentService = new MockAlignmentService();
    changeDetectorRef = new MockChangeDetectorRef();

    // Set up spies
    jest.spyOn(changeDetectorRef, 'markForCheck');

    // Create component instance directly
    component = new TeamStructureComponent(
      elementRef,
      changeDetectorRef,
      configService as any,
      teamStructureService as any,
      alignmentService as any
    );

    // Mock echarts
    mockEchartsInstance = (echarts as any).init();
    component['chart'] = mockEchartsInstance;

    // Mock document body for DOM operations
    document.body.innerHTML = '';
    const chartContainer = document.createElement('div');
    chartContainer.setAttribute('id', 'chart');
    chartContainer.style.width = '1000px';
    chartContainer.style.height = '600px';
    Object.defineProperty(chartContainer, 'offsetWidth', {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(chartContainer, 'offsetHeight', {
      value: 600,
      configurable: true,
    });
    document.body.appendChild(chartContainer);

    // Setup global mocks
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    document.body.innerHTML = '';
  });

  describe('Basic component functions', () => {
    it('should create component', () => {
      expect(component).toBeTruthy();
    });

    it('should have initial properties set correctly', () => {
      expect(component.selectedNode).toBeNull();
      expect(component.alignmentData).toEqual([]);
      expect(component.rowSelected).toBe(false);
    });

    it('should load team structure data', () => {
      component['loadTeamStructureData']();
      expect(component['teamStructureData']).toEqual(mockTeamStructureData);
    });

    it('should handle row selection', () => {
      const event = { selectedRows: [{ id: 1 }] };
      component.onRowSelect(event as any);
      expect(component.rowSelected).toBe(true);
    });

    it('should handle row deselection', () => {
      component.rowSelected = true;
      const event = { selectedRows: [] };
      component.onRowSelect(event as any);
      expect(component.rowSelected).toBe(false);
    });

    it('should handle data state change', () => {
      const state = { skip: 0, take: 10 };
      component.dataStateChange(state);
      expect(component.gridState.skip).toBe(0);
      expect(component.gridState.take).toBe(10);
    });

    it('should format long text correctly', () => {
      const longText =
        'This is a very long text that should be split into multiple lines';
      const result = component['formatLongText'](longText, 20);
      expect(result).toContain('\n');
    });

    it('should calculate font size based on text length', () => {
      const shortText = 'Test';
      const longText = 'This is a very long text';

      const shortSize = component['calculateFontSize'](shortText, 16);
      const longSize = component['calculateFontSize'](longText, 16);

      expect(longSize).toBeLessThan(shortSize);
    });

    it('should get node ID by type', () => {
      component['teamStructureData'] = mockTeamStructureData;
      const portfolioId = component['getNodeIdByType']('Portfolio');
      const pdtId = component['getNodeIdByType']('PDT');
      const teamId = component['getNodeIdByType']('Team');

      expect(portfolioId).toBe('1');
      expect(pdtId).toBe('2');
      expect(teamId).toBe('3');
    });

    it('should clean up on destroy', () => {
      jest.spyOn(component as any, 'disposeChart').mockImplementation(() => {});
      jest
        .spyOn(component as any, 'unsubscribeAll')
        .mockImplementation(() => {});

      component.ngOnDestroy();

      expect(component['disposeChart']).toHaveBeenCalled();
      expect(component['unsubscribeAll']).toHaveBeenCalled();
    });

    it('should initialize component after view init', () => {
      jest.spyOn(component as any, 'loadTeamStructureData');
      jest.spyOn(component as any, 'initChart');

      component.ngAfterViewInit();
      jest.runAllTimers();

      expect(component['loadTeamStructureData']).toHaveBeenCalled();
      expect(component['initChart']).toHaveBeenCalled();
    });
  });

  describe('Chart initialization and manipulation', () => {
    beforeEach(() => {
      component['teamStructureData'] = mockTeamStructureData;
    });

    it('should initialize chart correctly', () => {
      component['initChart']();

      expect(echarts.init).toHaveBeenCalled();
      expect(mockEchartsInstance.setOption).toHaveBeenCalled();
      expect(mockEchartsInstance.on).toHaveBeenCalledWith(
        'click',
        expect.any(Function)
      );
    });

    it('should not initialize chart when DOM element is missing', () => {
      document.body.innerHTML = '';
      jest.clearAllMocks(); // Clear previous calls
      component['initChart']();
      expect(echarts.init).not.toHaveBeenCalled();
    });

    it('should handle window resize', () => {
      jest.spyOn(component as any, 'updateNodePositions');
      component.onResize();
      expect(component['updateNodePositions']).toHaveBeenCalled();
    });

    it('should get current scale', () => {
      const scale = component.getCurrentScale();
      expect(typeof scale).toBe('number');
      expect(scale).toBeGreaterThan(0);
    });

    it('should handle chart click events', () => {
      component['setupChartClickHandler']();
      mockEchartsInstance.clickCallback({ data: { name: 'Portfolio' } });

      expect(component.selectedNode).toBe('Portfolio');
      expect(changeDetectorRef.markForCheck).toHaveBeenCalled();
    });

    it('should handle click on non-interactive nodes', () => {
      component['setupChartClickHandler']();
      mockEchartsInstance.clickCallback({
        data: { name: 'vertical-junction' },
      });

      expect(component.selectedNode).toBeNull();
    });

    it('should identify non-interactive nodes correctly', () => {
      expect(component['isNonInteractiveNode']('vertical-junction')).toBe(true);
      expect(component['isNonInteractiveNode']('horizontal-line')).toBe(true);
      expect(component['isNonInteractiveNode']('v1')).toBe(true);
      expect(component['isNonInteractiveNode']('Portfolio')).toBe(false);
    });

    it('should reset selected node', () => {
      component.selectedNode = 'Portfolio';
      component.resetSelectedNode();
      expect(component.selectedNode).toBeNull();
    });

    it('should dispose chart properly', () => {
      component['chart'] = mockEchartsInstance;
      component['disposeChart']();
      expect(mockEchartsInstance.dispose).toHaveBeenCalled();
      expect(component['chart']).toBeNull();
    });

    it('should handle chart disposal when chart is null', () => {
      component['chart'] = null;
      expect(() => component['disposeChart']()).not.toThrow();
    });
  });

  describe('Node positioning and sizing', () => {
    beforeEach(() => {
      component['teamStructureData'] = mockTeamStructureData;
    });

    it('should update node data counts', () => {
      component['updateNodeDataCounts']();
      expect(component.nodeDataCounts['AIT']).toBe(5);
      expect(component.nodeDataCounts['Team Backlog']).toBe(10);
      expect(component.nodeDataCounts['SPK']).toBe(3);
      expect(component.nodeDataCounts['Jira Board']).toBe(7);
    });

    it('should get nodes from chart option', () => {
      const mockOption = {
        series: [
          {
            data: [
              { name: 'Portfolio', category: 'main', x: 100, y: 100 },
              { name: 'PDT', category: 'main', x: 200, y: 100 },
            ],
          },
        ],
      };

      const nodes = component['getNodesFromOption'](mockOption);
      expect(nodes).toHaveLength(2);
      expect(nodes![0].name).toBe('Portfolio');
      expect(nodes![1].name).toBe('PDT');
    });

    it('should return null for invalid chart option', () => {
      const nodes = component['getNodesFromOption'](null);
      expect(nodes).toBeNull();
    });

    it('should position main nodes correctly', () => {
      const node: NodeData = {
        name: 'Portfolio',
        category: 'main',
        x: 0,
        y: 0,
        symbolSize: 70,
      };
      component['positionMainNode'](node, 100, 200, 300, 1, mockChartFonts);

      expect(node.x).toBe(100);
      expect(node.y).toBe(150); // Actual implementation uses 150 * scale
    });

    it('should position contributor nodes correctly', () => {
      const node: NodeData = {
        name: 'AIT',
        category: 'contributor',
        x: 0,
        y: 0,
        symbolSize: 50,
      };
      component['positionContributorNode'](node, 250, 100, 1, mockChartFonts);

      expect(node.x).toBe(250);
      expect(node.y).toBe(336); // Based on actual calculation: (270 + (380 - 270) * 0.6) * 1
    });

    it('should update node sizes correctly', () => {
      jest.spyOn(component as any, 'resetAllNodeSizes');
      const mockNodes = [
        { name: 'Portfolio', category: 'main', x: 100, y: 100, symbolSize: 70 },
        {
          name: 'AIT',
          category: 'contributor',
          x: 250,
          y: 200,
          symbolSize: 50,
        },
      ];
      mockEchartsInstance.getOption.mockReturnValue({
        series: [{ data: mockNodes }],
      });

      component['updateNodeSizes']('Portfolio', 90, 60);

      // The actual implementation multiplies by 1.15 for selected nodes
      expect(
        mockNodes.find((n) => n.name === 'Portfolio')?.symbolSize
      ).toBeCloseTo(103.5, 1); // 90 * 1.15
      expect(mockEchartsInstance.setOption).toHaveBeenCalled();
    });

    it('should reset all node sizes', () => {
      const nodes = [
        { name: 'Portfolio', category: 'main', x: 100, y: 100, symbolSize: 90 },
        {
          name: 'AIT',
          category: 'contributor',
          x: 250,
          y: 200,
          symbolSize: 60,
        },
      ];

      component['resetAllNodeSizes'](nodes, mockChartFonts);

      expect(nodes[0].symbolSize).toBe(70);
      expect(nodes[1].symbolSize).toBe(50);
    });
  });

  describe('Node labels and formatting', () => {
    beforeEach(() => {
      component['teamStructureData'] = mockTeamStructureData;
      component['updateNodeDataCounts']();
    });

    it('should get node label for main nodes', () => {
      const label = component['getNodeLabel']('Portfolio');
      expect(label).toBeDefined();
      expect(label.rich).toBeDefined();
    });

    it('should get node label for contributor nodes', () => {
      const label = component['getNodeLabel']('AIT');
      expect(label).toBeDefined();
      expect(label.rich).toBeDefined();
    });

    it('should create main node label correctly', () => {
      const label = component['createMainNodeLabel'](
        'Portfolio',
        'Test Portfolio',
        mockChartFonts
      );
      expect(label.formatter).toContain('{name|Portfolio}');
      expect(label.formatter).toContain('{title|Test Portfolio}');
    });

    it('should create contributor node label correctly', () => {
      const label = component['createContributorNodeLabel'](
        'AIT',
        mockChartFonts
      );
      expect(label.formatter).toContain('{name|AIT}');
      expect(label.formatter).toContain('{count|5}');
    });

    it('should format node label with light style', () => {
      const label = component['formatNodeLabel']('Test', 'Title', 16, true);
      expect(label.rich.name.color).toBe('#000000');
      expect(label.rich.title.color).toBe('#000000');
    });

    it('should format node label with dark style', () => {
      const label = component['formatNodeLabel']('Test', 'Title', 16, false);
      expect(label.rich.name.color).toBe('#FFFFFF');
      expect(label.rich.title.color).toBe('#FFFFFF');
    });

    it('should format long text by breaking lines', () => {
      const longText =
        'This is a very long text that should be broken into multiple lines';
      const result = component['formatLongText'](longText, 20);
      expect(result.split('\n').length).toBeGreaterThan(1);
    });

    it('should not break short text', () => {
      const shortText = 'Short text';
      const result = component['formatLongText'](shortText, 20);
      expect(result).toBe(shortText);
    });

    it('should calculate smaller font size for longer text', () => {
      const shortText = 'Short';
      const longText = 'This is a very long text with many characters';

      const shortSize = component['calculateFontSize'](shortText, 16);
      const longSize = component['calculateFontSize'](longText, 16);

      expect(longSize).toBeLessThan(shortSize);
      expect(longSize).toBeGreaterThanOrEqual(10);
    });

    it('should update node labels correctly', () => {
      mockEchartsInstance.getOption.mockReturnValue({
        series: [
          {
            data: [
              { name: 'Portfolio', category: 'main' },
              { name: 'AIT', category: 'contributor' },
            ],
          },
        ],
      });

      component['updateNodeLabels']();

      expect(mockEchartsInstance.setOption).toHaveBeenCalled();
    });
  });

  describe('Grid operations', () => {
    beforeEach(() => {
      component.alignmentData = mockAlignments;
    });

    it('should update grid state', () => {
      const state = { skip: 10, take: 5 };
      component.dataStateChange(state);
      expect(component.gridState.skip).toBe(10);
      expect(component.gridState.take).toBe(5);
    });

    it('should load grid data based on current state', () => {
      component['updateGridView']();
      expect(component.gridView.data.length).toBeLessThanOrEqual(
        component.gridState.take || 10
      );
      expect(component.gridView.total).toBe(mockAlignments.length);
    });

    it('should load alignment data for selected node', () => {
      jest
        .spyOn(alignmentService, 'getAlignments')
        .mockReturnValue(mockAlignments);
      jest.spyOn(component as any, 'updateGridView');
      component['teamStructureData'] = mockTeamStructureData; // Set the data first

      component['loadAlignmentData']('Portfolio', '1');

      expect(alignmentService.getAlignments).toHaveBeenCalledWith(
        'Portfolio',
        mockTeamStructureData
      );
      expect(component.alignmentData).toEqual(mockAlignments);
      expect(component['updateGridView']).toHaveBeenCalled();
    });

    it('should handle empty alignment data', () => {
      jest.spyOn(alignmentService, 'getAlignments').mockReturnValue([]);
      component['loadAlignmentData']('NonExistent', '99');
      expect(component.alignmentData).toEqual([]);
    });

    it('should handle pagination in grid view', () => {
      component.gridState.skip = 1;
      component.gridState.take = 1;
      component['updateGridView']();

      expect(component.gridView.data.length).toBe(1);
      expect(component.gridView.data[0]).toEqual(mockAlignments[1]);
    });
  });

  describe('Utility functions', () => {
    it('should format long text correctly', () => {
      const longText =
        'This is a very long text that should be split into multiple lines';
      const result = component['formatLongText'](longText, 20);
      expect(result).toContain('\n');
    });

    it('should not break short text', () => {
      const shortText = 'Short';
      const result = component['formatLongText'](shortText, 20);
      expect(result).toBe(shortText);
    });

    it('should calculate font size based on text length', () => {
      const shortText = 'Test';
      const longText = 'This is a very long text';

      const shortSize = component['calculateFontSize'](shortText, 16);
      const longSize = component['calculateFontSize'](longText, 16);

      expect(longSize).toBeLessThan(shortSize);
    });

    it('should get correct node ID by type', () => {
      component['teamStructureData'] = mockTeamStructureData;
      const portfolioId = component['getNodeIdByType']('Portfolio');
      const pdtId = component['getNodeIdByType']('PDT');
      const teamId = component['getNodeIdByType']('Team');

      expect(portfolioId).toBe('1');
      expect(pdtId).toBe('2');
      expect(teamId).toBe('3');
    });

    it('should return default for unknown node type', () => {
      component['teamStructureData'] = mockTeamStructureData;
      const unknownId = component['getNodeIdByType']('Unknown');
      expect(unknownId).toBe('0'); // Implementation returns '0' for unknown types
    });

    it('should handle null team structure data in getNodeIdByType', () => {
      component['teamStructureData'] = null;
      const result = component['getNodeIdByType']('Portfolio');
      expect(result).toBe('0'); // Implementation returns '0' when teamStructureData is null
    });
  });

  describe('Subscription management', () => {
    it('should unsubscribe from all subscriptions', () => {
      const mockSub1 = { unsubscribe: jest.fn() };
      const mockSub2 = { unsubscribe: jest.fn() };
      component['subscriptions'] = [mockSub1, mockSub2] as any;

      component['unsubscribeAll']();

      expect(mockSub1.unsubscribe).toHaveBeenCalled();
      expect(mockSub2.unsubscribe).toHaveBeenCalled();
      expect(component['subscriptions']).toEqual([]);
    });

    it('should handle empty subscriptions array', () => {
      component['subscriptions'] = [];
      expect(() => component['unsubscribeAll']()).not.toThrow();
    });
  });

  describe('Chart options and configuration', () => {
    beforeEach(() => {
      component['teamStructureData'] = mockTeamStructureData;
    });

    it('should create chart options correctly', () => {
      const options = component['createChartOptions'](
        1000,
        500,
        1,
        mockChartFonts
      );

      expect(options).toBeDefined();
      expect(options.series).toHaveLength(1);
      expect(options.series[0].type).toBe('graph');
    });

    it('should apply chart formatting', () => {
      jest.spyOn(component as any, 'updateNodeLabels');
      jest.spyOn(component, 'onResize');
      component['chart'] = mockEchartsInstance; // Need chart instance for applyChartFormatting

      // Mock the chart to have data for updateNodeLabels to process
      mockEchartsInstance.getOption.mockReturnValue({
        series: [
          {
            data: [
              { name: 'Portfolio', category: 'main' },
              { name: 'AIT', category: 'contributor' },
            ],
          },
        ],
      });

      component['applyChartFormatting']();

      // Fast-forward the timer
      jest.advanceTimersByTime(100);

      expect(mockEchartsInstance.resize).toHaveBeenCalled();
      expect(component.onResize).toHaveBeenCalled();
      expect(component['updateNodeLabels']).toHaveBeenCalled();
    });

    it('should get zoom level for small widths', () => {
      const zoom = component['getZoomForWidth'](500, 0.8);
      expect(zoom).toBe(0.8);
    });

    it('should get zoom level for large widths', () => {
      const zoom = component['getZoomForWidth'](1200, 1);
      expect(zoom).toBe(1);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle missing chart DOM element gracefully', () => {
      document.body.innerHTML = '';
      expect(() => component['initChart']()).not.toThrow();
    });

    it('should handle chart resize when chart is null', () => {
      component['chart'] = null;
      expect(() => component.onResize()).not.toThrow();
    });

    it('should handle node selection with null team structure data', () => {
      component['teamStructureData'] = null;
      expect(() => component['handleNodeSelection']('Portfolio')).not.toThrow();
    });

    it('should handle empty node data gracefully', () => {
      mockEchartsInstance.getOption.mockReturnValue({ series: [{ data: [] }] });
      expect(() => component['updateNodeLabels']()).not.toThrow();
    });

    it('should handle invalid chart options in getNodesFromOption', () => {
      const invalidOptions = { invalidStructure: true };
      const result = component['getNodesFromOption'](invalidOptions);
      expect(result).toBeNull();
    });
  });

  describe('Node interaction', () => {
    beforeEach(() => {
      component['teamStructureData'] = mockTeamStructureData;
    });

    it('should handle node selection for Portfolio', () => {
      jest.spyOn(component as any, 'loadAlignmentData');
      component['handleNodeSelection']('Portfolio');

      expect(component.selectedNode).toBe('Portfolio');
      expect(component['loadAlignmentData']).toHaveBeenCalledWith(
        'Portfolio',
        '1'
      );
    });

    it('should handle node selection for PDT', () => {
      jest.spyOn(component as any, 'loadAlignmentData');
      component['handleNodeSelection']('PDT');

      expect(component.selectedNode).toBe('PDT');
      expect(component['loadAlignmentData']).toHaveBeenCalledWith('PDT', '2');
    });

    it('should handle node selection for Team', () => {
      jest.spyOn(component as any, 'loadAlignmentData');
      component['handleNodeSelection']('Team');

      expect(component.selectedNode).toBe('Team');
      expect(component['loadAlignmentData']).toHaveBeenCalledWith('Team', '3');
    });

    it('should handle contributor node selection', () => {
      jest.spyOn(component as any, 'loadAlignmentData');
      component['handleNodeSelection']('AIT');

      expect(component.selectedNode).toBe('AIT');
      expect(component['loadAlignmentData']).toHaveBeenCalledWith('AIT', '0'); // Contributors use team ID which defaults to '0'
    });
  });

  describe('Additional coverage tests', () => {
    beforeEach(() => {
      component['teamStructureData'] = mockTeamStructureData;
    });

    it('should handle ngOnDestroy lifecycle', () => {
      jest.spyOn(component as any, 'disposeChart');
      jest.spyOn(component as any, 'unsubscribeAll');

      component.ngOnDestroy();

      expect(component['disposeChart']).toHaveBeenCalled();
      expect(component['unsubscribeAll']).toHaveBeenCalled();
    });

    it('should handle chart initialization with small container width', () => {
      const chartContainer = document.getElementById('chart');
      if (chartContainer) {
        Object.defineProperty(chartContainer, 'offsetWidth', {
          value: 500,
          configurable: true,
        });
      }

      component['initChart']();

      expect(echarts.init).toHaveBeenCalled();
      expect(mockEchartsInstance.setOption).toHaveBeenCalled();
    });

    it('should handle updateNodePositions with different node types', () => {
      const nodes: NodeData[] = [
        { name: 'Portfolio', category: 'main', x: 0, y: 0, symbolSize: 70 },
        { name: 'PDT', category: 'main', x: 0, y: 0, symbolSize: 70 },
        { name: 'Team', category: 'main', x: 0, y: 0, symbolSize: 70 },
        { name: 'AIT', category: 'contributor', x: 0, y: 0, symbolSize: 50 },
        {
          name: 'Team Backlog',
          category: 'contributor',
          x: 0,
          y: 0,
          symbolSize: 50,
        },
        { name: 'SPK', category: 'contributor', x: 0, y: 0, symbolSize: 50 },
        {
          name: 'Jira Board',
          category: 'contributor',
          x: 0,
          y: 0,
          symbolSize: 50,
        },
        {
          name: 'vertical-junction',
          category: 'junction',
          x: 0,
          y: 0,
          symbolSize: 1,
        },
        {
          name: 'horizontal-line',
          category: 'junction',
          x: 0,
          y: 0,
          symbolSize: 1,
        },
        { name: 'v1', category: 'connector', x: 0, y: 0, symbolSize: 1 },
      ];

      component['updateNodePositions'](nodes, 1000, 500, 1, mockChartFonts);

      // Verify main nodes are positioned
      expect(nodes.find((n) => n.name === 'Portfolio')?.x).toBeGreaterThan(0);
      expect(nodes.find((n) => n.name === 'PDT')?.x).toBeGreaterThan(0);
      expect(nodes.find((n) => n.name === 'Team')?.x).toBeGreaterThan(0);

      // Verify contributor nodes are positioned
      expect(nodes.find((n) => n.name === 'AIT')?.x).toBeGreaterThan(0);
      expect(nodes.find((n) => n.name === 'Team Backlog')?.x).toBeGreaterThan(
        0
      );
    });

    it('should handle positionNode with different node categories', () => {
      const mainNode: NodeData = {
        name: 'Portfolio',
        category: 'main',
        x: 0,
        y: 0,
        symbolSize: 70,
      };
      const contributorNode: NodeData = {
        name: 'AIT',
        category: 'contributor',
        x: 0,
        y: 0,
        symbolSize: 50,
      };
      const junctionNode: NodeData = {
        name: 'vertical-junction',
        category: 'junction',
        x: 0,
        y: 0,
        symbolSize: 1,
      };

      component['positionNode'](
        mainNode,
        100,
        200,
        300,
        250,
        100,
        1,
        mockChartFonts
      );
      component['positionNode'](
        contributorNode,
        100,
        200,
        300,
        250,
        100,
        1,
        mockChartFonts
      );
      component['positionNode'](
        junctionNode,
        100,
        200,
        300,
        250,
        100,
        1,
        mockChartFonts
      );

      expect(mainNode.x).toBeGreaterThan(0);
      expect(contributorNode.x).toBeGreaterThan(0);
      // Junction nodes don't get repositioned in positionNode
    });

    it('should handle formatLongText with exact maxLength', () => {
      const text = 'Exactly twenty chars';
      const result = component['formatLongText'](text, 20);
      expect(result).toBe(text);
    });

    it('should handle calculateFontSize with very long text', () => {
      const veryLongText =
        'This is an extremely long text that should result in a very small font size to ensure it fits properly within the node boundaries';
      const result = component['calculateFontSize'](veryLongText, 16);
      expect(result).toBe(13.6); // 16 * 0.85 for text > 15 chars
    });

    it('should handle calculateFontSize with empty text', () => {
      const result = component['calculateFontSize']('', 16);
      expect(result).toBe(16); // Should return base size for empty text
    });

    it('should handle getNodeIdByType with Team node', () => {
      const teamId = component['getNodeIdByType']('Team');
      expect(teamId).toBe('3');
    });

    it('should handle createChartOptions with different parameters', () => {
      const options = component['createChartOptions'](
        800,
        400,
        0.8,
        mockChartFonts
      );

      expect(options).toBeDefined();
      expect(options.series[0].type).toBe('graph');
      expect(options.series[0].layout).toBe('none');
      expect(options.series[0].roam).toBe(true);
    });

    it('should handle resetSelectedNode when node is already null', () => {
      component.selectedNode = null;
      component.resetSelectedNode();
      expect(component.selectedNode).toBeNull();
    });

    it('should handle resetSelectedNode with chart instance', () => {
      component.selectedNode = 'Portfolio';
      component['chart'] = mockEchartsInstance;

      mockEchartsInstance.getOption.mockReturnValue({
        series: [
          { data: [{ name: 'Portfolio', category: 'main', symbolSize: 80 }] },
        ],
      });

      component.resetSelectedNode();

      expect(component.selectedNode).toBeNull();
      expect(mockEchartsInstance.setOption).toHaveBeenCalled();
    });

    it('should handle updateNodeLabels with empty chart data', () => {
      component['chart'] = mockEchartsInstance;
      mockEchartsInstance.getOption.mockReturnValue({
        series: [{ data: [] }],
      });

      expect(() => component['updateNodeLabels']()).not.toThrow();
    });

    it('should handle loadAlignmentData with empty results', () => {
      jest.spyOn(alignmentService, 'getAlignments').mockReturnValue([]);
      jest.spyOn(component as any, 'updateGridView');

      component['loadAlignmentData']('NonExistent', '999');

      expect(component.alignmentData).toEqual([]);
      expect(component['updateGridView']).toHaveBeenCalled();
    });

    it('should handle dataStateChange with partial state', () => {
      const partialState = { skip: 5, take: 10 } as DataStateChangeEvent;
      component.dataStateChange(partialState);

      expect(component.gridState.skip).toBe(5);
      expect(component.gridState.take).toBe(10);
    });

    it('should handle onRowSelect with multiple selected rows', () => {
      const event = {
        selectedRows: [{ dataItem: { id: 1 } }, { dataItem: { id: 2 } }],
      };
      component.onRowSelect(event as any);
      expect(component.rowSelected).toBe(true);
    });

    it('should handle chart resize with null chart instance', () => {
      component['chart'] = null;
      expect(() => component.onResize()).not.toThrow();
    });

    it('should handle applyChartFormatting with setTimeout', () => {
      component['chart'] = mockEchartsInstance;
      jest.spyOn(component as any, 'updateNodeLabels');
      jest.spyOn(component, 'onResize');

      component['applyChartFormatting']();

      // Fast-forward the timer
      jest.advanceTimersByTime(100);

      expect(mockEchartsInstance.resize).toHaveBeenCalled();
      expect(component.onResize).toHaveBeenCalled();
      expect(component['updateNodeLabels']).toHaveBeenCalled();
    });

    it('should handle getZoomForWidth with different container sizes', () => {
      expect(component['getZoomForWidth'](500, 0.8)).toBe(0.8);
      expect(component['getZoomForWidth'](1200, 1.0)).toBe(1.0);
      expect(component['getZoomForWidth'](750, 0.8)).toBe(0.8); // <= 750 returns 0.8
    });

    it('should handle updateGridView with different skip/take values', () => {
      component.alignmentData = mockAlignments;
      component.gridState.skip = 0;
      component.gridState.take = 1;

      component['updateGridView']();

      expect(component.gridView.data.length).toBe(1);
      expect(component.gridView.total).toBe(2);
    });

    it('should handle updateGridView with skip beyond data length', () => {
      component.alignmentData = mockAlignments;
      component.gridState.skip = 10;
      component.gridState.take = 5;

      component['updateGridView']();

      expect(component.gridView.data.length).toBe(0);
      expect(component.gridView.total).toBe(2);
    });

    it('should handle createMainNodeLabel with long title', () => {
      const longTitle =
        'This is a very long portfolio title that should be formatted properly';
      const label = component['createMainNodeLabel'](
        'Portfolio',
        longTitle,
        mockChartFonts
      );

      expect(label.formatter).toContain('{name|Portfolio}');
      expect(label.formatter).toContain(longTitle);
    });

    it('should handle createContributorNodeLabel with zero count', () => {
      component.nodeDataCounts['AIT'] = 0;
      const label = component['createContributorNodeLabel'](
        'AIT',
        mockChartFonts
      );

      expect(label.formatter).toContain('{name|AIT}');
      expect(label.formatter).toContain('{plus|+}'); // When count is 0, it shows plus sign
    });

    it('should handle formatNodeLabel with different styles', () => {
      const lightLabel = component['formatNodeLabel'](
        'Test',
        'Title',
        16,
        true
      );
      const darkLabel = component['formatNodeLabel'](
        'Test',
        'Title',
        16,
        false
      );

      expect(lightLabel.rich.name.color).toBe('#000000');
      expect(darkLabel.rich.name.color).toBe('#FFFFFF');
    });
  });
});
