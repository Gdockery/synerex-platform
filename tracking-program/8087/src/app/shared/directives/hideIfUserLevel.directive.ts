import {Directive, ElementRef, Input, OnInit, Renderer2} from '@angular/core';

import {CurrentUserService} from "../user/currentUser.service";

@Directive({
  selector: '[hideIfUserLevel]'
})
export class HideIfUserLevel implements OnInit {

  @Input('hideIfUserLevel') hideIfUserLevel;

  constructor(private element:ElementRef, private userService: CurrentUserService, private renderer: Renderer2) {}

  ngOnInit() {
    if(this.isCorrectUserLevel(this.hideIfUserLevel)) {
      this.renderer.setStyle(this.element.nativeElement, 'display', 'none');
    }
  }

  isCorrectUserLevel(roles) {
    if(roles.length) {
      return this.hideIfUserLevel.find(level => {
        return this.userService.user.role == level;
      });
    } else {
      return this.userService.user.role == roles;
    }
  }

}
