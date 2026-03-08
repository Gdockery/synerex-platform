import {Component, Input, OnInit} from '@angular/core';
import {CsvDataService} from "../csvData.service";
import {WindowRef} from "../../../shared/windowRef.component";

@Component({
  selector: 'sd-list-csv',
  templateUrl: './list-csv.component.html'
})
export class ListCsvComponent implements OnInit{
  @Input() public currentType;
  @Input() public csvData;

  constructor(private csvDataService: CsvDataService) {}

  ngOnInit() {
    this.csvDataService.getModelObserver().subscribe(data => {
      this.csvData = data;
    });
  }
}
