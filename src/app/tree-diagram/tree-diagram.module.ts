import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TreeDiagramComponent } from './tree-diagram.component';
import { TreeTableComponent } from './tree-table/tree-table.component';

@NgModule({
  declarations: [TreeDiagramComponent, TreeTableComponent],
  imports: [CommonModule, FormsModule],
  exports: [TreeDiagramComponent],
})
export class TreeDiagramModule {}
