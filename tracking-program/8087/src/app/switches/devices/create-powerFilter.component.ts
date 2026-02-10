import {Component} from '@angular/core';
import {FormBuilder, FormControl, Validators} from "@angular/forms";
import {SwitchesService} from "../switches.service";
import {CurrentUserService} from '../../shared/user/currentUser.service';
import {Router} from "@angular/router";
import {ActivatedRoute} from "@angular/router";
import {DeviceService} from '../../electricityMeters/devices/device.service';

@Component({
  templateUrl: 'create-switch.component.html',
})
export class CreatePowerFilterComponent {

  public form;
  private schDetail = [{}];

  constructor(private formBuilder: FormBuilder, private switchService: SwitchesService, private userService: CurrentUserService, private meterService: DeviceService, private router: Router,  private route: ActivatedRoute) {}

  ngOnInit() {
    this.initializeForm();
  }

  initializeForm() {
    this.form = this.formBuilder.group({
      name: new FormControl('', [Validators.required]),
      deviceId: new FormControl('', [Validators.required, Validators.pattern('^([A-F0-9]{2}:){5}[A-F0-9]{2}$')]),
      deviceType: [3],
    });
  }

  getSwitchSet(switchSet:any = {}, addedSwitchSet) {
    return this.formBuilder.group({
      name: new FormControl('', [Validators.required]),
      deviceId: new FormControl('', [Validators.required, Validators.pattern('^([A-F0-9]{2}:){5}[A-F0-9]{2}$')]),
      deviceType: [3],
    });
  }

  removeSwitchSet(index) {
    this.form.get('newSwitches').removeAt(index); 
  }

  addSwitchSet() {
    this.form.get('newSwitches').push(this.getSwitchSet({}, true));
  }

  save() {  
    if(this.form.valid) {
      this.form.value.project = this.userService.user.selectedProject.id;
      this.switchService.create({valuesToSet: this.form.value}).subscribe(response => {
        console.log(this.form.value);
        this.meterService.create({valuesToSet: this.form.value}).subscribe(responseData =>{
          this.router.navigate(['/switches/devices/list']);
        });
      }, error => {
        if(error.code == 409) {
          alert('Switch serial number already in use.');
        }
      })
    } else {
      for (let i in this.form.controls) { this.form.controls[i].markAsDirty(); }
    }
  }

  cancel() {  
    this.router.navigate(['/switches/devices/list']);
  }
  


}
