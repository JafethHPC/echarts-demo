import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamStructureComponent } from './team-structure.component';
import { TeamStructureService } from './team-structure.service';
import { GridModule } from '@progress/kendo-angular-grid';
import { AlignmentModule } from '../shared/alignment';

@NgModule({
  declarations: [TeamStructureComponent],
  imports: [CommonModule, FormsModule, GridModule, AlignmentModule],
  exports: [TeamStructureComponent],
  providers: [TeamStructureService],
})
export class TeamStructureModule {}
