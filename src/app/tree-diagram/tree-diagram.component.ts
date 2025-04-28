import {
  Component,
  AfterViewInit,
  HostListener,
  OnDestroy,
  ElementRef,
} from '@angular/core';
import * as echarts from 'echarts';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Tree Diagram Component
 *
 * This component displays an organizational structure diagram using ECharts.
 * It shows relationships between Portfolio, PDT, and Teams with interactive nodes.
 * Clicking on a node displays detailed information in a table.
 */
@Component({
  selector: 'app-tree-diagram',
  standalone: true,
  templateUrl: './tree-diagram.component.html',
  styleUrls: ['./tree-diagram.component.scss'],
  imports: [CommonModule, FormsModule],
})
export class TreeDiagramComponent implements AfterViewInit, OnDestroy {
  /** The ECharts instance */
  private chart: any;

  /** Currently selected node name (null when no node is selected) */
  selectedNode: string | null = null;

  /** Headers for the details table */
  tableHeaders: string[] = [];

  /** Data rows for the details table */
  tableData: any[] = [];

  /** Search term for filtering table data */
  searchTerm: string = '';

  /**
   * Filtered table data based on search term
   * Returns all data when search is empty, or filtered results when searching
   */
  get filteredTableData(): any[] {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      return this.tableData;
    }

    const searchTermLower = this.searchTerm.toLowerCase();
    return this.tableData.filter((row) => {
      return Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchTermLower)
      );
    });
  }

  /**
   * Constructor
   * @param elementRef Reference to the host element
   */
  constructor(private elementRef: ElementRef) {}

  /**
   * Initialize the chart after the view is initialized
   */
  ngAfterViewInit() {
    this.initChart();
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
   * @param event Resize event
   */
  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    if (this.chart) {
      this.chart.resize();
    }
  }

  /**
   * Initialize the ECharts diagram
   * Creates the tree diagram with interactive nodes
   */
  private initChart() {
    const chartDom = document.getElementById('chart') as HTMLElement;
    if (!chartDom) {
      console.error('Chart container #chart not found');
      return;
    }

    this.chart = echarts.init(chartDom);

    // Define node size constants - updated to make the sizes as requested
    const MAIN_NODE_SIZE = 120;
    const TEAM_NODE_SIZE = 80; // Increased from 80 to make team nodes bigger

    // Create the click event handler
    this.chart.on('click', (params: any) => {
      if (params.dataType === 'node') {
        // Make the clicked node 30% bigger
        const nodesOption = this.chart.getOption().series[0].data;
        const normalSizes: { [key: string]: number } = {
          Portfolio: MAIN_NODE_SIZE,
          PDT: MAIN_NODE_SIZE,
          TEAMS: MAIN_NODE_SIZE,
          'Team\nMember': TEAM_NODE_SIZE,
          AIT: TEAM_NODE_SIZE,
          'Team\nBacklog': TEAM_NODE_SIZE,
          SPK: TEAM_NODE_SIZE,
        };

        // Reset all nodes to normal size first
        nodesOption.forEach((node: any) => {
          if (normalSizes[node.name]) {
            node.symbolSize = normalSizes[node.name];
          }
        });

        // Make clicked node bigger
        const clickedNode = nodesOption.find(
          (n: any) => n.name === params.name
        );
        if (clickedNode && normalSizes[clickedNode.name]) {
          clickedNode.symbolSize = normalSizes[clickedNode.name] * 1.2; // 30% bigger
        }

        this.chart.setOption({ series: [{ data: nodesOption }] });

        // Generate table data based on clicked node
        this.generateTableData(params.name);
      }
    });

    // Create a custom graph data structure with precise positioning
    const option = {
      tooltip: {
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
      },
      series: [
        {
          type: 'graph',
          layout: 'none', // Custom layout with fixed positions
          roam: true, // Enable panning and zooming
          label: {
            show: true,
            position: 'inside',
            formatter: '{b}', // Node name
            fontSize: 14,
            color: '#333',
            fontWeight: 'bold',
            align: 'center',
            verticalAlign: 'middle',
            fontFamily: 'Connections, Arial, sans-serif',
          },
          edgeLabel: {
            show: false,
          },
          data: [
            // Main horizontal nodes (Portfolio, PDT, TEAMS) - all same size
            {
              name: 'Portfolio',
              category: 'portfolio',
              x: 300,
              y: 200,
              symbolSize: MAIN_NODE_SIZE,
              itemStyle: {
                color: '#E0E0E0', // Swapped with TEAMS color
              },
              label: {
                color: '#000000',
                fontSize: 18,
                fontFamily: 'Connections, Arial, sans-serif',
              },
            },
            {
              name: 'PDT',
              category: 'pdt',
              x: 500,
              y: 200,
              symbolSize: MAIN_NODE_SIZE,
              itemStyle: {
                color: '#C62828', // Cherry red
              },
              label: {
                color: '#FFFFFF',
                fontSize: 18,
                fontFamily: 'Connections, Arial, sans-serif',
              },
            },
            {
              name: 'TEAMS',
              category: 'teams',
              x: 700,
              y: 200,
              symbolSize: MAIN_NODE_SIZE,
              itemStyle: {
                color: '#1a4b8c', // Swapped with Portfolio color
              },
              label: {
                color: '#FFFFFF',
                fontSize: 18,
                fontFamily: 'Connections, Arial, sans-serif',
              },
            },

            // Invisible nodes for connections
            {
              name: 'vertical-junction',
              category: 'junction',
              x: 700, // Below TEAMS
              y: 350, // Vertical drop point
              symbolSize: 0, // Invisible node
              itemStyle: {
                color: 'rgba(0,0,0,0)',
              },
              label: {
                show: false,
              },
            },
            {
              name: 'horizontal-line',
              category: 'junction',
              symbolSize: 0,
              value: [700, 350],
              fixed: true,
              itemStyle: {
                color: 'rgba(0,0,0,0)',
              },
              label: {
                show: false,
              },
            },

            // Team member nodes in a horizontal line - made bigger
            {
              name: 'Team\nMember',
              category: 'member',
              x: 550, // Positioned for better centering
              y: 450,
              symbolSize: TEAM_NODE_SIZE,
              symbol: 'circle',
              itemStyle: {
                color: '#FFFFFF',
                borderColor: '#000000',
                borderWidth: 1,
              },
              label: {
                fontFamily: 'Connections, Arial, sans-serif',
              },
            },
            {
              name: 'AIT',
              category: 'member',
              x: 650, // Positioned for better centering
              y: 450,
              symbolSize: TEAM_NODE_SIZE,
              symbol: 'circle',
              itemStyle: {
                color: '#FFFFFF',
                borderColor: '#000000',
                borderWidth: 1,
              },
              label: {
                fontFamily: 'Connections, Arial, sans-serif',
              },
            },
            {
              name: 'Team\nBacklog',
              category: 'member',
              x: 750, // Positioned for better centering
              y: 450,
              symbolSize: TEAM_NODE_SIZE,
              symbol: 'circle',
              itemStyle: {
                color: '#FFFFFF',
                borderColor: '#000000',
                borderWidth: 1,
              },
              label: {
                fontFamily: 'Connections, Arial, sans-serif',
              },
            },
            {
              name: 'SPK',
              category: 'member',
              x: 850, // Positioned for better centering
              y: 450,
              symbolSize: TEAM_NODE_SIZE,
              symbol: 'circle',
              itemStyle: {
                color: '#FFFFFF',
                borderColor: '#000000',
                borderWidth: 1,
              },
              label: {
                fontFamily: 'Connections, Arial, sans-serif',
              },
            },

            // Invisible nodes for vertical connections
            {
              name: 'v1',
              x: 550,
              y: 350,
              symbolSize: 0,
              itemStyle: {
                color: 'rgba(0,0,0,0)',
              },
              label: {
                show: false,
              },
            },
            {
              name: 'v2',
              x: 650,
              y: 350,
              symbolSize: 0,
              itemStyle: {
                color: 'rgba(0,0,0,0)',
              },
              label: {
                show: false,
              },
            },
            {
              name: 'v3',
              x: 750,
              y: 350,
              symbolSize: 0,
              itemStyle: {
                color: 'rgba(0,0,0,0)',
              },
              label: {
                show: false,
              },
            },
            {
              name: 'v4',
              x: 850,
              y: 350,
              symbolSize: 0,
              itemStyle: {
                color: 'rgba(0,0,0,0)',
              },
              label: {
                show: false,
              },
            },
          ],
          links: [
            // Horizontal line from Portfolio to PDT
            {
              source: 'Portfolio',
              target: 'PDT',
              lineStyle: {
                width: 1,
                color: '#B0BEC5',
              },
            },
            // Horizontal line from PDT to TEAMS
            {
              source: 'PDT',
              target: 'TEAMS',
              lineStyle: {
                width: 1,
                color: '#B0BEC5',
              },
            },

            // Main vertical line from TEAMS to junction
            {
              source: 'TEAMS',
              target: 'vertical-junction',
              lineStyle: {
                width: 1,
                color: '#B0BEC5',
              },
            },

            // Horizontal line - connecting the 4 nodes horizontally
            {
              source: 'v1',
              target: 'v4',
              lineStyle: {
                width: 1,
                color: '#B0BEC5',
                curveness: 0,
              },
            },

            // Vertical lines down to each node - perfectly straight
            {
              source: 'v1',
              target: 'Team\nMember',
              lineStyle: {
                width: 1,
                color: '#B0BEC5',
                curveness: 0,
              },
            },
            {
              source: 'v2',
              target: 'AIT',
              lineStyle: {
                width: 1,
                color: '#B0BEC5',
                curveness: 0,
              },
            },
            {
              source: 'v3',
              target: 'Team\nBacklog',
              lineStyle: {
                width: 1,
                color: '#B0BEC5',
                curveness: 0,
              },
            },
            {
              source: 'v4',
              target: 'SPK',
              lineStyle: {
                width: 1,
                color: '#B0BEC5',
                curveness: 0,
              },
            },
          ],
          categories: [
            { name: 'portfolio' },
            { name: 'pdt' },
            { name: 'teams' },
            { name: 'junction' },
            { name: 'member' },
          ],
          center: ['50%', '50%'], // Better centered
          zoom: 0.85, // Slightly more zoomed out
        },
      ],
    };

    this.chart.setOption(option);
  }

  /**
   * Generate the table data based on the clicked node
   * Each node type has different table columns and dummy data
   * @param nodeName The name of the clicked node
   */
  private generateTableData(nodeName: string) {
    this.selectedNode = nodeName;

    // Define different table schemas based on node type
    if (nodeName === 'Portfolio') {
      this.tableHeaders = [
        'ID',
        'Portfolio Name',
        'Type',
        'Description',
        'Manager',
        'Budget',
        'Status',
      ];
      this.tableData = [
        {
          ID: 'P001',
          'Portfolio Name': 'Enterprise Solutions',
          Type: 'Strategic',
          Description: 'Core enterprise applications',
          Manager: 'John Doe',
          Budget: '$1,200,000',
          Status: 'Active',
        },
        {
          ID: 'P002',
          'Portfolio Name': 'Digital Transformation',
          Type: 'Growth',
          Description: 'Digital initiatives',
          Manager: 'Sarah Johnson',
          Budget: '$850,000',
          Status: 'Active',
        },
        {
          ID: 'P003',
          'Portfolio Name': 'Legacy Modernization',
          Type: 'Maintenance',
          Description: 'Legacy system updates',
          Manager: 'Mike Brown',
          Budget: '$450,000',
          Status: 'On Hold',
        },
      ];
    } else if (nodeName === 'PDT') {
      this.tableHeaders = [
        'ID',
        'PDT Name',
        'Lead',
        'Members',
        'Focus Area',
        'Projects',
        'Stakeholders',
      ];
      this.tableData = [
        {
          ID: 'PDT001',
          'PDT Name': 'Core Development',
          Lead: 'Jane Smith',
          Members: '24',
          'Focus Area': 'Product Engineering',
          Projects: '7',
          Stakeholders: 'Business Units',
        },
        {
          ID: 'PDT002',
          'PDT Name': 'Infrastructure',
          Lead: 'Chris Evans',
          Members: '16',
          'Focus Area': 'Cloud Infrastructure',
          Projects: '4',
          Stakeholders: 'IT Operations',
        },
        {
          ID: 'PDT003',
          'PDT Name': 'Data Services',
          Lead: 'Emma Wilson',
          Members: '12',
          'Focus Area': 'Data Analytics',
          Projects: '5',
          Stakeholders: 'Business Intelligence',
        },
      ];
    } else if (nodeName === 'TEAMS') {
      this.tableHeaders = [
        'ID',
        'Team Name',
        'Manager',
        'Size',
        'Focus',
        'Location',
        'Performance',
      ];
      this.tableData = [
        {
          ID: 'T001',
          'Team Name': 'Development Squad',
          Manager: 'Alice Johnson',
          Size: '8',
          Focus: 'Backend Services',
          Location: 'New York',
          Performance: '92%',
        },
        {
          ID: 'T002',
          'Team Name': 'UI/UX Team',
          Manager: 'Bob Wilson',
          Size: '6',
          Focus: 'Frontend Development',
          Location: 'San Francisco',
          Performance: '89%',
        },
        {
          ID: 'T003',
          'Team Name': 'Quality Assurance',
          Manager: 'Carol Martinez',
          Size: '5',
          Focus: 'Testing',
          Location: 'Chicago',
          Performance: '94%',
        },
      ];
    } else if (nodeName === 'Team\nMember') {
      this.tableHeaders = [
        'ID',
        'Name',
        'Role',
        'Experience',
        'Skills',
        'Current Project',
        'Performance',
      ];
      this.tableData = [
        {
          ID: 'EMP001',
          Name: 'David Smith',
          Role: 'Developer',
          Experience: '5 years',
          Skills: 'Java, Spring, Kubernetes',
          'Current Project': 'API Gateway',
          Performance: 'Excellent',
        },
        {
          ID: 'EMP002',
          Name: 'Jessica Lee',
          Role: 'Developer',
          Experience: '3 years',
          Skills: 'Python, Django, AWS',
          'Current Project': 'Data Pipeline',
          Performance: 'Good',
        },
        {
          ID: 'EMP003',
          Name: 'Michael Brown',
          Role: 'Developer',
          Experience: '7 years',
          Skills: 'C#, .NET, Azure',
          'Current Project': 'Authentication Service',
          Performance: 'Excellent',
        },
      ];
    } else if (nodeName === 'AIT') {
      this.tableHeaders = [
        'ID',
        'Name',
        'Category',
        'Description',
        'Status',
        'Owner',
        'Last Updated',
      ];
      this.tableData = [
        {
          ID: 'AIT001',
          Name: 'DevOps Pipeline',
          Category: 'Deployment',
          Description: 'CI/CD pipeline for deployment',
          Status: 'Active',
          Owner: 'DevOps Team',
          'Last Updated': '2023-05-15',
        },
        {
          ID: 'AIT002',
          Name: 'Code Quality Gates',
          Category: 'Quality',
          Description: 'Automated code quality checks',
          Status: 'Active',
          Owner: 'Architecture Team',
          'Last Updated': '2023-06-22',
        },
        {
          ID: 'AIT003',
          Name: 'Security Scanning',
          Category: 'Security',
          Description: 'Vulnerability scanning tool',
          Status: 'Under Review',
          Owner: 'Security Team',
          'Last Updated': '2023-07-10',
        },
      ];
    } else if (nodeName === 'Team\nBacklog') {
      this.tableHeaders = [
        'ID',
        'Story',
        'Points',
        'Priority',
        'Status',
        'Sprint',
        'Assignee',
      ];
      this.tableData = [
        {
          ID: 'US001',
          Story: 'Implement user authentication',
          Points: '8',
          Priority: 'High',
          Status: 'In Progress',
          Sprint: 'Sprint 24',
          Assignee: 'Jessica Lee',
        },
        {
          ID: 'US002',
          Story: 'Create dashboard widgets',
          Points: '5',
          Priority: 'Medium',
          Status: 'To Do',
          Sprint: 'Sprint 24',
          Assignee: 'Unassigned',
        },
        {
          ID: 'US003',
          Story: 'Optimize database queries',
          Points: '13',
          Priority: 'High',
          Status: 'In Review',
          Sprint: 'Sprint 23',
          Assignee: 'Michael Brown',
        },
      ];
    } else if (nodeName === 'SPK') {
      this.tableHeaders = [
        'ID',
        'Name',
        'Role',
        'Department',
        'Key Interest',
        'Engagement Level',
        'Last Contact',
      ];
      this.tableData = [
        {
          ID: 'SPK001',
          Name: 'Amanda Johnson',
          Role: 'Product Owner',
          Department: 'Product Management',
          'Key Interest': 'Feature Delivery',
          'Engagement Level': 'High',
          'Last Contact': '2023-07-28',
        },
        {
          ID: 'SPK002',
          Name: 'Thomas Garcia',
          Role: 'Business Analyst',
          Department: 'Finance',
          'Key Interest': 'Reporting Capabilities',
          'Engagement Level': 'Medium',
          'Last Contact': '2023-07-15',
        },
        {
          ID: 'SPK003',
          Name: 'Sarah Miller',
          Role: 'Director',
          Department: 'Operations',
          'Key Interest': 'System Performance',
          'Engagement Level': 'Low',
          'Last Contact': '2023-06-30',
        },
      ];
    } else {
      // Default empty table
      this.tableHeaders = [];
      this.tableData = [];
    }
  }
}
