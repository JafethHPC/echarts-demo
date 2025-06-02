import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent {
  // Tab selection state
  public activeTab: 'world-map' | 'team-structure' | 'pdt-structure' =
    'team-structure';

  /**
   * Sets the active tab and resets any component state as needed
   */
  public setActiveTab(
    tab: 'world-map' | 'team-structure' | 'pdt-structure'
  ): void {
    this.activeTab = tab;
  }
}
