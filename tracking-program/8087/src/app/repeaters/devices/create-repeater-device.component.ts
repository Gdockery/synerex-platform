import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { CurrentUserService } from '../../shared/user/currentUser.service';
import {RepeaterService} from "./repeater-device.service";

@Component({
  templateUrl: 'create-repeater-device.component.html',
})
export class CreateRepeaterComponent implements OnInit {

  // Syncing state
  private syncingSubmit:boolean;

  // Form
  private form;

  constructor( private formBuilder: FormBuilder, private router: Router, private currentUserService: CurrentUserService, private repeaterService: RepeaterService) {}

  ngOnInit() {

    // Initialize form:
    this.form = this.formBuilder.group({
      deviceId: [{value: '', disabled: this.syncingSubmit}, [Validators.required, Validators.pattern('^([A-F0-9]{2}:){5}[A-F0-9]{2}$')]],
      name: [{value: '', disabled: this.syncingSubmit}, [Validators.required]],
    });

  }

  submitCreateRepeaterForm() {
    for (let i in this.form.controls) {
      this.form.controls[i].markAsDirty();
    }

    // If client-side validation fails, don't even try to send it to the cloud.
    if(!this.form.valid) { return; }

    this.syncingSubmit = true;
    var formData = this.form.value;
    formData.project = this.currentUserService.user.selectedProject.id;
    this.repeaterService.create({valuesToSet: formData}).subscribe(responseData =>{
      this.syncingSubmit = false;
      this.router.navigate(['/repeaters/devices']);
    }, error => {
      if(error.code == 409) {
        alert('Repeater serial number already in use.');
      }
      this.syncingSubmit = false
    });
  }

}
