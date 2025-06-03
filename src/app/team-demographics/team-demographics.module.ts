import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxEchartsModule } from 'ngx-echarts';
import { TeamDemographicsComponent } from './team-demographics.component';
import { TeamDemographicsService } from './team-demographics.service';

@NgModule({
  declarations: [TeamDemographicsComponent],
  imports: [CommonModule, FormsModule, NgxEchartsModule.forChild()],
  exports: [TeamDemographicsComponent],
  providers: [TeamDemographicsService],
})
export class TeamDemographicsModule {}
