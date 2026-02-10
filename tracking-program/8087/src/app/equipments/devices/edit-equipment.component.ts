import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {EquipmentsService} from "../equipments.service";
import {ConfirmationService} from "primeng/primeng";
import {CurrentUserService} from "../../shared/user/currentUser.service";

@Component({
  templateUrl: 'edit-equipment.component.html',
  styles: [`
    h3 {
      margin: 0;
    }
    .retired *, .retired {
      color: #bdbdbd;
    }
  `]
})
export class EditEquipmentComponent implements OnInit {

  private switchId;
  public switch;

  public renaming = false;
  public changingNetwork = false;
  public changingDetail = false;
  public newDeviceId;
  public newName;
  public newAmpLoad;
  public newVoltage;
  public newPf;
  public newOriginalHours;
  public savings;

  public retired = false;

  constructor(private route: ActivatedRoute, private equipmentsService: EquipmentsService, private confirmationService: ConfirmationService, private userService: CurrentUserService) {
    this.switchId = route.snapshot.params['id'];
  }

  ngOnInit() {
    this.equipmentsService.get(this.switchId).subscribe((switchModel:any) => {
      this.switch = switchModel.response;
      if (this.switch.hasSchedule) {
        this.equipmentsService.getEquipmentSavings({project: this.userService.user.selectedProject.id, switch: this.switchId}).subscribe(data => {
          this.savings = data.response;
        });
      }
    });
  }

  update(params) {
    this.equipmentsService.update(this.switchId, {valuesToSet: params}).subscribe(response => {
      this.switch.deviceId = this.newDeviceId;
      this.renaming = false;
      this.changingNetwork = false;
      this.changingDetail = false;
    }, error => {
      if(error.code == 409) {
        alert('Switch serial number already in use.');
      }
    })
  }

  startChangeDeviceId() {
    this.newDeviceId = this.switch.deviceId;
    this.changingNetwork = true;
  }

  startChangeName() {
    this.newName = this.switch.name;
    this.renaming = true;
  }

  changeEquipmentDetail() {
    this.changingDetail = true;
    this.newAmpLoad = this.switch.ampLoad;
    this.newVoltage = this.switch.voltage;
    this.newPf = this.switch.pf;
    this.newOriginalHours = this.switch.originalHours;
  }

  confirmRetire() {
    this.confirmationService.confirm({
      header: 'Confirm Delete',
      message: 'Are you sure that you want to cancel this event?',
      accept: () => {
        this.equipmentsService.remove(this.switchId).subscribe(response => {
          this.retired = true;
          this.renaming = false;
          this.changingNetwork = false;
        })
      }
    });
  }

}
