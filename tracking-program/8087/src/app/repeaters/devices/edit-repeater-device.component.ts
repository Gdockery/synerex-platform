import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import {RepeaterService} from "./repeater-device.service";
import {CurrentUserService} from "../../shared/user/currentUser.service";

@Component({
  templateUrl: './edit-repeater-device.component.html',
})
export class EditRepeaterComponent implements OnInit {

  // Syncing states
  private syncingDevice:boolean;
  private syncingSubmit:boolean;
  private retiringDevice:boolean;

  // Our device data
  private selectedDeviceId;
  private device;
  private newDeviceId;

  // When this is enabled, the rename form is not shown.
  private isNameFormHidden = true;
  private isNetworkFormHidden = true;

  // Forms
  private nameForm;
  private networkForm;

  constructor( private route: ActivatedRoute, private formBuilder: FormBuilder, protected repeaterService: RepeaterService, private userService: CurrentUserService) {
    this.selectedDeviceId = route.snapshot.params['id'];
  }

  ngOnInit() {

    this.device = {};

    // Initialize rename form:
    this.nameForm = this.formBuilder.group({
      name: [{value: '', disabled: this.syncingSubmit}, [Validators.required]]
    });

    this.networkForm = this.formBuilder.group({
      deviceId: [{value: '', disabled: this.syncingSubmit}, [Validators.required, Validators.pattern('^([A-F0-9]{2}:){5}[A-F0-9]{2}$')]],
    });

    this.fetch();
  }

  fetch() {
    this.syncingDevice = true;

    this.repeaterService.get(this.selectedDeviceId).subscribe(responseData =>{
      this.device = responseData.response;
      // Update form data
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
    this.repeaterService.update(this.selectedDeviceId, {valuesToSet: formData}).subscribe(responseData =>{
        // Clear loading state
        this.syncingSubmit = false;

        // Update name in the UI.
        this.device.name = formData.name;
        this.cancelChangeNameForm();
    }, error => {this.syncingSubmit = false;});
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
    this.repeaterService.update(this.selectedDeviceId, {valuesToSet: formData}).subscribe(responseData =>{
      // Clear loading state
      this.syncingSubmit = false;
      // Update name in the UI.
      this.device.deviceId = formData.deviceId;
      this.cancelChangeNetworkForm();
    }, error => {
      if(error.code == 409) {
        alert('Repeater serial number already in use.');
      }
      this.syncingSubmit = false;
    });
  }

  clickDeleteDeviceButton() {
    if(this.syncingSubmit || this.retiringDevice || this.device.isDeleted) { return; }

    // Reset name form
    this.cancelChangeNameForm();

    if(window.confirm('Are you sure you want to retire this repeater?')) {
      this.retiringDevice = true;

      this.repeaterService.remove(this.selectedDeviceId).subscribe(responseData =>{
          this.retiringDevice = false;

          // Update the user's `isDeleted` status in the UI
          this.device.isDeleted = true;
      }, error => {this.retiringDevice = false;});
    }
  }

}

