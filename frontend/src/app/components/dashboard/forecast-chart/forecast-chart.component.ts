import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MonthlyForecast } from '../../../models/models';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-forecast-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass-card chart-container mt-lg">
      <h4 class="section-title">
        <span class="material-icons-round">analytics</span>
        Premium Payment Forecast (FY)
      </h4>
      <div class="canvas-wrapper">
        <canvas #forecastCanvas></canvas>
      </div>
    </div>
  `,
  styles: [`
    .chart-container {
      padding: 2rem;
      min-height: 400px;
    }
    .canvas-wrapper {
      position: relative;
      height: 300px;
      width: 100%;
    }
  `]
})
export class ForecastChartComponent implements OnChanges, AfterViewInit {
  @Input() forecasts: MonthlyForecast[] = [];
  @Output() monthSelected = new EventEmitter<string | null>();
  @ViewChild('forecastCanvas') forecastCanvas!: ElementRef<HTMLCanvasElement>;
  
  private chart?: Chart;

  ngAfterViewInit(): void {
    this.createChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['forecasts'] && !changes['forecasts'].firstChange) {
      this.updateChart();
    }
  }

  private createChart(): void {
    if (!this.forecastCanvas) return;

    const ctx = this.forecastCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: this.forecasts.map(f => f.month),
        datasets: [{
          label: 'Premium Amount (₹)',
          data: this.forecasts.map(f => f.totalAmount),
          backgroundColor: (context: any) => {
            const chart = context.chart;
            const {ctx, chartArea} = chart;
            if (!chartArea) return 'rgba(99, 102, 241, 0.5)';
            const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
            gradient.addColorStop(0, 'rgba(129, 140, 248, 0.2)');
            gradient.addColorStop(1, 'rgba(129, 140, 248, 0.8)');
            return gradient;
          },
          borderColor: '#818cf8',
          borderWidth: 2,
          borderRadius: 8,
          hoverBackgroundColor: '#818cf8',
          hoverBorderColor: '#fff',
          hoverBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (event, elements) => {
          if (elements.length > 0) {
            const index = elements[0].index;
            const label = this.chart?.data.labels?.[index] as string;
            this.monthSelected.emit(label);
          } else {
            this.monthSelected.emit(null);
          }
        },
        onHover: (event, elements) => {
          const target = event.native?.target as HTMLElement;
          if (target) {
            target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleColor: '#fff',
            bodyColor: '#fff',
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const val = context.parsed.y;
                return val !== null ? ` ₹${val.toLocaleString('en-IN')}` : '';
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94a3b8', font: { size: 11 } }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#94a3b8', font: { size: 11 } }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  private updateChart(): void {
    if (!this.chart) return;
    this.chart.data.labels = this.forecasts.map(f => f.month);
    this.chart.data.datasets[0].data = this.forecasts.map(f => f.totalAmount);
    this.chart.update();
  }
}
