import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/team-demographics',
    pathMatch: 'full',
  },
  {
    path: 'team-demographics',
    loadComponent: () =>
      import('./team-demographics/team-demographics.component').then(
        (m) => m.TeamDemographicsComponent
      ),
  },
  {
    path: 'team-structure',
    loadComponent: () =>
      import('./team-structure/team-structure.component').then(
        (m) => m.TeamStructureComponent
      ),
  },
];
