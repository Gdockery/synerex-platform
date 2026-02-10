import {Component, OnInit} from '@angular/core';
import {SwitchEventService} from "./switch-event.service";
import {ActivatedRoute} from "@angular/router";
import {ConfirmationService} from "primeng/primeng";

@Component({
  templateUrl: 'edit-switch-event.component.html',
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
export class EditSwitchEventComponent implements OnInit {

  private eventId;
  private event;
  private cancelled = false;

  constructor(private switchEventService: SwitchEventService, private route: ActivatedRoute, private confirmationService: ConfirmationService) {
    this.eventId = route.snapshot.params['id'];
  }

  ngOnInit() {
    this.switchEventService.get(this.eventId).subscribe(event => {
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
    this.switchEventService.remove(this.eventId).subscribe(response => {
      this.cancelled = true;
    })
  }

}
