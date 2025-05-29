import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamStructureComponent } from './team-structure.component';
import { TeamStructureService } from './team-structure.service';
import { GridModule } from '@progress/kendo-angular-grid';
import { AlignmentModule } from '../shared/alignment';
import { MatIconModule } from '@angular/material/icon';
import { TeamTableComponent } from './team-table/team-table.component';

@NgModule({
  declarations: [TeamStructureComponent, TeamTableComponent],
  imports: [
    CommonModule,
    FormsModule,
    GridModule,
    AlignmentModule,
    MatIconModule,
  ],
  exports: [TeamStructureComponent],
  providers: [TeamStructureService],
})
export class TeamStructureModule {}
