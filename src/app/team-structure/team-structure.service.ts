import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TeamStructureService {
  getTeamStructureData() {
    return {
      portfolioId: 101,
      portfolioName: 'Digital Transformation',
      portfolioTechMgr: 'Sarah Johnson',
      children: [
        {
          pdtid: 201,
          pdtname: 'Customer Experience',
          pdtTechMgr: 'David Rodriguez',
          children: [
            {
              teamId: 301,
              teamName: 'Mobile Apps',
              type: 'Feature',
              methodology: 'Scrum',
              teamTechmgr: 'Emily Chen',
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
    };
  }
}
