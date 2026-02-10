import {Component, OnInit} from '@angular/core';
import {CsvDataTypesService} from "./csvDataType.service";
import {CsvDataService} from "./csvData.service";

@Component({
  templateUrl: 'csvData.component.html',
})
export class CsvDataComponent implements OnInit {

  protected type = 0;
  protected modelObserver;
  public csvData;

  constructor(private typeService: CsvDataTypesService, private csvDataService: CsvDataService) {}

  ngOnInit() {
    this.csvDataService.loadModels();
    this.modelObserver = this.csvDataService.getModelObserver();
    this.modelObserver.subscribe(models => {
      this.typeService.updateCounts(models);
    });
  }

  selectType(type) {
    this.type = type;
  }

  refresh() {
    this.csvDataService.getModelObserver().subscribe(data => {
      this.csvData = data;
    });
  }
}
