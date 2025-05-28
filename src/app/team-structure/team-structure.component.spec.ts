import { ChangeDetectorRef, ElementRef, NgZone } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { TeamStructureComponent } from './team-structure.component';
import { TeamStructureService } from './team-structure.service';
import { TeamStructureConfigService } from './team-structure-config.service';
import { AlignmentService, Alignment } from './alignment.service';
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

// ============================================================================
// MOCK DATA
// ============================================================================

const mockTeamStructureData: TeamStructureData[] = [
  {
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
  },
];

const mockAlignments: Alignment[] = [
  {
    alignToId: '1',
    alignToName: 'Test Alignment 1',
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
    alignToName: 'Test Alignment 2',
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

// ============================================================================
// MOCK SERVICES
// ============================================================================

class MockTeamStructureService {
  getTeamStructureData(): TeamStructureData[] {
    return mockTeamStructureData;
  }
}

class MockTeamStructureConfigService {
  NODE_TYPES = {
    MAIN: ['Portfolio', 'PDT', 'Team'],
    CONTRIBUTOR: ['AIT', 'Team Backlog', 'SPK', 'Jira Board'],
    JUNCTION: ['vertical-junction', 'horizontal-line'],
    CONNECTOR: ['v1', 'v2', 'v3', 'v4'],
  };

  getResponsiveScale(width: number): number {
    if (width > 1200) return 1.2;
    if (width > 800) return 1;
    return 0.8;
  }

  getChartFonts(scale: number, width: number): ChartFonts {
    return mockChartFonts;
  }

  getChartOptions(): any {
    return { series: [{ data: [] }] };
  }

  updateNodePositions(): void {}

  getNormalNodeSizes(): Record<string, number> {
    return {
      Portfolio: 70,
      PDT: 70,
      Team: 70,
      AIT: 50,
      'Team Backlog': 50,
      SPK: 50,
      'Jira Board': 50,
    };
  }

  getNodesFromOption(): NodeData[] | null {
    return [];
  }

  isNonInteractiveNode(nodeName: string): boolean {
    return (
      this.NODE_TYPES.JUNCTION.includes(nodeName) ||
      this.NODE_TYPES.CONNECTOR.includes(nodeName)
    );
  }

  getNodeIdByType(nodeName: string): string {
    switch (nodeName) {
      case 'Portfolio':
        return '1';
      case 'PDT':
        return '2';
      case 'Team':
        return '3';
      default:
        return '1';
    }
  }

  getNodeToAlignmentTypeMap(): Record<string, string> {
    return {
      Portfolio: 'PORTFOLIO',
      PDT: 'PDT',
      Team: 'TEAM',
    };
  }

  createMainNodeLabel(): any {
    return { show: true };
  }

  createContributorNodeLabel(): any {
    return { show: true };
  }

  formatNodeLabel(): any {
    return { show: true };
  }
}

class MockAlignmentService {
  getAlignment(): Alignment[] {
    return mockAlignments;
  }

  getPortfolioAlignments(): Alignment[] {
    return mockAlignments.filter((a) => a.alignmentType === 'Portfolio');
  }
}

// ============================================================================
// MOCK ANGULAR SERVICES
// ============================================================================

class MockChangeDetectorRef implements Partial<ChangeDetectorRef> {
  markForCheck(): void {}
  detectChanges(): void {}
  detach(): void {}
  reattach(): void {}
  checkNoChanges(): void {}
}

class MockElementRef implements Partial<ElementRef> {
  nativeElement = {
    querySelector: jest.fn().mockReturnValue({
      style: { height: '', minHeight: '', setProperty: jest.fn() },
      classList: {
        remove: jest.fn(),
        add: jest.fn(),
      },
      offsetWidth: 800,
    }),
  };
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe('TeamStructureComponent', () => {
  let component: TeamStructureComponent;
  let fixture: ComponentFixture<TeamStructureComponent>;
  let mockTeamStructureService: MockTeamStructureService;
  let mockConfigService: MockTeamStructureConfigService;
  let mockAlignmentService: MockAlignmentService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TeamStructureComponent],
      providers: [
        { provide: TeamStructureService, useClass: MockTeamStructureService },
        {
          provide: TeamStructureConfigService,
          useClass: MockTeamStructureConfigService,
        },
        { provide: AlignmentService, useClass: MockAlignmentService },
        { provide: ChangeDetectorRef, useClass: MockChangeDetectorRef },
        { provide: ElementRef, useClass: MockElementRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TeamStructureComponent);
    component = fixture.componentInstance;

    mockTeamStructureService = TestBed.inject(TeamStructureService) as any;
    mockConfigService = TestBed.inject(TeamStructureConfigService) as any;
    mockAlignmentService = TestBed.inject(AlignmentService) as any;

    // Mock chart to avoid canvas issues
    (component as any).chart = {
      setOption: jest.fn(),
      resize: jest.fn(),
      getDom: jest.fn().mockReturnValue({ offsetWidth: 800 }),
      on: jest.fn(),
      dispose: jest.fn(),
      getOption: jest.fn().mockReturnValue({ series: [{ data: [] }] }),
    };
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  // ============================================================================
  // BASIC COMPONENT TESTS
  // ============================================================================

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.selectedNode).toBeNull();
    expect(component.portfolioCount).toBe(0);
    expect(component.rowSelected).toBe(false);
    expect(component.alignmentData).toEqual([]);
    expect(component.gridView).toEqual({ data: [], total: 0 });
  });

  // ============================================================================
  // LAYOUT MANAGEMENT TESTS
  // ============================================================================

  it('should determine correct layout type based on width', () => {
    expect((component as any).getLayoutType(500)).toBe('vertical');
    expect((component as any).getLayoutType(700)).toBe('compact');
    expect((component as any).getLayoutType(900)).toBe('default');
  });

  it('should determine correct legend position based on width', () => {
    expect((component as any).getLegendPosition(500)).toBe('top-center');
    expect((component as any).getLegendPosition(700)).toBe('top-right');
  });

  // ============================================================================
  // NODE INTERACTION TESTS
  // ============================================================================

  it('should handle node selection correctly', () => {
    jest
      .spyOn(mockAlignmentService, 'getPortfolioAlignments')
      .mockReturnValue(mockAlignments);
    (component as any).teamStructureData = mockTeamStructureData;

    (component as any).handleNodeSelection('Portfolio');

    expect(component.selectedNode).toBe('Portfolio');
    expect(mockAlignmentService.getPortfolioAlignments).toHaveBeenCalled();
  });

  it('should reset selected node correctly', () => {
    component.selectedNode = 'Portfolio';
    component.alignmentData = mockAlignments;
    component.rowSelected = true;

    component.resetSelectedNode();

    expect(component.selectedNode).toBeNull();
    expect(component.alignmentData).toEqual([]);
    expect(component.rowSelected).toBe(false);
    expect(component.gridView).toEqual({ data: [], total: 0 });
  });

  it('should identify non-interactive nodes correctly', () => {
    expect((component as any).isNonInteractiveNode('vertical-junction')).toBe(
      true
    );
    expect((component as any).isNonInteractiveNode('v1')).toBe(true);
    expect((component as any).isNonInteractiveNode('Portfolio')).toBe(false);
  });

  // ============================================================================
  // GRID FUNCTIONALITY TESTS
  // ============================================================================

  it('should update grid view with paginated data', () => {
    component.alignmentData = mockAlignments;
    component.gridState = {
      skip: 0,
      take: 1,
      sort: [],
      filter: { logic: 'and', filters: [] },
    };

    (component as any).updateGridView();

    expect(component.gridView.data.length).toBe(1);
    expect(component.gridView.total).toBe(2);
  });

  it('should handle data state changes', () => {
    component.alignmentData = [...mockAlignments];
    const mockState: DataStateChangeEvent = {
      skip: 0,
      take: 10,
      sort: [{ field: 'alignToName', dir: 'asc' }],
      filter: { logic: 'and', filters: [] },
    };

    component.dataStateChange(mockState);

    expect(component.gridState).toEqual(mockState);
  });

  it('should handle row selection', () => {
    const mockEvent: SelectionEvent = {
      selectedRows: [{ dataItem: mockAlignments[0], index: 0 }],
      deselectedRows: [],
    };

    component.onRowSelect(mockEvent);

    expect(component.rowSelected).toBe(true);
  });

  // ============================================================================
  // UTILITY METHOD TESTS
  // ============================================================================

  it('should get current scale and width correctly', () => {
    const result = component.getCurrentScaleAndWidth();

    expect(result.width).toBe(800);
    expect(result.scale).toBe(0.8); // Based on mock config service logic
  });

  it('should get current scale correctly', () => {
    const scale = component.getCurrentScale();

    expect(scale).toBe(0.8); // Based on mock config service logic
  });

  it('should load team structure data', () => {
    jest
      .spyOn(mockTeamStructureService, 'getTeamStructureData')
      .mockReturnValue(mockTeamStructureData);

    (component as any).loadTeamStructureData();

    expect(mockTeamStructureService.getTeamStructureData).toHaveBeenCalled();
  });

  it('should update node data counts correctly', () => {
    (component as any).teamStructureData = mockTeamStructureData;
    (component as any).updateNodeDataCounts();

    expect(component.portfolioCount).toBe(1);
    expect(component.nodeDataCounts['AIT']).toBe(5);
    expect(component.nodeDataCounts['Team Backlog']).toBe(10);
    expect(component.nodeDataCounts['SPK']).toBe(3);
    expect(component.nodeDataCounts['Jira Board']).toBe(7);
  });

  it('should handle empty team structure data', () => {
    (component as any).teamStructureData = [];
    (component as any).updateNodeDataCounts();

    expect(component.portfolioCount).toBe(0);
    expect(component.nodeDataCounts['AIT']).toBe(0);
  });

  // ============================================================================
  // CLEANUP TESTS
  // ============================================================================

  it('should dispose chart on destroy', () => {
    const mockChart = (component as any).chart;

    component.ngOnDestroy();

    expect(mockChart.dispose).toHaveBeenCalled();
    expect((component as any).chart).toBeNull();
  });

  // ============================================================================
  // ALIGNMENT DATA LOADING TESTS
  // ============================================================================

  it('should load portfolio alignments correctly', () => {
    jest
      .spyOn(mockAlignmentService, 'getPortfolioAlignments')
      .mockReturnValue(mockAlignments);
    (component as any).teamStructureData = mockTeamStructureData;

    (component as any).loadAlignmentData('Portfolio', '1');

    expect(mockAlignmentService.getPortfolioAlignments).toHaveBeenCalled();
    expect(component.alignmentData).toEqual(mockAlignments);
  });

  it('should load other node alignments correctly', () => {
    jest
      .spyOn(mockAlignmentService, 'getAlignment')
      .mockReturnValue(mockAlignments);
    (component as any).teamStructureData = mockTeamStructureData;

    (component as any).loadAlignmentData('PDT', '2');

    expect(mockAlignmentService.getAlignment).toHaveBeenCalledWith('PDT', '3');
    expect(component.alignmentData).toEqual(mockAlignments);
  });

  it('should handle unknown node types', () => {
    (component as any).teamStructureData = mockTeamStructureData;

    (component as any).loadAlignmentData('Unknown', '999');

    expect(component.alignmentData).toEqual([]);
  });

  // ============================================================================
  // COVERAGE ENHANCEMENT TESTS
  // ============================================================================

  it('should handle grid view updates with empty data', () => {
    component.alignmentData = [];
    (component as any).updateGridView();

    expect(component.gridView).toEqual({ data: [], total: 0 });
  });

  it('should handle data state changes with sorting', () => {
    component.alignmentData = [...mockAlignments];
    const mockState: DataStateChangeEvent = {
      skip: 0,
      take: 10,
      sort: [{ field: 'alignToName', dir: 'desc' }],
      filter: { logic: 'and', filters: [] },
    };

    component.dataStateChange(mockState);

    expect(component.gridState).toEqual(mockState);
    expect(component.alignmentData[0].alignToName).toBe('Test Alignment 2');
  });

  it('should handle row deselection', () => {
    const mockEvent: SelectionEvent = {
      selectedRows: [],
      deselectedRows: [{ dataItem: mockAlignments[0], index: 0 }],
    };

    component.onRowSelect(mockEvent);

    expect(component.rowSelected).toBe(false);
  });

  // ============================================================================
  // ADDITIONAL COVERAGE TESTS
  // ============================================================================

  it('should handle chart initialization with valid DOM element', () => {
    const mockElement = {
      style: { width: '800px', height: '500px' },
      offsetWidth: 800,
    };

    // Mock document.getElementById to return a valid element
    const originalGetElementById = document.getElementById;
    document.getElementById = jest.fn().mockReturnValue(mockElement);

    // Mock the chart initialization without actually calling echarts.init
    jest.spyOn(component, 'setupChartClickHandler' as any);
    jest.spyOn(component, 'updateNodeLabels' as any);

    (component as any).teamStructureData = mockTeamStructureData;

    // Mock the chart object directly instead of trying to initialize it
    (component as any).chart = {
      setOption: jest.fn(),
      resize: jest.fn(),
      getDom: jest.fn().mockReturnValue(mockElement),
      on: jest.fn(),
      dispose: jest.fn(),
      getOption: jest.fn().mockReturnValue({ series: [{ data: [] }] }),
    };

    // Test the chart setup logic without actual initialization
    expect(() => {
      (component as any).setupChartClickHandler();
      (component as any).updateNodeLabels();
    }).not.toThrow();

    // Restore original function
    document.getElementById = originalGetElementById;
  });

  it('should handle resize when chart is null', () => {
    (component as any).chart = null;

    expect(() => {
      component.onResize();
    }).not.toThrow();
  });

  it('should handle resize when already resizing', () => {
    (component as any).isResizing = true;

    component.onResize();

    // Should exit early without doing anything
    expect((component as any).isResizing).toBe(true);
  });

  it('should handle chart click on non-interactive nodes', () => {
    const mockParams = {
      dataType: 'node',
      data: { name: 'vertical-junction' },
    };

    jest.spyOn(component, 'handleNodeSelection' as any);

    // Simulate chart click handler
    const clickHandler = jest.fn();
    (component as any).chart = {
      on: jest.fn((event, handler) => {
        if (event === 'click') {
          clickHandler.mockImplementation(handler);
        }
      }),
      setOption: jest.fn(),
      resize: jest.fn(),
      getDom: jest.fn().mockReturnValue({ offsetWidth: 800 }),
      dispose: jest.fn(),
      getOption: jest.fn().mockReturnValue({ series: [{ data: [] }] }),
    };

    (component as any).setupChartClickHandler();
    clickHandler(mockParams);

    expect((component as any).handleNodeSelection).not.toHaveBeenCalled();
  });

  it('should handle chart click on interactive nodes', () => {
    const mockParams = {
      dataType: 'node',
      data: { name: 'Portfolio' },
    };

    jest.spyOn(component, 'handleNodeSelection' as any);

    // Simulate chart click handler
    const clickHandler = jest.fn();
    (component as any).chart = {
      on: jest.fn((event, handler) => {
        if (event === 'click') {
          clickHandler.mockImplementation(handler);
        }
      }),
      setOption: jest.fn(),
      resize: jest.fn(),
      getDom: jest.fn().mockReturnValue({ offsetWidth: 800 }),
      dispose: jest.fn(),
      getOption: jest.fn().mockReturnValue({ series: [{ data: [] }] }),
    };

    (component as any).setupChartClickHandler();
    clickHandler(mockParams);

    expect((component as any).handleNodeSelection).toHaveBeenCalledWith(
      'Portfolio'
    );
  });

  it('should handle chart click on non-node elements', () => {
    const mockParams = {
      dataType: 'edge',
      data: { name: 'some-edge' },
    };

    jest.spyOn(component, 'handleNodeSelection' as any);

    // Simulate chart click handler
    const clickHandler = jest.fn();
    (component as any).chart = {
      on: jest.fn((event, handler) => {
        if (event === 'click') {
          clickHandler.mockImplementation(handler);
        }
      }),
      setOption: jest.fn(),
      resize: jest.fn(),
      getDom: jest.fn().mockReturnValue({ offsetWidth: 800 }),
      dispose: jest.fn(),
      getOption: jest.fn().mockReturnValue({ series: [{ data: [] }] }),
    };

    (component as any).setupChartClickHandler();
    clickHandler(mockParams);

    expect((component as any).handleNodeSelection).not.toHaveBeenCalled();
  });

  it('should update chart height and legend position correctly', () => {
    const mockContainer = {
      style: { height: '', minHeight: '' },
    };
    const mockLegend = {
      classList: { remove: jest.fn(), add: jest.fn() },
    };

    jest
      .spyOn(component['elementRef'].nativeElement, 'querySelector')
      .mockImplementation((selector) => {
        if (selector === '.chart-container') return mockContainer;
        if (selector === '.legend-container') return mockLegend;
        return null;
      });

    (component as any).updateChartHeight('vertical');
    expect(mockContainer.style.height).toBe('750px');

    (component as any).updateChartHeight('compact');
    expect(mockContainer.style.height).toBe('400px');

    (component as any).updateChartHeight('default');
    expect(mockContainer.style.height).toBe('500px');

    (component as any).updateLegendPosition('top-center');
    expect(mockLegend.classList.add).toHaveBeenCalledWith('legend-top-center');

    (component as any).updateLegendPosition('top-right');
    expect(mockLegend.classList.add).toHaveBeenCalledWith('legend-top-right');
  });

  it('should handle missing DOM elements gracefully', () => {
    jest
      .spyOn(component['elementRef'].nativeElement, 'querySelector')
      .mockReturnValue(null);

    expect(() => {
      (component as any).updateChartHeight('vertical');
      (component as any).updateLegendPosition('top-center');
    }).not.toThrow();
  });

  it('should check and update layout when layout type changes', () => {
    jest.spyOn(component, 'updateChartHeight' as any);
    jest.spyOn(component, 'checkAndUpdateLegendPosition' as any);

    (component as any).currentLayoutType = 'default';
    (component as any).checkAndUpdateLayout(500); // Should trigger vertical layout

    expect((component as any).updateChartHeight).toHaveBeenCalledWith(
      'vertical'
    );
    expect(
      (component as any).checkAndUpdateLegendPosition
    ).toHaveBeenCalledWith(500);
  });

  it('should check and update legend position when position changes', () => {
    jest.spyOn(component, 'updateLegendPosition' as any);

    (component as any).currentLegendPosition = 'top-right';
    (component as any).checkAndUpdateLegendPosition(500); // Should trigger top-center

    expect((component as any).updateLegendPosition).toHaveBeenCalledWith(
      'top-center'
    );
  });

  it('should handle node size updates for main nodes', () => {
    const mockNodes = [
      { name: 'Portfolio', symbolSize: 70 },
      { name: 'PDT', symbolSize: 70 },
      { name: 'Team', symbolSize: 70 },
    ];

    jest
      .spyOn(component, 'getNodesFromOption' as any)
      .mockReturnValue(mockNodes);

    (component as any).updateNodeSizes('Portfolio');

    expect(mockNodes[0].symbolSize).toBeCloseTo(80.5); // 70 * 1.15
    expect(mockNodes[1].symbolSize).toBe(70);
    expect(mockNodes[2].symbolSize).toBe(70);
  });

  it('should handle node size updates for contributor nodes', () => {
    const mockNodes = [
      { name: 'AIT', symbolSize: 50 },
      { name: 'Team Backlog', symbolSize: 50 },
    ];

    jest
      .spyOn(component, 'getNodesFromOption' as any)
      .mockReturnValue(mockNodes);

    (component as any).updateNodeSizes('AIT');

    expect(mockNodes[0].symbolSize).toBeCloseTo(57.5); // 50 * 1.15
    expect(mockNodes[1].symbolSize).toBe(50);
  });

  it('should handle node label updates', () => {
    const mockNodes = [
      { name: 'Portfolio', label: null },
      { name: 'AIT', label: null },
    ];

    jest
      .spyOn(component, 'getNodesFromOption' as any)
      .mockReturnValue(mockNodes);
    jest
      .spyOn(component, 'getNodeLabel' as any)
      .mockReturnValue({ show: true });

    (component as any).updateNodeLabels();

    expect((component as any).getNodeLabel).toHaveBeenCalledWith('Portfolio');
    expect((component as any).getNodeLabel).toHaveBeenCalledWith('AIT');
  });

  it('should get node labels for different node types', () => {
    (component as any).teamStructureData = mockTeamStructureData;

    const portfolioLabel = (component as any).getNodeLabel('Portfolio');
    const pdtLabel = (component as any).getNodeLabel('PDT');
    const teamLabel = (component as any).getNodeLabel('Team');
    const aitLabel = (component as any).getNodeLabel('AIT');
    const unknownLabel = (component as any).getNodeLabel('Unknown');

    expect(portfolioLabel).toEqual({ show: true });
    expect(pdtLabel).toEqual({ show: true });
    expect(teamLabel).toEqual({ show: true });
    expect(aitLabel).toEqual({ show: true });
    expect(unknownLabel).toBeNull();
  });

  it('should handle getNodeLabel with no team structure data', () => {
    (component as any).teamStructureData = null;

    const result = (component as any).getNodeLabel('Portfolio');

    expect(result).toBeNull();
  });

  it('should handle resetAllNodeSizes with different node types', () => {
    const mockNodes = [
      { name: 'Portfolio', symbolSize: 80, label: null },
      { name: 'AIT', symbolSize: 60, label: null },
      { name: 'vertical-junction', symbolSize: 10, label: null },
    ];

    jest
      .spyOn(component, 'getNodeLabel' as any)
      .mockReturnValue({ show: true });

    (component as any).resetAllNodeSizes(mockNodes, mockChartFonts);

    expect(mockNodes[0].symbolSize).toBe(70); // Reset to normal size
    expect(mockNodes[1].symbolSize).toBe(50); // Reset to normal size
    expect(mockNodes[2].symbolSize).toBe(10); // Unchanged for non-interactive nodes
  });

  it('should handle data state changes without sorting', () => {
    component.alignmentData = [...mockAlignments];
    const mockState: DataStateChangeEvent = {
      skip: 0,
      take: 10,
      sort: [],
      filter: { logic: 'and', filters: [] },
    };

    component.dataStateChange(mockState);

    expect(component.gridState).toEqual(mockState);
    // Data should remain in original order
    expect(component.alignmentData[0].alignToName).toBe('Test Alignment 1');
  });

  it('should handle grid pagination correctly', () => {
    component.alignmentData = mockAlignments;
    component.gridState = {
      skip: 1,
      take: 1,
      sort: [],
      filter: { logic: 'and', filters: [] },
    };

    (component as any).updateGridView();

    expect(component.gridView.data.length).toBe(1);
    expect(component.gridView.data[0]).toEqual(mockAlignments[1]);
    expect(component.gridView.total).toBe(2);
  });

  it('should handle createChartOptions with empty team structure data', () => {
    (component as any).teamStructureData = [];

    const result = (component as any).createChartOptions(
      800,
      400,
      1,
      mockChartFonts
    );

    expect(result).toEqual({});
  });

  it('should handle createChartOptions with null team structure data', () => {
    (component as any).teamStructureData = null;

    const result = (component as any).createChartOptions(
      800,
      400,
      1,
      mockChartFonts
    );

    expect(result).toEqual({});
  });

  it('should apply chart formatting correctly', () => {
    const mockDom = { style: { cursor: '' } };
    (component as any).chart = {
      getDom: jest.fn().mockReturnValue(mockDom),
      setOption: jest.fn(),
      resize: jest.fn(),
      on: jest.fn(),
      dispose: jest.fn(),
      getOption: jest.fn().mockReturnValue({ series: [{ data: [] }] }),
    };

    (component as any).applyChartFormatting();

    expect(mockDom.style.cursor).toBe('default');
  });

  it('should handle applyChartFormatting with null chart DOM', () => {
    (component as any).chart = {
      getDom: jest.fn().mockReturnValue(null),
      setOption: jest.fn(),
      resize: jest.fn(),
      on: jest.fn(),
      dispose: jest.fn(),
      getOption: jest.fn().mockReturnValue({ series: [{ data: [] }] }),
    };

    expect(() => {
      (component as any).applyChartFormatting();
    }).not.toThrow();
  });

  it('should handle getCurrentScaleAndWidth with null chart', () => {
    (component as any).chart = null;

    const result = component.getCurrentScaleAndWidth();

    expect(result.width).toBe(800); // Default width
    expect(result.scale).toBe(0.8); // Based on default width
  });

  it('should handle getNodesFromOption with null chart', () => {
    (component as any).chart = null;

    const result = (component as any).getNodesFromOption();

    expect(result).toBeNull();
  });

  it('should handle resetSelectedNode with null nodes', () => {
    jest.spyOn(component, 'getNodesFromOption' as any).mockReturnValue(null);

    expect(() => {
      component.resetSelectedNode();
    }).not.toThrow();

    expect(component.selectedNode).toBeNull();
    expect(component.alignmentData).toEqual([]);
  });

  it('should handle resize with chart and proper timing', fakeAsync(() => {
    const mockChart = {
      setOption: jest.fn(),
      resize: jest.fn(),
      getDom: jest.fn().mockReturnValue({ offsetWidth: 800 }),
      on: jest.fn(),
      dispose: jest.fn(),
      getOption: jest.fn().mockReturnValue({ series: [{ data: [] }] }),
    };

    (component as any).chart = mockChart;
    (component as any).isResizing = false;
    (component as any).selectedNode = 'Portfolio';

    jest.spyOn(component, 'checkAndUpdateLayout' as any);

    component.onResize();

    expect((component as any).isResizing).toBe(true);

    tick(150);

    expect((component as any).checkAndUpdateLayout).toHaveBeenCalled();
    expect((component as any).isResizing).toBe(false);
  }));

  it('should handle layout changes that do not trigger updates', () => {
    jest.spyOn(component, 'updateChartHeight' as any);
    jest.spyOn(component, 'checkAndUpdateLegendPosition' as any);

    (component as any).currentLayoutType = 'vertical';
    (component as any).checkAndUpdateLayout(500); // Same layout type

    expect((component as any).updateChartHeight).not.toHaveBeenCalled();
    expect(
      (component as any).checkAndUpdateLegendPosition
    ).toHaveBeenCalledWith(500);
  });

  it('should handle legend position changes that do not trigger updates', () => {
    jest.spyOn(component, 'updateLegendPosition' as any);

    (component as any).currentLegendPosition = 'top-center';
    (component as any).checkAndUpdateLegendPosition(500); // Same position

    expect((component as any).updateLegendPosition).not.toHaveBeenCalled();
  });

  it('should handle updateNodeSizes with null nodes', () => {
    jest.spyOn(component, 'getNodesFromOption' as any).mockReturnValue(null);

    expect(() => {
      (component as any).updateNodeSizes('Portfolio');
    }).not.toThrow();
  });

  it('should handle updateNodeLabels with null nodes', () => {
    jest.spyOn(component, 'getNodesFromOption' as any).mockReturnValue(null);

    expect(() => {
      (component as any).updateNodeLabels();
    }).not.toThrow();
  });

  it('should handle chart resize with timeout', fakeAsync(() => {
    const mockChart = {
      setOption: jest.fn(),
      resize: jest.fn(),
      getDom: jest.fn().mockReturnValue({ offsetWidth: 800 }),
      on: jest.fn(),
      dispose: jest.fn(),
      getOption: jest.fn().mockReturnValue({ series: [{ data: [] }] }),
    };

    (component as any).chart = mockChart;
    (component as any).currentLayoutType = 'default';

    (component as any).checkAndUpdateLayout(500); // Should trigger layout change

    tick(50);

    expect(mockChart.resize).toHaveBeenCalled();
  }));

  it('should handle getNodeIdByType for different node types', () => {
    expect((component as any).getNodeIdByType('Portfolio')).toBe('1');
    expect((component as any).getNodeIdByType('PDT')).toBe('2');
    expect((component as any).getNodeIdByType('Team')).toBe('3');
    expect((component as any).getNodeIdByType('Unknown')).toBe('1');
  });

  it('should handle loadAlignmentData with Portfolio type', () => {
    jest
      .spyOn(mockAlignmentService, 'getPortfolioAlignments')
      .mockReturnValue(mockAlignments);
    (component as any).teamStructureData = mockTeamStructureData;

    (component as any).loadAlignmentData('Portfolio', '1');

    expect(mockAlignmentService.getPortfolioAlignments).toHaveBeenCalledWith(
      '3'
    );
    expect(component.alignmentData).toEqual(mockAlignments);
  });

  it('should handle loadAlignmentData with no team structure data', () => {
    (component as any).teamStructureData = null;

    (component as any).loadAlignmentData('Portfolio', '1');

    expect(component.alignmentData).toEqual([]);
  });

  it('should handle createChartOptions with valid team structure data', () => {
    (component as any).teamStructureData = mockTeamStructureData;

    const result = (component as any).createChartOptions(
      800,
      400,
      1,
      mockChartFonts
    );

    expect(result).toBeDefined();
    expect(result.series).toBeDefined();
  });

  it('should call loadTeamStructureData on ngAfterViewInit', fakeAsync(() => {
    jest
      .spyOn(component, 'loadTeamStructureData' as any)
      .mockImplementation(() => {});

    component.ngAfterViewInit();

    // Wait for the setTimeout to execute
    tick(0);

    expect((component as any).loadTeamStructureData).toHaveBeenCalled();
  }));
});
