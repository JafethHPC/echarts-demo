import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgxEchartsModule } from 'ngx-echarts';
import { MatIconModule } from '@angular/material/icon';

import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { TeamStructureModule } from './team-structure/team-structure.module';
import { TeamDemographicsModule } from './team-demographics/team-demographics.module';
import { PdtStructureModule } from './pdt-structure/pdt-structure.module';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    RouterModule.forRoot(routes),
    FormsModule,
    MatIconModule,
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts'),
    }),
    TeamStructureModule,
    TeamDemographicsModule,
    PdtStructureModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
