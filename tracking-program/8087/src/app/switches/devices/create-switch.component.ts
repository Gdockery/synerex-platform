import {Component} from '@angular/core';
import {FormBuilder, FormControl, Validators} from "@angular/forms";
import {SwitchesService} from "../switches.service";
import {Router} from "@angular/router";
import {ActivatedRoute} from "@angular/router";

@Component({
  templateUrl: './create-switch.component.html',
})
export class CreateSwitchComponent {

  public form;
  private schDetail = [{}];

  constructor(private formBuilder: FormBuilder, private switchService: SwitchesService, private router: Router,  private route: ActivatedRoute) {}

  ngOnInit() {
    this.initializeForm();
  }

  initializeForm() {
    this.form = this.formBuilder.group({
      name: new FormControl('', [Validators.required]),
      deviceId: new FormControl('', [Validators.required, Validators.pattern('^([A-F0-9]{2}:){5}[A-F0-9]{2}$')]),
      deviceType: [1],
    });
  }

  getSwitchSet(switchSet:any = {}, addedSwitchSet) {
    return this.formBuilder.group({
      name: new FormControl('', [Validators.required]),
      deviceId: new FormControl('', [Validators.required, Validators.pattern('^([A-F0-9]{2}:){5}[A-F0-9]{2}$')]),
      deviceType: [1],
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
      this.switchService.create({valuesToSet: this.form.value}).subscribe(response => {
        this.router.navigate(['/switches/devices/list']);
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
