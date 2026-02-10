import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, Validators } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import {GatewayService} from "./gateway-device.service";
import {ConfirmationService} from "primeng/primeng";

@Component({
  templateUrl: 'edit-gateway-device.component.html',
  styles: [`
    .retired *, .retired {
      color: #bdbdbd;
    }
  `]
})
export class EditGatewayComponent implements OnInit {

  // Syncing states
  private syncingDevice:boolean;
  private syncingSubmit:boolean;
  private retiringDevice:boolean;

  // Our device data
  private selectedDeviceId;
  private device;

  // When this is enabled, the rename form is not shown.
  private isNameFormHidden = true;
  private isNetworkFormHidden = true;

  // Forms
  private nameForm;
  private networkForm;

  constructor( private route: ActivatedRoute, private formBuilder: FormBuilder, protected gatewayService: GatewayService, private confirmationService: ConfirmationService) {
    this.selectedDeviceId = route.snapshot.params['id'];
  }

  ngOnInit() {

    this.device = {};

    // Initialize rename form:
    this.nameForm = this.formBuilder.group({
      name: [{value: '', disabled: this.syncingSubmit}, [Validators.required]],
    });

    this.networkForm = this.formBuilder.group({
      deviceId: [{value: '', disabled: this.syncingSubmit}, [Validators.required, Validators.pattern('^([A-F0-9]{2}:){5}[A-F0-9]{2}$')]],
    });

    this.fetch();
  }

  fetch() {
    this.syncingDevice = true;

    this.gatewayService.get(this.selectedDeviceId).subscribe(responseData => {
      this.syncingDevice = false;
      this.device = responseData.response;
      this.nameForm.patchValue({name: this.device.name});
      this.networkForm.patchValue({deviceId: this.device.deviceId});
    });
  }

  enableChangeNameForm() {
    if(this.syncingSubmit || this.retiringDevice) { return; }
    this.isNameFormHidden = false;
  }

  cancelChangeNameForm() {
    if(this.syncingSubmit) { return; }
    // Reset form
    this.nameForm.patchValue({name: this.device.name});
    this.isNameFormHidden = true;
  }

  submitChangeNameForm() {
    if(this.syncingSubmit) { return; }

    for (let i in this.nameForm.controls) {
      this.nameForm.controls[i].markAsDirty();
    }


    // Set loading state
    this.syncingSubmit = true;
    // Harvest form values & submit
    var formData = this.nameForm.value;

    this.gatewayService.update(this.selectedDeviceId, {valuesToSet: formData}).subscribe(responseData => {
      this.syncingSubmit = false;
      this.device.name = formData.name;
      this.cancelChangeNameForm();
    });
  }


  enableChangeNetworkForm() {
    if(this.syncingSubmit || this.retiringDevice) { return; }
    this.isNetworkFormHidden = false;
  }

  cancelChangeNetworkForm() {
    if(this.syncingSubmit) { return; }
    // Reset form
    this.networkForm.patchValue({name: this.device.name});
    this.isNetworkFormHidden = true;
    return false;
  }

  submitChangeNetworkForm() {
    if(this.syncingSubmit) { return; }

    for (let i in this.networkForm.controls) {
      this.networkForm.controls[i].markAsDirty();
    }

    // Set loading state
    this.syncingSubmit = true;
    // Harvest form values & submit
    var formData = this.networkForm.value;
    this.gatewayService.update(this.selectedDeviceId, {valuesToSet: formData}).subscribe(responseData =>{
      // Clear loading state
      this.syncingSubmit = false;
      // Update name in the UI.
      this.device.deviceId = formData.deviceId;
      this.cancelChangeNetworkForm();
    }, error => {
      if(error.code == 409) {
        alert('Gateway serial number already in use.');
      }
      this.syncingSubmit = false;
    });
  }

  clickDeleteDeviceButton() {
    if(this.syncingSubmit || this.retiringDevice || this.device.isDeleted) { return; }

    this.cancelChangeNameForm();

    this.confirmationService.confirm({
      header: 'Confirm Delete',
      message: 'Are you sure that you want to retire this gateway?',
      accept: () => {
        this.retiringDevice = true;
        this.gatewayService.remove(this.selectedDeviceId).subscribe(response => {
          this.retiringDevice = false;
          this.device.isDeleted = true;
        })
      }
    });
  }

}

