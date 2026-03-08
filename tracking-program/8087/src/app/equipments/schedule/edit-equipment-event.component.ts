import {Component, OnInit} from '@angular/core';
import {EquipmentEventService} from "./equipment-event.service";
import {ActivatedRoute} from "@angular/router";
import {ConfirmationService} from "primeng/primeng";

@Component({
  templateUrl: './edit-equipment-event.component.html',
  styles: [`
    .cancelled *, .cancelled {
      color: #bdbdbd !important;
    }
    span.pending {
      color: #9e9e9e;
    }
    .cancelled {
      color: #ed6b75;
    }
    .accepted {
      color: #26c49d;
    }
  `]
})
export class EditEquipmentEventComponent implements OnInit {

  private eventId;
  private event;
  private cancelled = false;

  constructor(private equipmentEventService: EquipmentEventService, private route: ActivatedRoute, private confirmationService: ConfirmationService) {
    this.eventId = route.snapshot.params['id'];
  }

  ngOnInit() {

    this.equipmentEventService.get(this.eventId).subscribe(event => {
      this.event = event.response;
      this.cancelled = this.event.isCancelled;
    })
  }

  confirmCancel() {
    this.confirmationService.confirm({
      header: 'Confirm Delete',
      message: 'Are you sure that you want to cancel this event?',
      accept: () => {
        this.cancelEvent();
      }
    });
  }

  cancelEvent() {
    this.equipmentEventService.remove(this.eventId).subscribe(response => {
      this.cancelled = true;
    })
  }

}
