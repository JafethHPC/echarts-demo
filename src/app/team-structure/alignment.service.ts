import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface Alignment {
  alignFromId: string;
  alignFromName: string;
  alignToActive: number;
  alignToId: string;
  alignToName: string;
  alignmentActive: number;
  alignmentId: string;
  alignmentType: string;
  horizon: string;
  jiraInstance: string;
  memberAlignment: string;
  projectUrl: string;
  techManagerName: string;
  techManagerNbk: string;
}

export interface Team {
  teamId: string;
  teamName: string;
  teamType: string;
}

export type AlignmentType =
  | 'TEAMTOAIT'
  | 'TEAMTOTPK'
  | 'TEAMTOSPK'
  | 'TEAMTOJIRABOARD'
  | 'TEAMTOTRAIN'
  | 'TEAMTOPDT'
  | 'TRAINTOPORTFOLIO';

@Injectable({ providedIn: 'root' })
export class AlignmentService {
  /**
   * Mock data for different alignment types
   */
  private mockAlignmentData = {
    // TEAMTOAIT alignments
    TEAMTOAIT: [
      {
        alignFromId: '301',
        alignFromName: 'Mobile Apps',
        alignToActive: 1,
        alignToId: 'AIT-001',
        alignToName: 'Mobile Authentication Service',
        alignmentActive: 1,
        alignmentId: 'align-301-ait-001',
        alignmentType: 'TEAMTOAIT',
        horizon: 'Q2 2024',
        jiraInstance: 'cloud',
        memberAlignment: 'Primary',
        projectUrl: 'https://jira.company.com/projects/AIT001',
        techManagerName: 'Alice Johnson',
        techManagerNbk: 'AJ001',
      },
      {
        alignFromId: '301',
        alignFromName: 'Mobile Apps',
        alignToActive: 1,
        alignToId: 'AIT-002',
        alignToName: 'Push Notification Framework',
        alignmentActive: 1,
        alignmentId: 'align-301-ait-002',
        alignmentType: 'TEAMTOAIT',
        horizon: 'Q3 2024',
        jiraInstance: 'server',
        memberAlignment: 'Secondary',
        projectUrl: 'https://jira.company.com/projects/AIT002',
        techManagerName: 'Bob Wilson',
        techManagerNbk: 'BW002',
      },
      {
        alignFromId: '301',
        alignFromName: 'Mobile Apps',
        alignToActive: 1,
        alignToId: 'AIT-003',
        alignToName: 'Offline Data Sync',
        alignmentActive: 1,
        alignmentId: 'align-301-ait-003',
        alignmentType: 'TEAMTOAIT',
        horizon: 'Q4 2024',
        jiraInstance: 'cloud',
        memberAlignment: 'Primary',
        projectUrl: 'https://jira.company.com/projects/AIT003',
        techManagerName: 'Carol Davis',
        techManagerNbk: 'CD003',
      },
      {
        alignFromId: '301',
        alignFromName: 'Mobile Apps',
        alignToActive: 1,
        alignToId: 'AIT-004',
        alignToName: 'Biometric Integration',
        alignmentActive: 1,
        alignmentId: 'align-301-ait-004',
        alignmentType: 'TEAMTOAIT',
        horizon: 'Q1 2025',
        jiraInstance: 'server',
        memberAlignment: 'Primary',
        projectUrl: 'https://jira.company.com/projects/AIT004',
        techManagerName: 'David Brown',
        techManagerNbk: 'DB004',
      },
      {
        alignFromId: '301',
        alignFromName: 'Mobile Apps',
        alignToActive: 1,
        alignToId: 'AIT-005',
        alignToName: 'Performance Monitoring',
        alignmentActive: 1,
        alignmentId: 'align-301-ait-005',
        alignmentType: 'TEAMTOAIT',
        horizon: 'Q2 2025',
        jiraInstance: 'cloud',
        memberAlignment: 'Secondary',
        projectUrl: 'https://jira.company.com/projects/AIT005',
        techManagerName: 'Eva Martinez',
        techManagerNbk: 'EM005',
      },
    ],

    // TEAMTOTPK (Team Backlog) alignments
    TEAMTOTPK: [
      {
        alignFromId: '301',
        alignFromName: 'Mobile Apps',
        alignToActive: 1,
        alignToId: 'TPK-001',
        alignToName: 'User Interface Redesign',
        alignmentActive: 1,
        alignmentId: 'align-301-tpk-001',
        alignmentType: 'TEAMTOTPK',
        horizon: 'Q2 2024',
        jiraInstance: 'cloud',
        memberAlignment: 'Primary',
        projectUrl: 'https://jira.company.com/projects/TPK001',
        techManagerName: 'Frank Garcia',
        techManagerNbk: 'FG001',
      },
      {
        alignFromId: '301',
        alignFromName: 'Mobile Apps',
        alignToActive: 1,
        alignToId: 'TPK-002',
        alignToName: 'Performance Optimization',
        alignmentActive: 1,
        alignmentId: 'align-301-tpk-002',
        alignmentType: 'TEAMTOTPK',
        horizon: 'Q3 2024',
        jiraInstance: 'server',
        memberAlignment: 'Secondary',
        projectUrl: 'https://jira.company.com/projects/TPK002',
        techManagerName: 'Helen Smith',
        techManagerNbk: 'HS002',
      },
      {
        alignFromId: '301',
        alignFromName: 'Mobile Apps',
        alignToActive: 1,
        alignToId: 'TPK-003',
        alignToName: 'Bug Fixes Sprint',
        alignmentActive: 1,
        alignmentId: 'align-301-tpk-003',
        alignmentType: 'TEAMTOTPK',
        horizon: 'Q4 2024',
        jiraInstance: 'cloud',
        memberAlignment: 'Primary',
        projectUrl: 'https://jira.company.com/projects/TPK003',
        techManagerName: 'Ian Thompson',
        techManagerNbk: 'IT003',
      },
    ],

    // TEAMTOSPK alignments
    TEAMTOSPK: [
      {
        alignFromId: '301',
        alignFromName: 'Mobile Apps',
        alignToActive: 1,
        alignToId: 'SPK-001',
        alignToName: 'Security Compliance Review',
        alignmentActive: 1,
        alignmentId: 'align-301-spk-001',
        alignmentType: 'TEAMTOSPK',
        horizon: 'Q3 2024',
        jiraInstance: 'server',
        memberAlignment: 'Primary',
        projectUrl: 'https://jira.company.com/projects/SPK001',
        techManagerName: 'Grace Lee',
        techManagerNbk: 'GL001',
      },
      {
        alignFromId: '301',
        alignFromName: 'Mobile Apps',
        alignToActive: 1,
        alignToId: 'SPK-002',
        alignToName: 'Penetration Testing',
        alignmentActive: 1,
        alignmentId: 'align-301-spk-002',
        alignmentType: 'TEAMTOSPK',
        horizon: 'Q4 2024',
        jiraInstance: 'cloud',
        memberAlignment: 'Secondary',
        projectUrl: 'https://jira.company.com/projects/SPK002',
        techManagerName: 'Jack Wilson',
        techManagerNbk: 'JW002',
      },
    ],

    // TEAMTOJIRABOARD alignments
    TEAMTOJIRABOARD: [
      // Returns empty array since count is 0 in the service data
    ],

    // TEAMTOTRAIN (PDT) alignments
    TEAMTOTRAIN: [
      {
        alignFromId: '301',
        alignFromName: 'Mobile Apps',
        alignToActive: 1,
        alignToId: '201',
        alignToName: 'Customer Experience',
        alignmentActive: 1,
        alignmentId: 'align-301-train-201',
        alignmentType: 'TEAMTOTRAIN',
        horizon: 'Ongoing',
        jiraInstance: '',
        memberAlignment: 'Primary',
        projectUrl: '',
        techManagerName: 'David Rodriguez',
        techManagerNbk: 'DR201',
      },
    ],

    // TEAMTOPDT alignments (used to get PDT info for portfolio lookup)
    TEAMTOPDT: [
      {
        alignFromId: '301',
        alignFromName: 'Mobile Apps',
        alignToActive: 1,
        alignToId: '201',
        alignToName: 'Customer Experience',
        alignmentActive: 1,
        alignmentId: 'align-301-pdt-201',
        alignmentType: 'TEAMTOPDT',
        horizon: 'Ongoing',
        jiraInstance: '',
        memberAlignment: 'Primary',
        projectUrl: '',
        techManagerName: 'David Rodriguez',
        techManagerNbk: 'DR201',
      },
    ],

    // TRAINTOPORTFOLIO alignments (PDT to Portfolio)
    TRAINTOPORTFOLIO: [
      {
        alignFromId: '201',
        alignFromName: 'Customer Experience',
        alignToActive: 1,
        alignToId: '101',
        alignToName: 'Digital Transformation & Innovation Portfolio',
        alignmentActive: 1,
        alignmentId: 'align-201-portfolio-101',
        alignmentType: 'TRAINTOPORTFOLIO',
        horizon: 'Strategic',
        jiraInstance: '',
        memberAlignment: 'Primary',
        projectUrl: '',
        techManagerName: 'Sarah Johnson',
        techManagerNbk: 'SJ101',
      },
      {
        alignFromId: '201',
        alignFromName: 'Customer Experience',
        alignToActive: 1,
        alignToId: '102',
        alignToName: 'Enterprise Solutions Portfolio',
        alignmentActive: 1,
        alignmentId: 'align-201-portfolio-102',
        alignmentType: 'TRAINTOPORTFOLIO',
        horizon: 'Strategic',
        jiraInstance: '',
        memberAlignment: 'Secondary',
        projectUrl: '',
        techManagerName: 'Michael Brown',
        techManagerNbk: 'MB102',
      },
    ],
  };

  /**
   * Main function to get alignments by type and ID
   * @param alignmentType - The type of alignment to retrieve
   * @param id - The ID to filter alignments by (usually teamId)
   * @returns Array of alignments matching the criteria
   */
  getAlignment(alignmentType: AlignmentType, id: string): Alignment[] {
    const alignments = this.mockAlignmentData[alignmentType] || [];

    // Filter by the provided ID (alignFromId for most cases)
    return alignments.filter((alignment) => alignment.alignFromId === id);
  }

  /**
   * Get portfolio alignments using the two-step process:
   * 1. Get TEAMTOPDT to find the PDT ID
   * 2. Use PDT ID to get TRAINTOPORTFOLIO alignments
   * @param teamId - The team ID to start the lookup
   * @returns Array of portfolio alignments
   */
  getPortfolioAlignments(teamId: string): Alignment[] {
    // Step 1: Get PDT info using TEAMTOPDT
    const pdtAlignments = this.getAlignment('TEAMTOPDT', teamId);

    if (pdtAlignments.length === 0) {
      return [];
    }

    // Step 2: Use PDT ID to get portfolio alignments
    const pdtId = pdtAlignments[0].alignToId;
    const portfolioAlignments = this.mockAlignmentData.TRAINTOPORTFOLIO.filter(
      (alignment) => alignment.alignFromId === pdtId
    );

    return portfolioAlignments;
  }

  /**
   * Legacy method for backwards compatibility - now uses the new getAlignment method
   * @deprecated Use getAlignment or getPortfolioAlignments instead
   */
  getAlignments(nodeType: string, teamStructureData: any): Alignment[] {
    // Handle array of portfolios
    if (Array.isArray(teamStructureData)) {
      const firstPortfolio = teamStructureData[0];
      const team = firstPortfolio.children?.[0]?.children?.[0];
      const teamId = team?.teamId?.toString() || '301';

      if (nodeType === 'Portfolio') {
        return this.getPortfolioAlignments(teamId);
      }

      if (nodeType === 'PDT') {
        return this.getAlignment('TEAMTOTRAIN', teamId);
      }

      if (nodeType === 'Team') {
        return this.getAlignment('TEAMTOPDT', teamId);
      }

      // Contributor nodes: AIT, Team Backlog, SPK, Jira Board
      const alignmentTypeMap: { [key: string]: AlignmentType } = {
        AIT: 'TEAMTOAIT',
        'Team Backlog': 'TEAMTOTPK',
        SPK: 'TEAMTOSPK',
        'Jira Board': 'TEAMTOJIRABOARD',
      };

      const alignmentType = alignmentTypeMap[nodeType];
      if (alignmentType) {
        return this.getAlignment(alignmentType, teamId);
      }

      return [];
    }

    // Legacy handling for single portfolio object (backwards compatibility)
    const team = teamStructureData.children?.[0]?.children?.[0];
    const teamId = team?.teamId?.toString() || '301';

    if (nodeType === 'Portfolio') {
      return this.getPortfolioAlignments(teamId);
    }

    if (nodeType === 'PDT') {
      return this.getAlignment('TEAMTOTRAIN', teamId);
    }

    if (nodeType === 'Team') {
      return this.getAlignment('TEAMTOPDT', teamId);
    }

    // Contributor nodes
    const alignmentTypeMap: { [key: string]: AlignmentType } = {
      AIT: 'TEAMTOAIT',
      'Team Backlog': 'TEAMTOTPK',
      SPK: 'TEAMTOSPK',
      'Jira Board': 'TEAMTOJIRABOARD',
    };

    const alignmentType = alignmentTypeMap[nodeType];
    if (alignmentType) {
      return this.getAlignment(alignmentType, teamId);
    }

    return [];
  }

  /**
   * Get team details by team ID
   * @param teamId - The team ID to retrieve details for
   * @returns Team object with teamId, teamName, and teamType
   */
  getTeamAlignment(teamId: string): Team {
    // Mock team data - in real implementation this would come from an API
    const mockTeamData: { [key: string]: Team } = {
      '301': {
        teamId: '301',
        teamName: 'Mobile Apps',
        teamType: 'Development',
      },
      '302': {
        teamId: '302',
        teamName: 'Web Platform',
        teamType: 'Development',
      },
      '303': {
        teamId: '303',
        teamName: 'Data Analytics',
        teamType: 'Analytics',
      },
    };

    return (
      mockTeamData[teamId] || {
        teamId: teamId,
        teamName: 'Unknown Team',
        teamType: 'Unknown',
      }
    );
  }
}
