import { Injectable } from '@angular/core';

var json2csv = require('json2csv');

@Injectable()
export class CsvExportService {

  downloadCsv(data, fields = null, filename = 'file.csv') {
    if(!fields) {
      fields = this.getProperties(data[0]);
    }
    var hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(json2csv({data:data, fields:fields}));
    hiddenElement.target = '_blank';
    hiddenElement.download = filename;
    hiddenElement.click();
  }

  getProperties(data) {
    let properties = [];
    for (var name in data) {
      if (data.hasOwnProperty(name)) {
        properties.push(name);
      }
    }
    return properties;
  }
}
