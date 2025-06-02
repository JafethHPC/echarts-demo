import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PdtStructureComponent } from './pdt-structure.component';
import { PdtStructureService } from './pdt-structure.service';
import { GridModule } from '@progress/kendo-angular-grid';
import { AlignmentModule } from '../shared/alignment';
import { MatIconModule } from '@angular/material/icon';
import { PdtTableComponent } from './pdt-table/pdt-table.component';

@NgModule({
  declarations: [PdtStructureComponent, PdtTableComponent],
  imports: [
    CommonModule,
    FormsModule,
    GridModule,
    AlignmentModule,
    MatIconModule,
  ],
  exports: [PdtStructureComponent],
  providers: [PdtStructureService],
})
export class PdtStructureModule {}
