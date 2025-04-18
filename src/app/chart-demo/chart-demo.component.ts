import { Component, OnInit } from '@angular/core';
import { NgxEchartsModule } from 'ngx-echarts';
import { ECHARTS_CONFIG } from '../app.config';
import type { EChartsOption } from 'echarts';

@Component({
  selector: 'app-chart-demo',
  standalone: true,
  imports: [NgxEchartsModule],
  template: `
    <div class="chart-container">
      <h2>World Map - Country Information</h2>
      <div echarts [options]="chartOptions" class="demo-chart"></div>
    </div>
  `,
  styles: [
    `
      .chart-container {
        padding: 20px;
      }
      .demo-chart {
        height: 600px;
        width: 100%;
      }
    `,
  ],
})
export class ChartDemoComponent implements OnInit {
  chartOptions: EChartsOption = {};

  ngOnInit() {
    this.chartOptions = {
      backgroundColor: '#fff',
      title: {
        text: 'World Population Distribution',
        left: 'center',
        top: '20px',
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}',
      },
      visualMap: {
        min: 0,
        max: 1000000000,
        text: ['High', 'Low'],
        realtime: false,
        calculable: true,
        inRange: {
          color: ['lightskyblue', 'yellow', 'orangered'],
        },
      },
      series: [
        {
          name: 'World Population',
          type: 'map',
          map: 'world',
          roam: true,
          emphasis: {
            label: {
              show: true,
            },
          },
          data: [
            { name: 'China', value: 1425887337 },
            { name: 'India', value: 1417173173 },
            { name: 'United States', value: 338289857 },
            { name: 'Indonesia', value: 275501339 },
            { name: 'Pakistan', value: 235824862 },
            { name: 'Nigeria', value: 218541212 },
            { name: 'Brazil', value: 214326223 },
            { name: 'Bangladesh', value: 171186372 },
            { name: 'Russia', value: 144713314 },
            { name: 'Mexico', value: 130207371 },
            { name: 'Japan', value: 125584838 },
            { name: 'Ethiopia', value: 117876227 },
            { name: 'Philippines', value: 115559009 },
            { name: 'Egypt', value: 104258327 },
            { name: 'Vietnam', value: 98186856 },
            { name: 'DR Congo', value: 95894118 },
            { name: 'Turkey', value: 85341241 },
            { name: 'Iran', value: 85341241 },
            { name: 'Germany', value: 83783942 },
            { name: 'Thailand', value: 69950850 },
          ],
        },
      ],
    };
  }
}
