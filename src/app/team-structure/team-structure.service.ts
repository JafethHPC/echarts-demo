import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TeamStructureService {
  getTeamStructureData() {
    return {
      PortfolioId: 'P001',
      PortfolioName: 'Enterprise Solutions',
      PortfolioManager: 'John Doe',
      TrainId: 'T001',
      TrainName: 'Core Development',
      PDTManager: 'Jane Smith',
      TeamId: 'TEAM01',
      TeamName: 'Dev Squad',
      TeamType: 'Feature',
      Methodology: 'Agile',
      TeamManager: 'Alice Johnson',
      AITCount: 3,
      SPKCount: 2,
      TPKCount: 1,
      JiraBoardCount: 0,
    };
  }
}
