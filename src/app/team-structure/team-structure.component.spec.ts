// Mock echarts before any other imports
jest.mock('echarts', () => ({
  init: jest.fn().mockReturnValue({
    setOption: jest.fn(),
    resize: jest.fn(),
    getOption: jest.fn().mockReturnValue({
      series: [{ data: [] }],
    }),
    on: jest.fn(),
    off: jest.fn(),
    dispose: jest.fn(),
  }),
}));

import { TeamStructureComponent } from './team-structure.component';
import { NodeData } from './team-structure.model';

// Mock dependencies directly
jest.mock('./team-structure.service');
jest.mock('./team-structure-config.service');

describe('TeamStructureComponent', () => {
  let component: TeamStructureComponent;
  let mockChart: any;

  // Simple mock implementation
  const mockElement = document.createElement('div');
  const mockChangeDetector = { markForCheck: jest.fn() };
  const mockNgZone = {
    run: jest.fn((fn: Function) => fn()),
    runOutsideAngular: jest.fn((fn: Function) => fn()),
  };

  const mockTeamStructureService = {
    getTeamStructureData: jest.fn().mockReturnValue({
      PortfolioId: 'P001',
      PortfolioName: 'Test Portfolio',
      PortfolioManager: 'Test Manager',
      TrainId: 'T001',
      TrainName: 'Test Train',
      PDTManager: 'Test PDT',
      TeamId: 'TEAM01',
      TeamName: 'Test Team',
      TeamType: 'Feature',
      Methodology: 'Agile',
      TeamManager: 'Test Team Manager',
      AITCount: 1,
      SPKCount: 2,
      TPKCount: 3,
      JiraBoardCount: 4,
    }),
  };

  const mockConfigService = {
    NODE_TYPES: {
      MAIN: ['Portfolio', 'PDT', 'TEAMS'],
      JUNCTION: ['vertical-junction', 'horizontal-line'],
      CONTRIBUTOR: ['AIT', 'SPK', 'TPK', 'Jira Board'],
      CONNECTOR: ['v1', 'v2', 'v3', 'v4'],
    },
    getResponsiveScale: jest.fn().mockReturnValue(1),
    getChartFonts: jest.fn().mockReturnValue({
      mainNodeSize: 210,
      teamNodeSize: 100,
      mainFont: 22.8,
      mainTitleFont: 18,
      memberFont: 14,
      memberBoldFont: 16,
    }),
    getZoomLevel: jest.fn().mockReturnValue(0.75),
    getChartOptions: jest.fn().mockReturnValue({
      grid: {},
      tooltip: {},
      series: [
        {
          type: 'graph',
          data: [],
          links: [],
        },
      ],
    }),
  };

  beforeEach(() => {
    // Mock document getElementById
    jest.spyOn(document, 'getElementById').mockReturnValue({
      offsetWidth: 1000,
    } as unknown as HTMLElement);

    // Create a new instance for each test
    component = new TeamStructureComponent(
      { nativeElement: mockElement } as any,
      mockChangeDetector as any,
      mockNgZone as any,
      mockConfigService as any,
      mockTeamStructureService as any
    );

    // Mock chart instance for tests
    mockChart = {
      setOption: jest.fn(),
      resize: jest.fn(),
      getOption: jest.fn().mockReturnValue({
        series: [
          {
            data: [
              { name: 'Portfolio', symbolSize: 100 },
              { name: 'PDT', symbolSize: 100 },
              { name: 'TEAMS', symbolSize: 100 },
            ],
          },
        ],
      }),
      on: jest.fn(),
      off: jest.fn(),
      dispose: jest.fn(),
    };

    // Apply mockChart to component
    Object.defineProperty(component, 'chart', {
      value: mockChart,
      writable: true,
    });

    // Reset mocks between tests
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should reset selectedNode when resetSelectedNode is called', () => {
    // Setup
    component.selectedNode = 'Portfolio';

    // Act
    component.resetSelectedNode();

    // Assert
    expect(component.selectedNode).toBeNull();
  });

  it('should clean up resources on ngOnDestroy', () => {
    // Call destroy
    component.ngOnDestroy();

    // Verify chart is properly disposed
    expect(mockChart.dispose).toHaveBeenCalled();
    expect(component['chart']).toBeNull();
  });

  it('should resize chart when window is resized', () => {
    // Call resize handler
    component.onResize();

    // Verify chart is resized
    expect(mockChart.resize).toHaveBeenCalled();
    expect(mockChart.setOption).toHaveBeenCalled();
  });

  it('should initialize node data counts from team structure', () => {
    // Set up sample data
    Object.defineProperty(component, 'teamStructureData', {
      value: {
        AITCount: 3,
        SPKCount: 4,
        TPKCount: 5,
        JiraBoardCount: 6,
      },
      writable: true,
    });

    // Call the method
    component['updateNodeDataCounts']();

    // Verify counts are correctly set
    expect(component.nodeDataCounts['AIT']).toBe(3);
    expect(component.nodeDataCounts['SPK']).toBe(4);
    expect(component.nodeDataCounts['TPK']).toBe(5);
    expect(component.nodeDataCounts['Jira Board']).toBe(6);
  });

  it('should update node sizes when a node is selected', () => {
    // Call method to update node sizes
    component['updateNodeSizes']('Portfolio', 220, 100);

    // Verify chart option was updated
    expect(mockChart.setOption).toHaveBeenCalled();
  });

  // Test the formatNodeLabel method
  it('should format node labels correctly', () => {
    const result = component['formatNodeLabel'](
      'Test Name',
      'Test Title',
      20,
      true
    );

    expect(result.formatter).toContain('Test Name');
    expect(result.formatter).toContain('Test Title');
    expect(result.rich.name.fontSize).toBeDefined();
    expect(result.rich.title.fontSize).toBeDefined();
  });

  it('should handle long text in formatNodeLabel by adding line breaks', () => {
    const longName = 'This is a very long name that should get broken';
    const result = component['formatNodeLabel'](longName, 'Test', 20, true);

    expect(result.formatter).toContain('\n');
  });

  it('should setup chart click handler', () => {
    // Call method
    component['setupChartClickHandler']();

    // Verify event handlers are set up
    expect(mockChart.on).toHaveBeenCalledWith('click', expect.any(Function));
  });

  // Additional tests

  it('should initialize chart in ngAfterViewInit', () => {
    // Setup
    const initChartSpy = jest.spyOn(component as any, 'initChart');
    jest.useFakeTimers();

    // Act
    component.ngAfterViewInit();
    jest.runAllTimers();

    // Assert
    expect(mockTeamStructureService.getTeamStructureData).toHaveBeenCalled();
    expect(initChartSpy).toHaveBeenCalled();
  });

  it('should extract nodes from option', () => {
    // Setup
    const mockOption = {
      series: [
        {
          data: [
            { name: 'Portfolio', symbolSize: 100 },
            { name: 'PDT', symbolSize: 100 },
          ],
        },
      ],
    };

    // Act
    const result = component['getNodesFromOption'](mockOption);

    // Assert
    expect(result).toEqual([
      { name: 'Portfolio', symbolSize: 100 },
      { name: 'PDT', symbolSize: 100 },
    ]);
  });

  it('should return null if series data is not available in getNodesFromOption', () => {
    // Setup
    const mockOption = { series: [] };

    // Act
    const result = component['getNodesFromOption'](mockOption);

    // Assert
    expect(result).toBeNull();
  });

  it('should update node positions correctly', () => {
    // Setup
    const nodes: NodeData[] = [
      { name: 'Portfolio', x: 0, y: 0, symbolSize: 100, category: 'main' },
      { name: 'PDT', x: 0, y: 0, symbolSize: 100, category: 'main' },
      { name: 'TEAMS', x: 0, y: 0, symbolSize: 100, category: 'main' },
      {
        name: 'vertical-junction',
        x: 0,
        y: 0,
        symbolSize: 10,
        category: 'junction',
      },
      { name: 'AIT', x: 0, y: 0, symbolSize: 50, category: 'contributor' },
      { name: 'v1', x: 0, y: 0, symbolSize: 10, category: 'connector' },
    ];
    const containerWidth = 1000;
    const centerX = 500;
    const scale = 1;
    const fonts = {
      mainNodeSize: 210,
      teamNodeSize: 100,
      mainFont: 22.8,
      mainTitleFont: 18,
      memberFont: 14,
      memberBoldFont: 16,
    };

    // Act
    component['updateNodePositions'](
      nodes,
      containerWidth,
      centerX,
      scale,
      fonts
    );

    // Assert
    // Check positions were updated
    expect(nodes[0].x).not.toBe(0); // Portfolio should be positioned
    expect(nodes[1].x).toBe(centerX); // PDT should be at center
    expect(nodes[2].x).not.toBe(0); // TEAMS should be positioned

    // Check symbolSizes were updated
    expect(nodes[0].symbolSize).toBe(fonts.mainNodeSize);
    expect(nodes[4].symbolSize).toBe(fonts.teamNodeSize);
  });

  it('should initialize the chart', () => {
    // Setup
    const echarts = require('echarts');

    // Act
    component['initChart']();

    // Assert
    expect(echarts.init).toHaveBeenCalled();
    expect(mockConfigService.getChartOptions).toHaveBeenCalled();
  });

  it('should update node labels', () => {
    // Act
    component['updateNodeLabels']();

    // Assert
    expect(mockChart.setOption).toHaveBeenCalled();
  });

  it('should generate correct node labels for Portfolio', () => {
    // Setup
    Object.defineProperty(component, 'teamStructureData', {
      value: {
        PortfolioName: 'Test Portfolio',
      },
      writable: true,
    });

    // Act
    const result = component['getNodeLabel']('Portfolio');

    // Assert
    expect(result).toBeDefined();
    expect(result.formatter).toContain('Test Portfolio');
    expect(result.formatter).toContain('Portfolio');
  });

  it('should generate correct node labels for PDT', () => {
    // Setup
    Object.defineProperty(component, 'teamStructureData', {
      value: {
        TrainName: 'Test Train',
      },
      writable: true,
    });

    // Act
    const result = component['getNodeLabel']('PDT');

    // Assert
    expect(result).toBeDefined();
    expect(result.formatter).toContain('Test Train');
    expect(result.formatter).toContain('PDT');
  });

  it('should generate correct node labels for TEAMS', () => {
    // Setup
    Object.defineProperty(component, 'teamStructureData', {
      value: {
        TeamName: 'Test Team',
      },
      writable: true,
    });

    // Act
    const result = component['getNodeLabel']('TEAMS');

    // Assert
    expect(result).toBeDefined();
    expect(result.formatter).toContain('Test Team');
    expect(result.formatter).toContain('Team');
  });

  it('should show "+" for contributor nodes with zero count', () => {
    // Setup
    component.nodeDataCounts = { AIT: 0, SPK: 0, TPK: 0, 'Jira Board': 0 };

    // Act
    const result = component['getNodeLabel']('AIT');

    // Assert
    expect(result.formatter).toContain('+');
  });

  it('should show count for contributor nodes with non-zero count', () => {
    // Setup
    component.nodeDataCounts = { AIT: 5, SPK: 0, TPK: 0, 'Jira Board': 0 };

    // Act
    const result = component['getNodeLabel']('AIT');

    // Assert
    expect(result.formatter).toContain('5');
  });

  it('should return null for non-recognized node types in getNodeLabel', () => {
    // Act
    const result = component['getNodeLabel']('Unknown');

    // Assert
    expect(result).toBeNull();
  });

  it('should handle click on non-node elements', () => {
    // Setup - First call setupChartClickHandler to register the click handler
    component['setupChartClickHandler']();

    // Now we can get the click handler
    const clickHandler = mockChart.on.mock.calls[0][1];

    // Call the handler with a non-node param
    clickHandler({ dataType: 'edge' });

    // Should not change selectedNode
    expect(component.selectedNode).toBeNull();
  });

  it('should handle click on junction nodes', () => {
    // Setup - First call setupChartClickHandler to register the click handler
    component['setupChartClickHandler']();

    // Now we can get the click handler
    const clickHandler = mockChart.on.mock.calls[0][1];

    // Call the handler with a junction node
    clickHandler({ dataType: 'node', name: 'vertical-junction' });

    // Should not change selectedNode
    expect(component.selectedNode).toBeNull();
  });

  it('should toggle selection when clicking the same node twice', () => {
    // Setup
    component.selectedNode = 'Portfolio';

    // First call setupChartClickHandler to register the click handler
    component['setupChartClickHandler']();

    // Now we can get the click handler
    const clickHandler = mockChart.on.mock.calls[0][1];

    // Call the handler with the same node
    clickHandler({ dataType: 'node', name: 'Portfolio' });

    // Should reset selectedNode
    expect(component.selectedNode).toBeNull();
  });

  it('should select a new node when clicked', () => {
    // Setup - First call setupChartClickHandler to register the click handler
    component['setupChartClickHandler']();

    // Now we can get the click handler
    const clickHandler = mockChart.on.mock.calls[0][1];

    // Call the handler with a valid node
    clickHandler({ dataType: 'node', name: 'Portfolio' });

    // Should update selectedNode
    expect(component.selectedNode).toBe('Portfolio');
  });

  it('should handle null chart during onResize', () => {
    // Setup - set chart to null
    Object.defineProperty(component, 'chart', {
      value: null,
      writable: true,
    });

    // Act - should not throw error
    component.onResize();

    // No assertion needed - test passes if no error is thrown
  });

  it('should handle missing chart container during onResize', () => {
    // Mock document.getElementById to return null
    jest.spyOn(document, 'getElementById').mockReturnValue(null);

    // Act - should not throw error
    component.onResize();

    // No assertion needed - test passes if no error is thrown
  });

  it('should handle small container width during onResize', () => {
    // Mock document.getElementById to return small width
    jest.spyOn(document, 'getElementById').mockReturnValue({
      offsetWidth: 700,
    } as unknown as HTMLElement);

    // Act
    component.onResize();

    // Verify zoom is updated for small screens
    expect(mockChart.setOption).toHaveBeenCalledWith(
      expect.objectContaining({
        series: expect.arrayContaining([
          expect.objectContaining({
            zoom: 0.8,
          }),
        ]),
      })
    );
  });

  it('should handle getNodesFromOption with empty options', () => {
    // Act
    const result = component['getNodesFromOption'](null);

    // Assert
    expect(result).toBeNull();
  });

  it('should handle getNodesFromOption with empty series', () => {
    // Act
    const result = component['getNodesFromOption']({ series: null });

    // Assert
    expect(result).toBeNull();
  });

  it('should handle missing chart container during initChart', () => {
    // Mock document.getElementById to return null
    jest.spyOn(document, 'getElementById').mockReturnValue(null);

    // Should not throw
    component['initChart']();

    // No assertion needed - test passes if no error is thrown
  });

  it('should handle null chart during setupChartClickHandler', () => {
    // Setup - set chart to null
    Object.defineProperty(component, 'chart', {
      value: null,
      writable: true,
    });

    // Act - should not throw error
    component['setupChartClickHandler']();

    // No assertion needed - test passes if no error is thrown
  });

  it('should handle null chart during updateNodeLabels', () => {
    // Setup - set chart to null
    Object.defineProperty(component, 'chart', {
      value: null,
      writable: true,
    });

    // Act - should not throw error
    component['updateNodeLabels']();

    // No assertion needed - test passes if no error is thrown
  });

  it('should handle missing teamStructureData in updateNodeDataCounts', () => {
    // Setup
    Object.defineProperty(component, 'teamStructureData', {
      value: null,
      writable: true,
    });

    // Act - should not throw error
    component['updateNodeDataCounts']();

    // No assertion needed - test passes if no error is thrown
  });

  it('should handle null chart during resetSelectedNode', () => {
    // Setup - set chart to null
    Object.defineProperty(component, 'chart', {
      value: null,
      writable: true,
    });

    // Act - should not throw error
    component.resetSelectedNode();

    // Still updates the selectedNode
    expect(component.selectedNode).toBeNull();
  });

  it('should handle null chart during updateNodeSizes', () => {
    // Setup - set chart to null
    Object.defineProperty(component, 'chart', {
      value: null,
      writable: true,
    });

    // Act - should not throw error
    component['updateNodeSizes']('Portfolio', 100, 50);

    // No assertion needed - test passes if no error is thrown
  });

  it('should cover remaining edge cases in getNodesFromOption', () => {
    // Test with series object but no data array
    const mockOption = {
      series: [
        { type: 'graph' }, // No data property
      ],
    };

    const result = component['getNodesFromOption'](mockOption);
    expect(result).toBeNull();
  });

  it('should handle labels with undefined rich property when updating node positions', () => {
    // Setup node with undefined rich property in label
    const nodes: NodeData[] = [
      {
        name: 'Portfolio',
        x: 0,
        y: 0,
        symbolSize: 100,
        category: 'main',
        label: {}, // Missing rich property
      },
      {
        name: 'PDT',
        x: 0,
        y: 0,
        symbolSize: 100,
        category: 'main',
        label: { rich: null }, // Null rich property
      },
      {
        name: 'TEAMS',
        x: 0,
        y: 0,
        symbolSize: 100,
        category: 'main',
        label: { rich: { name: {}, title: {} } }, // Proper structure
      },
    ];

    const containerWidth = 1000;
    const centerX = 500;
    const scale = 1;
    const fonts = {
      mainNodeSize: 210,
      teamNodeSize: 100,
      mainFont: 22.8,
      mainTitleFont: 18,
      memberFont: 14,
      memberBoldFont: 16,
    };

    // Act - should handle both missing rich and null rich
    component['updateNodePositions'](
      nodes,
      containerWidth,
      centerX,
      scale,
      fonts
    );

    // Just testing that it didn't throw an error
    expect(true).toBeTruthy();
  });

  it('should handle extreme small width in onResize', () => {
    // Setup - mock very small container
    jest.spyOn(document, 'getElementById').mockReturnValue({
      offsetWidth: 300, // Very small width
    } as unknown as HTMLElement);

    // Act
    component.onResize();

    // Verify zoom level is set for small screens
    expect(mockChart.setOption).toHaveBeenCalledWith(
      expect.objectContaining({
        series: expect.arrayContaining([
          expect.objectContaining({
            zoom: 0.8, // Small screen zoom
          }),
        ]),
      })
    );
  });
});
