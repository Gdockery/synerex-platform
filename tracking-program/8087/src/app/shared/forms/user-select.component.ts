import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormArray, FormBuilder, FormControl, Validators} from '@angular/forms';
import {CurrentUserService} from "../user/currentUser.service";
import {UserService} from "../user/user.service";

@Component({
  selector: 'user-select',
  template: `
    <div *ngFor="let control of userFormArray.controls; let i = index">
      <div [formGroup]="control">
        <select formControlName="id" class="form-control" style="display:inline-block; width:200px;">
          <option *ngIf="allowEmpty" value="">---</option>
          <option *ngFor="let user of users" value="{{user.id}}">{{user.email}}</option>
        </select>
        <button *ngIf="i>0" style="display:inline-block;width:auto;" type="button" class="default-button red-button form-control" (click)="removeUser(i)">Remove</button>
      </div>
    </div>
  `
})
export class UserSelectComponent implements OnInit {
  @Input() userFormArray: FormArray;
  @Input() allowEmpty: Boolean;

  @Output()
  remove = new EventEmitter<any>();

  private users;

  constructor(private userService: UserService, private formBuilder: FormBuilder, private currentUserService: CurrentUserService) {}

  ngOnInit() {
    this.userService.getProjectUsers(this.currentUserService.user.selectedProject.id).subscribe(data => {
      this.users = data.response;
    });
  }

  addUser() {
    this.userFormArray.push(
      this.formBuilder.group({'id': new FormControl('', [Validators.required])})
    );
  }

  removeUser(id) {
    if(this.userFormArray.length > 1) {
      this.userFormArray.removeAt(id);
    }
  }
}
