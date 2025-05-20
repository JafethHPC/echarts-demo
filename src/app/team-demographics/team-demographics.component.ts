import { Component, OnInit } from '@angular/core';
import * as echarts from 'echarts';
import { EChartsOption } from 'echarts';
import worldGeoJson from '../../assets/worldEN.json';
import { TeamDemographicsService } from './team-demographics.service';
import { TeamMember } from './models/location.model';
import { forkJoin } from 'rxjs';
import { LocationCacheService } from './services/location-cache.service';

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
  profilePic: string;
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
  selector: 'app-team-demographics',
  templateUrl: './team-demographics.component.html',
  styleUrls: ['./team-demographics.component.scss'],
  standalone: false,
})
export class TeamDemographicsComponent implements OnInit {
  // Main configuration object for the ECharts map
  public chartOptions!: EChartsOption;
  public chart: any; // Reference to the chart instance

  // Zoom threshold constants
  private COUNTRY_ZOOM = 2.5;
  private STATE_ZOOM = 4.0;
  private CITY_ZOOM = 5.0;
  private currentZoom = 1.8; // Default starting zoom

  // Grouped data for different zoom levels
  private countryNodes: any[] = [];
  private stateNodes: any[] = [];
  private cityNodes: any[] = [];
  private locationGroups = new Map<number, TeamMember[]>();

  // Data arrays and objects
  public teammates: TeamMember[] = [];
  public stateNames: { [key: string]: string } = {
    NC: 'North Carolina',
    NY: 'New York',
    NJ: 'New Jersey',
    TX: 'Texas',
  };

  // State for the selected location's table display
  public selectedTeammates: TeamMember[] = [];
  public selectedLocation: string = '';
  public isTableVisible: boolean = false;
  public searchTerm: string = '';
  public sortColumn: keyof TeamMember | '' = '';
  public sortDirection: 'asc' | 'desc' = 'asc';
  public pageSize: number = 5;
  public currentPage: number = 1;
  public totalPages: number = 1;
  public Math = Math; // For use in the template
  public totalItems = 0;

  // Track if geocoding is in progress
  public isLoadingData = false;

  // Stat box calculations
  get teamSize(): number {
    return this.teammates.length;
  }

  get uniqueLocations(): number {
    // Count unique combinations of country and state
    const uniqueLocations = new Set<string>();
    this.teammates.forEach((teammate) => {
      const locationKey = `${teammate.country}|${teammate.state || ''}`;
      uniqueLocations.add(locationKey);
    });
    return uniqueLocations.size;
  }

  get numSoftwareEngineers(): number {
    return this.teammates.filter((teammate) =>
      /software engineer|data engineer/i.test(teammate.role)
    ).length;
  }

  get numQualitySpecialists(): number {
    return this.teammates.filter((teammate) =>
      /quality (specialist|analyst|assurance)|qa |tester/i.test(teammate.role)
    ).length;
  }

  get numScrumMasters(): number {
    return this.teammates.filter((teammate) =>
      /scrum master|agile coach/i.test(teammate.role)
    ).length;
  }

  get numProductOwners(): number {
    return this.teammates.filter((teammate) =>
      /product owner|po /i.test(teammate.role)
    ).length;
  }

  get numAppControlSpecialists(): number {
    return this.teammates.filter((teammate) =>
      /application control specialist|app control/i.test(teammate.role)
    ).length;
  }

  constructor(
    private teamDemographicsService: TeamDemographicsService,
    private locationCacheService: LocationCacheService
  ) {}

  ngOnInit(): void {
    this.isLoadingData = true;

    try {
      // Get locations and team members with coordinates
      this.teamDemographicsService.getTeamMembersWithCoordinates().subscribe(
        (members) => {
          this.teammates = members;
          this.initializeMap();
          this.isLoadingData = false;
        },
        (error) => {
          console.error('Error loading team members:', error);
          this.setErrorState();
          this.isLoadingData = false;
        }
      );
    } catch (error) {
      console.error('Error loading world map data:', error);
      this.setErrorState();
      this.isLoadingData = false;
    }
  }

  get filteredTeammates(): TeamMember[] {
    let filtered = this.selectedTeammates;

    // Apply search filter
    if (this.searchTerm) {
      const searchTermLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (teammate) =>
          teammate.name.toLowerCase().includes(searchTermLower) ||
          teammate.role.toLowerCase().includes(searchTermLower) ||
          (teammate.hrManager?.toLowerCase() || '').includes(searchTermLower) ||
          (teammate.city &&
            teammate.city.toLowerCase().includes(searchTermLower)) ||
          (teammate.timeZone?.toLowerCase() || '').includes(searchTermLower)
      );
    }

    // Apply sorting
    if (this.sortColumn) {
      filtered.sort((a, b) => {
        if (!this.sortColumn) return 0;
        const aValue = String(a[this.sortColumn] || '').toLowerCase();
        const bValue = String(b[this.sortColumn] || '').toLowerCase();
        const direction = this.sortDirection === 'asc' ? 1 : -1;

        return aValue.localeCompare(bValue) * direction;
      });
    }

    return filtered;
  }

  get paginatedTeammates(): TeamMember[] {
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
        max: 20, // Increased from 10 to allow deeper zooming
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

  /**
   * Initializes the world map visualization
   * Sets up the map data, scatter points, and configuration
   */
  private initializeMap(): void {
    echarts.registerMap('world', worldGeoJson as any);

    // Group teammates by location and zoom level
    this.groupTeammatesByLocation();

    // Create scatter data initially with US states and other countries
    const scatterData = [
      ...this.stateNodes,
      ...this.countryNodes.filter((node) => node.country !== 'United States'),
    ];

    // Log sample data for debugging
    console.log(
      'Sample country node:',
      this.countryNodes.length > 0 ? this.countryNodes[0] : 'No country nodes'
    );
    console.log(
      'Sample state node:',
      this.stateNodes.length > 0 ? this.stateNodes[0] : 'No state nodes'
    );
    console.log(
      'Sample city node:',
      this.cityNodes.length > 0 ? this.cityNodes[0] : 'No city nodes'
    );

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
        formatter: this.createTooltipFormatter(this.locationGroups),
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
          symbolSize: 10, // All nodes same size
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
   * Handles clicks on map data points
   * Updates the table below the map with teammate information
   */
  public onChartClick(event: any): void {
    if (!event.data || event.data.id === undefined) return;

    const data = event.data;
    let teammatesForLocation: TeamMember[] = [];
    let locationName = '';

    if (data.level === 'country') {
      // Country level node - filter teammates by country
      locationName = data.name;
      teammatesForLocation = this.teammates.filter(
        (t) => t.country === data.country
      );
    } else if (data.level === 'state') {
      // State level node - filter teammates by country and state
      locationName = `${data.name}, USA`;
      teammatesForLocation = this.teammates.filter(
        (t) => t.country === 'United States' && t.state === data.state
      );
    } else {
      // City level node
      const locationId = data.id;
      locationName = data.city ? `${data.city}, ${data.country}` : data.name;

      // First try to filter by locationId for backward compatibility
      teammatesForLocation = this.teammates.filter(
        (t) => t.locationId === locationId
      );

      // If no teammates found by locationId, try using coordinates
      if (teammatesForLocation.length === 0 && data.coordinates) {
        // Find teammates with coordinates close to the clicked point
        // Using a small threshold for matching
        const threshold = 0.01; // approximately 1km
        const [lon, lat] = data.coordinates;

        teammatesForLocation = this.teammates.filter(
          (t) =>
            t.coordinates &&
            Math.abs(t.coordinates[0] - lon) < threshold &&
            Math.abs(t.coordinates[1] - lat) < threshold
        );
      }
    }

    this.selectedLocation = locationName;
    this.selectedTeammates = teammatesForLocation;
    this.isTableVisible = true;
  }

  public changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
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
   * Chart initialized event handler
   */
  public onChartInit(ec: any) {
    this.chart = ec;

    // Listen for zoom events
    this.chart.on('georoam', (params: any) => {
      const option = this.chart.getOption();
      if (option.geo && option.geo[0]) {
        const previousZoom = this.currentZoom;
        this.currentZoom = option.geo[0].zoom;

        // Log zoom changes
        if (Math.abs(previousZoom - this.currentZoom) > 0.1) {
          console.log(
            `Zoom changed from ${previousZoom.toFixed(
              2
            )} to ${this.currentZoom.toFixed(2)}`
          );

          // Log zoom level comparison
          console.log(
            `COUNTRY_ZOOM: ${this.COUNTRY_ZOOM}, STATE_ZOOM: ${this.STATE_ZOOM}, CITY_ZOOM: ${this.CITY_ZOOM}`
          );
          console.log(
            `Current zoom > STATE_ZOOM: ${this.currentZoom > this.STATE_ZOOM}`
          );
        }

        this.updateNodesBasedOnZoom();
      }
    });

    // Initial debug log
    console.log(`Initial cityNodes count: ${this.cityNodes.length}`);
    console.log(`Initial stateNodes count: ${this.stateNodes.length}`);
    console.log(`Initial countryNodes count: ${this.countryNodes.length}`);
  }

  /**
   * Updates the displayed nodes based on current zoom level
   */
  private updateNodesBasedOnZoom() {
    console.log(`Current zoom level: ${this.currentZoom.toFixed(2)}`);
    let nodes: any[] = [];

    // When zoomed in sufficiently, show city nodes
    if (this.currentZoom >= this.CITY_ZOOM) {
      console.log(
        `Zoom level ${this.currentZoom.toFixed(2)} >= CITY_ZOOM threshold ${
          this.CITY_ZOOM
        } - showing city nodes`
      );
      // Show city level nodes when zoomed in
      if (this.cityNodes.length > 0) {
        // Ensure city nodes have all required visual properties
        nodes = this.cityNodes.map((node) => ({
          ...node,
          symbolSize: 10, // Ensure size is visible
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
        }));
        console.log(`Using ${nodes.length} city nodes`);
      } else {
        console.warn(
          'No city nodes available, falling back to country/state nodes'
        );
        nodes = this.getCountryAndStateNodes();
      }
    }
    // Medium zoom level, show states for US and countries for rest
    else if (this.currentZoom >= this.STATE_ZOOM) {
      console.log(
        `Zoom level ${this.currentZoom.toFixed(2)} >= STATE_ZOOM threshold ${
          this.STATE_ZOOM
        } - showing state nodes`
      );
      nodes = this.getCountryAndStateNodes();
    }
    // Default zoom level, show countries (and US states)
    else {
      console.log(
        `Zoom level ${this.currentZoom.toFixed(2)} < STATE_ZOOM threshold ${
          this.STATE_ZOOM
        } - showing country nodes`
      );
      nodes = this.getCountryAndStateNodes();
    }

    // Update the chart with new nodes, making sure to include all required series properties
    this.chart.setOption({
      series: [
        {
          name: 'Teammates',
          type: 'scatter',
          coordinateSystem: 'geo',
          data: nodes,
          symbolSize: 10,
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
    });
  }

  /**
   * Helper method to get combined country and state nodes
   */
  private getCountryAndStateNodes(): any[] {
    return [
      ...this.stateNodes,
      ...this.countryNodes.filter((node) => node.country !== 'United States'),
    ];
  }

  /**
   * Group teammates by country, state (for US), and city
   */
  private groupTeammatesByLocation(): void {
    // Maps to track unique locations and their counts
    const countryGroups = new Map<string, TeamMember[]>();
    const stateGroups = new Map<string, TeamMember[]>();
    const cityGroups = new Map<number, TeamMember[]>();

    // Group teammates by country, state, and city
    this.teammates.forEach((teammate) => {
      if (!teammate.coordinates) return;

      // Country grouping (skip US as we'll use states instead)
      if (teammate.country !== 'United States') {
        if (!countryGroups.has(teammate.country)) {
          countryGroups.set(teammate.country, []);
        }
        countryGroups.get(teammate.country)!.push(teammate);
      }

      // State grouping for US
      if (teammate.country === 'United States' && teammate.state) {
        const stateKey = `US-${teammate.state}`;
        if (!stateGroups.has(stateKey)) {
          stateGroups.set(stateKey, []);
        }
        stateGroups.get(stateKey)!.push(teammate);
      }

      // City grouping (using locationId as the key for backward compatibility)
      // If locationId is not available, create a synthetic key from coordinates
      let locationKey = teammate.locationId;
      if (locationKey === null) {
        // Create a synthetic location key from coordinates (encoded to an integer)
        locationKey =
          Math.round(teammate.coordinates[0] * 1000) * 10000 +
          Math.round(teammate.coordinates[1] * 1000);
      }

      if (!cityGroups.has(locationKey)) {
        cityGroups.set(locationKey, []);
      }
      cityGroups.get(locationKey)!.push(teammate);
    });

    // Generate country-level nodes (excluding US)
    this.countryNodes = Array.from(countryGroups.entries())
      .map(([country, members]) => {
        // Calculate average coordinates for the country
        const coords = this.calculateAverageCoordinates(members);
        if (!coords) return null;

        return {
          id: `country-${country}`,
          name: country,
          value: coords,
          country: country,
          memberCount: members.length,
          level: 'country',
          tooltip: {
            formatter: () => `${country}: ${members.length} team members`,
          },
        };
      })
      .filter((node) => node !== null);

    // Generate state-level nodes for US
    this.stateNodes = Array.from(stateGroups.entries())
      .map(([stateKey, members]) => {
        // Calculate average coordinates for the state
        const coords = this.calculateAverageCoordinates(members);
        if (!coords) return null;

        const state = stateKey.split('-')[1];
        const stateName = this.stateNames[state] || state;

        return {
          id: stateKey,
          name: stateName,
          value: coords,
          country: 'United States',
          state: state,
          memberCount: members.length,
          level: 'state',
          tooltip: {
            formatter: () =>
              `${stateName}, USA: ${members.length} team members`,
          },
        };
      })
      .filter((node) => node !== null);

    // Generate city-level nodes
    this.cityNodes = Array.from(cityGroups.entries())
      .map(([locationId, members]) => {
        const firstMember = members[0];
        if (!firstMember.coordinates) {
          console.warn('Member missing coordinates:', firstMember);
          return null;
        }

        const [lon, lat] = firstMember.coordinates;
        const cityNode = {
          id: locationId,
          name: firstMember.city || 'Unknown City',
          // Format value array correctly for scatter plot with longitude, latitude, size
          value: [lon, lat, members.length],
          city: firstMember.city,
          state: firstMember.state,
          country: firstMember.country,
          memberCount: members.length,
          level: 'city',
          coordinates: [lon, lat], // Explicitly include coordinates
          symbolSize: 10, // Set size here too
          itemStyle: {
            color: '#000000',
            opacity: 1,
          },
        };

        // Log a sample city node to verify structure
        if (members.length >= 2) {
          console.log('Sample city node created:', JSON.stringify(cityNode));
        }

        return cityNode;
      })
      .filter((node) => node !== null);

    console.log(`Created ${this.cityNodes.length} city nodes`);

    // Store the cityGroups for tooltip use
    this.locationGroups = cityGroups;
  }

  /**
   * Calculate average coordinates from a group of team members
   */
  private calculateAverageCoordinates(
    members: TeamMember[]
  ): [number, number, number] | null {
    let validMembers = members.filter((m) => m.coordinates);
    if (validMembers.length === 0) return null;

    const total = validMembers.reduce(
      (acc, member) => {
        if (member.coordinates) {
          const [lon, lat] = member.coordinates;
          acc.lon += lon;
          acc.lat += lat;
        }
        return acc;
      },
      { lon: 0, lat: 0 }
    );

    return [
      total.lon / validMembers.length,
      total.lat / validMembers.length,
      validMembers.length,
    ];
  }

  /**
   * Creates the tooltip formatter function for map data points
   * Displays teammate information when hovering over a location
   */
  private createTooltipFormatter(
    locationGroups: Map<number, TeamMember[]>
  ): (params: any) => string {
    return (params: any): string => {
      // Special case for country/state level nodes
      if (
        params.data &&
        (params.data.level === 'country' || params.data.level === 'state')
      ) {
        const locationName = params.data.name;
        const memberCount = params.data.memberCount || 0;

        return `<div style="min-width: 220px;">
          <div style="
            background-color: #012169;
            color: white;
            padding: 8px 12px;
            margin: -8px -8px 8px -8px;
            border-radius: 4px 4px 0 0;
            font-weight: bold;
            text-align: center;
          ">${locationName}</div>
          <div style="text-align: center; padding: 10px 0;">
            ${memberCount} team members
          </div>
        </div>`;
      }

      // Regular city-level tooltip
      if (
        params.seriesType !== 'scatter' ||
        !params.data ||
        params.data.id === undefined
      ) {
        return '';
      }

      const locationId = params.data.id;
      const teamatesInLocation = locationGroups.get(locationId) || [];

      if (teamatesInLocation.length === 0) return '';

      // Generate HTML for the list of teammates (limited to 5)
      const displayedTeammates = teamatesInLocation.slice(0, 5);
      const remainingCount = Math.max(0, teamatesInLocation.length - 5);

      const teammatesList = displayedTeammates
        .map(
          (t) => `
            <li style="display: flex; align-items: center; margin: 8px 0;">
              <img src="${t.profilePic}" alt="${t.name}" style="width:32px;height:32px;border-radius:50%;margin-right:10px;object-fit:cover;" />
              <div>
                <div style="font-weight: bold;">${t.name}</div>
                <div style="color: #666; font-size: 13px;">${t.role}</div>
              </div>
            </li>`
        )
        .join('');

      const remainingText =
        remainingCount > 0
          ? `<div style="text-align: center; padding-top: 8px; color: #666;">
             +${remainingCount} more teammates
           </div>`
          : '';

      // Format the location display correctly: City, Country (or City, State, Country for US)
      let locationDisplay = '';

      if (params.data.city) {
        if (params.data.country === 'United States' && params.data.state) {
          // For US locations: City, State, USA
          const stateName =
            this.stateNames[params.data.state] || params.data.state;
          locationDisplay = `${params.data.city}, ${stateName}, USA`;
        } else {
          // For other locations: City, Country
          locationDisplay = `${params.data.city}, ${params.data.country}`;
        }
      } else {
        // Fallback if no city is provided
        locationDisplay = params.data.name;
      }

      // Return formatted tooltip HTML with fixed height and scrollbar
      return `<div style="min-width: 220px;">
        <div style="
          background-color: #012169;
          color: white;
          padding: 8px 12px;
          margin: -8px -8px 8px -8px;
          border-radius: 4px 4px 0 0;
          font-weight: bold;
          text-align: center;
        ">${locationDisplay}</div>
        <div style="
          max-height: 220px;
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
  public sortBy(column: keyof TeamMember): void {
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
  public getSortIndicator(column: keyof TeamMember): string {
    if (this.sortColumn !== column) return '↕';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  /**
   * Example method demonstrating how to create a team member with the new structure
   * and fetch its locationId
   */
  public createTeamMemberExample(): void {
    // Create a new team member as specified in the requirements
    const newTeamMember: TeamMember = {
      name: 'Jane Doe',
      role: 'Backend Engineer',
      profilePic:
        'https://ui-avatars.com/api/?name=Jane+Doe&background=random&size=128',
      city: 'Paris',
      state: '',
      country: 'France',
      locationId: null,
      // Coordinates [longitude, latitude] for Paris
      coordinates: [2.3522, 48.8566],
      // Optional fields
      timeZone: 'CET',
    };

    // Update the team member with location information
    this.teamDemographicsService
      .updateTeamMemberWithLocation(newTeamMember)
      .subscribe({
        next: (updatedMember) => {
          console.log('Team member with location ID:', updatedMember);
          // You could add this member to the teammates array
          // this.teammates.push(updatedMember);
          // this.initializeMap(); // Refresh the map to show the new team member
        },
        error: (err) => {
          console.error('Error fetching location data:', err);
        },
      });
  }
}
