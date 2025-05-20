import { Injectable } from '@angular/core';

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

@Injectable({ providedIn: 'root' })
export class AlignmentService {
  /**
   * Returns alignment data for the given node type and team structure data.
   * This ensures the table matches the chart's counts.
   */
  getAlignments(nodeType: string, teamStructureData: any): Alignment[] {
    // Portfolio, PDT, Team: always 1 row
    if (nodeType === 'Portfolio') {
      return [
        {
          alignFromId:
            teamStructureData.children[0].children[0].teamId.toString(),
          alignFromName: teamStructureData.children[0].children[0].teamName,
          alignToActive: 1,
          alignToId: teamStructureData.portfolioId.toString(),
          alignToName: teamStructureData.portfolioName,
          alignmentActive: 1,
          alignmentId: `align-${teamStructureData.portfolioId}`,
          alignmentType: 'Portfolio',
          horizon: '',
          jiraInstance: '',
          memberAlignment: '',
          projectUrl: '',
          techManagerName: teamStructureData.portfolioTechMgr,
          techManagerNbk: '',
        },
      ];
    }
    if (nodeType === 'PDT') {
      return [
        {
          alignFromId: teamStructureData.portfolioId.toString(),
          alignFromName: teamStructureData.portfolioName,
          alignToActive: 1,
          alignToId: teamStructureData.children[0].pdtid.toString(),
          alignToName: teamStructureData.children[0].pdtname,
          alignmentActive: 1,
          alignmentId: `align-${teamStructureData.children[0].pdtid}`,
          alignmentType: 'PDT',
          horizon: '',
          jiraInstance: '',
          memberAlignment: '',
          projectUrl: '',
          techManagerName: teamStructureData.children[0].pdtTechMgr,
          techManagerNbk: '',
        },
      ];
    }
    if (nodeType === 'Team') {
      return [
        {
          alignFromId: teamStructureData.children[0].pdtid.toString(),
          alignFromName: teamStructureData.children[0].pdtname,
          alignToActive: 1,
          alignToId:
            teamStructureData.children[0].children[0].teamId.toString(),
          alignToName: teamStructureData.children[0].children[0].teamName,
          alignmentActive: 1,
          alignmentId: `align-${teamStructureData.children[0].children[0].teamId}`,
          alignmentType: 'Team',
          horizon: '',
          jiraInstance: '',
          memberAlignment: '',
          projectUrl: '',
          techManagerName:
            teamStructureData.children[0].children[0].teamTechmgr,
          techManagerNbk: '',
        },
      ];
    }

    // Contributor nodes: AIT, Team Backlog, SPK, Jira Board
    const team = teamStructureData.children[0].children[0];
    if (!team || !team.children) return [];
    const node = team.children.find((c: any) => c.name === nodeType);
    if (!node || !node.count || node.count === 0) return [];
    // Generate dummy rows for the count
    return Array.from({ length: node.count }).map((_, i) => {
      return {
        alignFromId: team.teamId.toString(),
        alignFromName: team.teamName,
        alignToActive: 1,
        alignToId: `${nodeType.toUpperCase()}-${i + 1}`,
        alignToName: `${nodeType} ${i + 1}`,
        alignmentActive: 1,
        alignmentId: `align-${team.teamId}-${nodeType}-${i + 1}`,
        alignmentType: nodeType,
        horizon: '',
        jiraInstance:
          nodeType === 'Jira Board' ||
          nodeType === 'Team Backlog' ||
          nodeType === 'SPK'
            ? i % 2 === 0
              ? 'cloud'
              : 'server'
            : '',
        memberAlignment: '',
        projectUrl: '',
        techManagerName: '',
        techManagerNbk: '',
      };
    });
  }
}
