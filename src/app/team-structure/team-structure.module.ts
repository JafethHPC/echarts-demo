import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamStructureComponent } from './team-structure.component';
import { TeamStructureService } from './team-structure.service';

@NgModule({
  declarations: [TeamStructureComponent],
  imports: [CommonModule, FormsModule],
  exports: [TeamStructureComponent],
  providers: [TeamStructureService],
})
export class TeamStructureModule {}
