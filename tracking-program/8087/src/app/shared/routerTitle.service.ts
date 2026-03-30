
import {mergeMap, map, filter} from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { Title } from '@angular/platform-browser';
import {SubNavService} from "./subNav/subNav.service";

@Injectable()
export class RouterTitleService {

  sub: Subscription;

  constructor(private router: Router, private subnavService: SubNavService, private title: Title) {
    this.sub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(_ => this.router.routerState.root),
      map(route => {
        while (route.firstChild) route = route.firstChild;
        return route;
      }),
      mergeMap(route => route.data),)
      .subscribe(data => {
        let title = data['title'] || "";
        this.title.setTitle('Synerex - ' + title);
        this.subnavService.setTitle(title);
      });
  }

}
