import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TeamStructureService {
  getTeamStructureData() {
    return [
      {
        portfolioId: 101,
        portfolioName: 'Digital Transformation & Innovation Portfolio',
        portfolioTechMgr: 'Sarah Johnson',
        pdtCount: 2,
        teamCount: 4,
        productCount: 3,
        children: [
          {
            pdtid: 201,
            pdtname: 'Customer Experience',
            pdtTechMgr: 'David Rodriguez',
            teamCount: 2,
            productCount: 3,
            children: [
              {
                teamId: 301,
                teamName: 'Mobile Apps',
                type: 'Feature',
                methodology: 'Scrum',
                teamTechmgr: 'Emily Chen',
                teamPOC: 'John Smith',
                children: [
                  { name: 'AIT', count: 5 },
                  { name: 'Team Backlog', count: 32 },
                  { name: 'SPK', count: 3 },
                  { name: 'Jira Board', count: 0 },
                ],
              },
            ],
          },
        ],
      },
      {
        portfolioId: 102,
        portfolioName: 'Enterprise Solutions Portfolio',
        portfolioTechMgr: 'Michael Brown',
        pdtCount: 2,
        teamCount: 4,
        productCount: 3,
        children: [
          {
            pdtid: 201,
            pdtname: 'Customer Experience',
            pdtTechMgr: 'David Rodriguez',
            teamCount: 2,
            productCount: 3,
            children: [
              {
                teamId: 301,
                teamName: 'Mobile Apps',
                type: 'Feature',
                methodology: 'Scrum',
                teamTechmgr: 'Emily Chen',
                teamPOC: 'John Smith',
                children: [
                  { name: 'AIT', count: 5 },
                  { name: 'Team Backlog', count: 32 },
                  { name: 'SPK', count: 3 },
                  { name: 'Jira Board', count: 0 },
                ],
              },
            ],
          },
        ],
      },
    ];
  }
}
