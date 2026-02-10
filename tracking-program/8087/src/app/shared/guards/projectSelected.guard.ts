import { Injectable } from '@angular/core';
import {CanActivate, Router} from '@angular/router';
import {CurrentUserService} from "../user/currentUser.service";

@Injectable()
export class ProjectSelectedGuard implements CanActivate {

  constructor(private userService: CurrentUserService, private router: Router) {}

  canActivate() {
    if(this.userService.user.selectedProject) {
      return true;
    }
    this.router.navigate(['/project/select']);
    // TODO: When it's finished, change this to redirect to `/welcome` instead
    return false;
  }
}
