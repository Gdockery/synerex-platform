import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import {GatewayService} from "./gateway-device.service";

@Component({
  templateUrl: './create-gateway-device.component.html',
})
export class CreateGatewayComponent implements OnInit {

  // Form
  private form;

  constructor(private formBuilder: FormBuilder, private router: Router, private gatewayService: GatewayService) {}

  ngOnInit() {

    // Initialize form:
    this.form = this.formBuilder.group({
      deviceId: ['', [Validators.required, Validators.pattern('^([A-F0-9]{2}:){5}[A-F0-9]{2}$')]],
      name: ['', [Validators.required]],
    });

  }

  submitCreateGatewayForm() {
    if(this.form.value.name == '') {
      this.form.patchValue({name: this.form.value.deviceId})
    }

    // If client-side validation fails, don't even try to send it to the cloud.
    if(!this.form.valid) {
      for (let i in this.form.controls) {
        this.form.controls[i].markAsDirty();
      }
      return;
    }

    this.gatewayService.create({valuesToSet: this.form.value}).subscribe(response => {
      this.router.navigate(['gateways']);
    }, error => {
      if(error.code == 409) {
        alert('Gateway serial number already in use.');
      }
    })
  }

}
