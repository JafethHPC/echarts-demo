import { Component, OnInit } from '@angular/core';
import * as echarts from 'echarts';
import { EChartsOption } from 'echarts';
import worldGeoJson from '../assets/worldEN.json';
import teammatesData from '../assets/teammates.json';
import locationData from '../assets/coordinates.json';

/**
 * Interface representing a team member with their details
 */
interface Teammate {
  name: string;
  role: string;
  hrManager: string;
  city: string;
  country: string;
  timeZone: string;
}

/**
 * Interface for storing country coordinates
 * Each country has an array of [longitude, latitude] coordinates
 */
interface CountryCoordinate {
  [key: string]: number[];
}

/**
 * Interface for the data points shown on the map
 * value contains [longitude, latitude, size] for each point
 */
interface ScatterDataItem {
  name: string;
  value: number[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  // Main configuration object for the ECharts map
  public chartOptions!: EChartsOption;

  // Tab selection state
  public activeTab: 'world-map' | 'team-structure' = 'team-structure';

  // Data arrays and objects
  public teammates: Teammate[] = teammatesData.teammates;
  public countryCoordinates: CountryCoordinate = locationData.coordinates;
  public stateNames: { [key: string]: string } = locationData.stateNames;

  // State for the selected location's table display
  public selectedTeammates: Teammate[] = [];
  public selectedLocation: string = '';
  public isTableVisible: boolean = false;
  public searchTerm: string = '';
  public sortColumn: keyof Teammate | '' = '';
  public sortDirection: 'asc' | 'desc' = 'asc';
  public pageSize: number = 5;
  public currentPage: number = 1;
  public totalPages: number = 1;
  public Math = Math; // For use in the template
  public totalItems = 0;

  get filteredTeammates(): Teammate[] {
    let filtered = this.selectedTeammates;

    // Apply search filter
    if (this.searchTerm) {
      const searchTermLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (teammate) =>
          teammate.name.toLowerCase().includes(searchTermLower) ||
          teammate.role.toLowerCase().includes(searchTermLower) ||
          teammate.hrManager.toLowerCase().includes(searchTermLower) ||
          teammate.city.toLowerCase().includes(searchTermLower) ||
          teammate.timeZone.toLowerCase().includes(searchTermLower)
      );
    }

    // Apply sorting
    if (this.sortColumn) {
      filtered.sort((a, b) => {
        if (!this.sortColumn) return 0;
        const aValue = String(a[this.sortColumn]).toLowerCase();
        const bValue = String(b[this.sortColumn]).toLowerCase();
        const direction = this.sortDirection === 'asc' ? 1 : -1;

        return aValue.localeCompare(bValue) * direction;
      });
    }

    return filtered;
  }

  get paginatedTeammates(): Teammate[] {
    const filtered = this.filteredTeammates;
    this.totalItems = filtered.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);

    // Adjust currentPage if it exceeds the new total pages
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages || 1;
    }

    const startIndex = (this.currentPage - 1) * this.pageSize;
    return filtered.slice(startIndex, startIndex + this.pageSize);
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  /**
   * Default configuration for the world map visualization
   * Contains base styling and behavior settings
   */
  private readonly defaultMapOptions: Partial<EChartsOption> = {
    backgroundColor: '#ffffff',
    geo: {
      map: 'world',
      roam: true, // Enables map zooming and panning
      scaleLimit: {
        min: 1,
        max: 10,
      },
      silent: true,
      itemStyle: {
        areaColor: '#f0f0f0',
        borderColor: '#d9d9d9',
        borderWidth: 0.5,
      },
      emphasis: {
        disabled: true,
      },
      select: {
        disabled: true,
      },
      center: [0, 20], // Centers the map slightly north of the equator
      zoom: 1.8,
      boundingCoords: [
        [-180, 90], // Top-left coordinate
        [180, -90], // Bottom-right coordinate
      ],
      layoutSize: '98%',
      layoutCenter: ['50%', '50%'],
    },
  };

  ngOnInit(): void {
    try {
      this.initializeMap();
    } catch (error) {
      console.error('Error loading world map data:', error);
      this.setErrorState();
    }
  }

  /**
   * Handles clicks on map data points
   * Updates the table below the map with teammate information
   */
  public onChartClick(event: any): void {
    if (event.data) {
      const locationName = event.data.name;
      this.selectedLocation = this.getDisplayName(locationName);
      this.selectedTeammates = this.teammates.filter(
        (t) => t.country === locationName
      );
      this.isTableVisible = true;
    }
  }

  /**
   * Converts location codes to display names
   * Handles special cases for US states (e.g., "United States - NY" → "New York")
   */
  private getDisplayName(locationName: string): string {
    if (locationName.includes(' - ')) {
      const stateCode = locationName.split(' - ')[1];
      return this.stateNames[stateCode] || stateCode;
    }
    return locationName;
  }

  /**
   * Creates the tooltip formatter function for map data points
   * Displays teammate information when hovering over a location
   */
  private createTooltipFormatter(): (params: any) => string {
    return (params: any): string => {
      if (params.seriesType !== 'scatter') return '';

      const locationName = params.name;
      const teamatesInLocation = this.teammates.filter(
        (t) => t.country === locationName
      );

      if (teamatesInLocation.length === 0) return '';

      // Generate HTML for the list of teammates (limited to 5)
      const displayedTeammates = teamatesInLocation.slice(0, 5);
      const remainingCount = Math.max(0, teamatesInLocation.length - 5);

      const teammatesList = displayedTeammates
        .map(
          (t, index) => `
          ${
            index !== 0
              ? '<div style="height: 1px; background-color: #e0e0e0; margin: 8px 0;"></div>'
              : ''
          }
          <li style="margin: 5px 0">
            <strong>${t.name}</strong><br/>
            <span style="color: #666;">${t.role}</span>
          </li>`
        )
        .join('');

      const remainingText =
        remainingCount > 0
          ? `<div style="text-align: center; padding-top: 8px; color: #666;">
             +${remainingCount} more teammates
           </div>`
          : '';

      // Return formatted tooltip HTML with fixed height and scrollbar
      return `<div style="min-width: 200px;">
        <div style="
          background-color: #012169;
          color: white;
          padding: 8px 12px;
          margin: -8px -8px 8px -8px;
          border-radius: 4px 4px 0 0;
          font-weight: bold;
          text-align: center;
        ">${this.getDisplayName(locationName)}</div>
        <div style="
          max-height: 200px;
          overflow-y: auto;
          padding: 0 4px;
          scrollbar-width: thin;
          scrollbar-color: #cccccc transparent;
          -webkit-scrollbar-width: thin;
          -webkit-scrollbar-color: #cccccc transparent;
        ">
          <ul style="
            list-style-type: none;
            padding-left: 0;
            margin: 8px 0;
          ">
            ${teammatesList}
          </ul>
          ${remainingText}
        </div>
      </div>`;
    };
  }

  /**
   * Initializes the world map visualization
   * Sets up the map data, scatter points, and configuration
   */
  private initializeMap(): void {
    echarts.registerMap('world', worldGeoJson as any);

    const scatterData: ScatterDataItem[] = Object.entries(
      this.countryCoordinates
    ).map(([country, coords]) => ({
      name: country,
      value: [...coords, 1],
    }));

    this.chartOptions = {
      ...this.defaultMapOptions,
      tooltip: {
        show: true,
        trigger: 'item',
        enterable: true,
        alwaysShowContent: false,
        hideDelay: 100,
        position: function (
          point: any,
          params: any,
          dom: any,
          rect: any,
          size: any
        ) {
          const [x, y] = point;
          const tooltipWidth = dom.offsetWidth;
          const tooltipHeight = dom.offsetHeight;
          const viewWidth = size.viewSize[0];
          const viewHeight = size.viewSize[1];

          let tooltipX = x + 15;
          let tooltipY = y + 15;

          if (tooltipX + tooltipWidth > viewWidth) {
            tooltipX = x - tooltipWidth - 15;
          }

          if (tooltipY + tooltipHeight > viewHeight) {
            tooltipY = y - tooltipHeight - 15;
          }

          return [tooltipX, tooltipY];
        },
        formatter: this.createTooltipFormatter(),
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e0e0e0',
        borderWidth: 1,
        textStyle: {
          color: '#333',
        },
        extraCssText: `
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border-radius: 4px;
          padding: 8px;
          ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          ::-webkit-scrollbar-track {
            background: transparent;
          }
          ::-webkit-scrollbar-thumb {
            background: #cccccc;
            border-radius: 3px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #bbbbbb;
          }
        `,
      },
      series: [
        {
          name: 'Teammates',
          type: 'scatter',
          coordinateSystem: 'geo',
          data: scatterData,
          symbolSize: 8,
          cursor: 'pointer',
          itemStyle: {
            color: '#000000',
            opacity: 1,
          },
          emphasis: {
            scale: true,
            itemStyle: {
              color: '#000000',
            },
          },
          zlevel: 2,
        },
      ],
    };
  }

  /**
   * Sets error state for the chart if initialization fails
   */
  private setErrorState(): void {
    this.chartOptions = {
      title: {
        text: 'Error loading world map',
        subtext: 'Please try refreshing the page',
        left: 'center',
        top: 'center',
      },
    };
  }

  /**
   * Closes the table view
   */
  public closeTable(): void {
    this.isTableVisible = false;
    this.selectedTeammates = [];
    this.selectedLocation = '';
  }

  /**
   * Handles column sorting
   */
  public sortBy(column: keyof Teammate): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    // Reset to first page when sorting
    this.currentPage = 1;
  }

  /**
   * Gets the sort indicator for a column
   */
  public getSortIndicator(column: keyof Teammate): string {
    if (this.sortColumn !== column) return '↕';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  public setActiveTab(tab: 'world-map' | 'team-structure'): void {
    this.activeTab = tab;
    // Reset table view when switching tabs
    if (this.isTableVisible) {
      this.closeTable();
    }
  }
}
