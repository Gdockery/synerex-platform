import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import {DeviceService} from "./device.service";
import {CurrentUserService} from "../../shared/user/currentUser.service";
import {PdfLinkService} from "../../shared/pdfLink.service";

@Component({
  templateUrl: './edit-device.component.html',
})
export class EditDeviceComponent implements OnInit {

  // Syncing states
  private syncingDevice:boolean;
  private syncingSubmit:boolean;
  private retiringDevice:boolean;

  // Our device data
  private selectedDeviceId;
  private device;

  // When this is enabled, the rename form is not shown.
  private isNameFormHidden = true;
  // When this is enabled, the mesh ID form is not shown.
  private isDeviceIdFormHidden = true;

  // Forms
  private nameForm;
  private deviceIdForm;
  private links;

  constructor( private route: ActivatedRoute, private formBuilder: FormBuilder, protected meterService: DeviceService, private userService: CurrentUserService, private pdfLinkService: PdfLinkService) {
    this.selectedDeviceId = route.snapshot.params['id'];
  }

  ngOnInit() {

    this.device = {};
    this.pdfLinkService.getLinks(this.selectedDeviceId).subscribe(links => {
        this.links = links; 
    });
    // Initialize rename form:
    this.nameForm = this.formBuilder.group({
      name: [{value: '', disabled: this.syncingSubmit}, [Validators.required]],
    });

    // Initialize rename form:
    this.deviceIdForm = this.formBuilder.group({
      deviceId: [{value: '', disabled: this.syncingSubmit}, [Validators.required, Validators.pattern('^([A-F0-9]{2}:){5}[A-F0-9]{2}$')]],
    });


    this.fetch();
  }

  fetch() {
    this.syncingDevice = true;
    this.meterService.get(this.selectedDeviceId).subscribe(responseData =>{
        this.syncingDevice = false;

        this.device = responseData.response;

        // Update form data
        this.nameForm.patchValue({name: this.device.name});
        this.deviceIdForm.patchValue({deviceId: this.device.deviceId});
    }, error => {this.syncingDevice = false;});
  }

  enableChangeNameForm() {
    if(this.syncingSubmit || this.retiringDevice) { return; }
    // Reset device ID form
    this.cancelChangeDeviceIdForm();
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

    if(!this.nameForm.valid) { return; }

    // Set loading state
    this.syncingSubmit = true;
    // Harvest form values & submit
    var formData = this.nameForm.value;

    this.meterService.update(this.selectedDeviceId, {valuesToSet: formData}).subscribe(responseData =>{
        // Clear loading state
        this.syncingSubmit = false;

        // Update name in the UI.
        this.device.name = formData.name;
        // Hide form
        this.cancelChangeNameForm();
    }, error => {this.cancelChangeNameForm();});
  }

  enableChangeDeviceIdForm() {
    if(this.syncingSubmit || this.retiringDevice) { return; }
    // Reset name form
    this.cancelChangeNameForm();
    // Show mesh form
    this.isDeviceIdFormHidden = false;
  }

  cancelChangeDeviceIdForm() {
    if(this.syncingSubmit) { return; }
    // Reset form
    this.deviceIdForm.patchValue({deviceId: this.device.deviceId});
    this.isDeviceIdFormHidden = true;
  }

  submitChangeDeviceIdForm() {
    if(this.syncingSubmit) { return; }

    for (let i in this.deviceIdForm.controls) {
      this.deviceIdForm.controls[i].markAsDirty();
    }

    if(!this.deviceIdForm.valid) { return; }

    if(window.confirm('Are you sure you want to change the device ID for this meter?')) {

      // Set loading state
      this.syncingSubmit = true;
      // Harvest form values & submit
      var formData = this.deviceIdForm.value;
      this.meterService.update(this.selectedDeviceId, {valuesToSet: formData}).subscribe(responseData =>{
          // Clear loading state
          this.syncingSubmit = false;

          // Update name in the UI.
          this.device.deviceId = formData.deviceId;
          // Hide form
          this.cancelChangeDeviceIdForm();
      }, error => {
        if(error.code == 409) {
          alert('Meter ID already in use.');
        }
        this.cancelChangeDeviceIdForm();
      });//</ io.socket.get() >
    }
    // Otherwise, reset the mesh form.
    else {
      this.cancelChangeDeviceIdForm();
    }
  }

  clickDeleteDeviceButton() {
    if(this.syncingSubmit || this.retiringDevice || this.device.isDeleted) { return; }

    // Reset name form
    this.cancelChangeNameForm();
    // Reset mesh form
    this.cancelChangeDeviceIdForm();

    if(window.confirm('Are you sure you want to retire this meter?')) {
      this.retiringDevice = true;
      this.meterService.remove(this.selectedDeviceId).subscribe(responseData =>{
         this.retiringDevice = false;

          // Update the user's `isDeleted` status in the UI
          this.device.isDeleted = true;
      }, error => {this.retiringDevice = false});
    }
  }

}
