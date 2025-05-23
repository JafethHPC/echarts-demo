import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridModule } from '@progress/kendo-angular-grid';
import { MatIconModule } from '@angular/material/icon';
import { AlignmentComponent } from './alignment.component';

@NgModule({
  declarations: [AlignmentComponent],
  imports: [CommonModule, GridModule, MatIconModule],
  exports: [AlignmentComponent],
})
export class AlignmentModule {}
