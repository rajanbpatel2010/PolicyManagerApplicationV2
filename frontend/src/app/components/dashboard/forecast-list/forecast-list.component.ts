import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { PolicyForecast } from '../../../models/models';
import { InrCurrencyPipe } from '../../../pipes/pipes';

interface ColumnConfig {
  label: string;
  field: keyof PolicyForecast;
  visible: boolean;
  isCurrency?: boolean;
  isDate?: boolean;
}

interface GroupedData {
  groupValue: any;
  items: PolicyForecast[];
  summary: number;
  isCollapsed?: boolean;
}

@Component({
  selector: 'app-forecast-list',
  standalone: true,
  imports: [CommonModule, InrCurrencyPipe, FormsModule, DragDropModule],
  templateUrl: './forecast-list.component.html',
  styleUrl: './forecast-list.component.css'
})
export class ForecastListComponent implements OnChanges {
  @Input() forecasts: PolicyForecast[] = [];
  @Input() selectedMonth: string | null = null;

  showColumnSelector = false;
  groupByField: keyof PolicyForecast | null = null;
  groupedData: GroupedData[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['forecasts']) {
      this.groupItems();
    }
  }

  getCurrencyValue(item: PolicyForecast, field: keyof PolicyForecast): number | null | undefined {
    const val = item[field];
    return typeof val === 'number' ? val : null;
  }

  getDateValue(item: PolicyForecast, field: keyof PolicyForecast): string | Date | null | undefined {
    const val = item[field];
    return typeof val === 'string' ? val : null;
  }

  onDrop(event: CdkDragDrop<string[]>) {
    // This is for dragging a column header into the grouping zone
    const field = event.item.data as keyof PolicyForecast;
    this.groupBy(field);
  }

  groupBy(field: keyof PolicyForecast | null) {
    this.groupByField = field;
    this.groupItems();
  }

  toggleGroup(group: GroupedData) {
    group.isCollapsed = !group.isCollapsed;
  }

  private groupItems() {
    if (!this.groupByField) {
      this.groupedData = [];
      return;
    }

    const groups = new Map<any, PolicyForecast[]>();
    this.forecasts.forEach(item => {
      const val = item[this.groupByField!] || 'N/A';
      if (!groups.has(val)) {
        groups.set(val, []);
      }
      groups.get(val)!.push(item);
    });

    this.groupedData = Array.from(groups.entries()).map(([value, items]) => ({
      groupValue: value,
      items: items,
      summary: items.reduce((sum, item) => sum + (item.installmentAmount || 0), 0),
      isCollapsed: false
    }));
  }

  columns: ColumnConfig[] = [
    { label: 'Policy Holder', field: 'policyName', visible: true },
    { label: 'Policy Number', field: 'policyNumber', visible: true },
    { label: 'Family Member', field: 'memberName', visible: true },
    { label: 'Installment', field: 'installmentAmount', visible: true, isCurrency: true },
    { label: 'Due Date', field: 'nextInstallmentDate', visible: true, isDate: true },
    { label: 'Type', field: 'policyType', visible: true },
    { label: 'Age at Inception', field: 'ageAtInception', visible: false },
    { label: 'Company', field: 'companyName', visible: false },
    { label: 'Product', field: 'productName', visible: false },
    { label: 'Status', field: 'status', visible: false },
    { label: 'Agent', field: 'agentName', visible: false }
  ];

  get visibleColumns() {
    return this.columns.filter(c => c.visible);
  }

  toggleSelector() {
    this.showColumnSelector = !this.showColumnSelector;
  }

  exportToCsv(): void {
    if (this.forecasts.length === 0) return;

    const activeCols = this.visibleColumns;
    const headers = activeCols.map(c => c.label);
    
    const rows = this.forecasts.map(f => {
      return activeCols.map(c => {
        const val = f[c.field];
        if (c.isDate && val) return new Date(val as string).toLocaleDateString();
        return val ?? 'N/A';
      });
    });

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const fileName = this.selectedMonth 
      ? `Family_Budget_Forecast_${this.selectedMonth.replace(' ', '_')}.csv`
      : `Family_Budget_Forecast_All.csv`;
      
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
