import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {RepeaterAlertService} from "../repeater-alert.service";
import {ConfirmationService} from "primeng/primeng";

@Component({
  selector: 'list-repeater-alert',
  templateUrl: './list-repeater-alert.component.html'
})
export class ListRepeaterAlertComponent implements OnInit {
  @Input() public currentType;
  @Output() editAlertEvent = new EventEmitter<any>();

  public alerts;

  constructor(private repeaterAlertService: RepeaterAlertService, private confirmationService: ConfirmationService) {}

  ngOnInit() {
    this.repeaterAlertService.getModelObserver().subscribe(data => {
      this.alerts = data;
    });
  }

  editAlert(alert) {
    let alertModel = this.repeaterAlertService.get(alert.id).subscribe(alertResponse => {
      alertResponse.response.id = alert.id;
      this.editAlertEvent.emit(alertResponse.response);
    });
  }

  confirmDelete(id) {
    this.confirmationService.confirm({
      header: 'Confirm Delete',
      message: 'Are you sure that you want to delete this alert?',
      accept: () => {
        this.repeaterAlertService.remove(id);
      }
    });
  }
}
