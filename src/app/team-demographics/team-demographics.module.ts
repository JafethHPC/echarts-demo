import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxEchartsModule } from 'ngx-echarts';
import { TeamDemographicsComponent } from './team-demographics.component';
import { TeamDemographicsService } from './team-demographics.service';
import { GeocodingService } from './services/geocoding.service';
import { LocationCacheService } from './services/location-cache.service';

@NgModule({
  declarations: [TeamDemographicsComponent],
  imports: [CommonModule, FormsModule, NgxEchartsModule.forChild()],
  exports: [TeamDemographicsComponent],
  providers: [TeamDemographicsService, GeocodingService, LocationCacheService],
})
export class TeamDemographicsModule {}
