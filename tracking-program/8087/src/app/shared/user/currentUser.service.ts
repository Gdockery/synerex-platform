import {Component, Injectable, Inject} from '@angular/core';

import { User } from "./user";
import {IAppConfig, APP_CONFIG} from "../../config/app.config";
import {AuthService} from "./auth.service";
import {WindowRef} from "../windowRef.component";
import {ApiRequestService} from "../../api/api-request.service";
import {AdminProjectService} from "../../admin/project/admin-project.service";

require('moment-timezone');
let moment = require('moment');

@Injectable()
export class CurrentUserService {

  public user: User;
  public projectIdKey = 'xeco-project-id';

  constructor(@Inject(APP_CONFIG) private config: IAppConfig, private authService: AuthService, private window: WindowRef) {
    this.user = new User(config.locals.user);

    let id = localStorage.getItem(this.projectIdKey);
    if(id) {
      this.selectProject(id);
    }
    else if(this.user.defaultProject) {
      this.selectProject(this.user.defaultProject);
    }
    else {
      this.user.selectedProject = null;
    }
  }

  logout(expired: boolean = false) {
    this.deselectProject();
    // Clear all browser storage so the next user does not see previous user data
    try { localStorage.clear(); } catch(e) {}
    try { sessionStorage.clear(); } catch(e) {}
    // Use full-page navigation to avoid CORS when server redirects to different origin (e.g. 5173)
    this.window.getNativeWindow().location.href = '/tracking/logout' + (expired ? '?expired=1' : '');
  }

  selectProject(projectId) {
    if (!projectId) { throw new Error('Consistency violation: Cannot call `selectProject` with a falsey first argument!'); }

    var projectToSelect:any = this.user.projects.find(project => {
      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      // FUTURE: Why is this `==` necessary? (Rather than three equal signs?)
      // Currently, switching to `===` fails, presumably because of accidental number-to-string
      // type coercion of the project id happening somewhere else in the code base.
      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      return project.id == projectId;
    });

    // If no such project exists (e.g. because of out-of-date local storage) then deselect the project instead.
    if (!projectToSelect) {
      this.deselectProject();
      // throw new Error('Consistency violation: Cannot call `selectProject` with that project ID (`'+projectId+'`) because there is no such project available.  All available projects, for reference: '+JSON.stringify(this.user.projects));
      return;
    }

    const tz = projectToSelect.timeZoneId || 'America/Chicago';
    const m = moment().tz(tz);
    projectToSelect.timezoneAbbreviation = m && m.isValid() ? m.format('zz') : '';
    projectToSelect.hasRunTest = !!projectToSelect.kvaSavings;
    projectToSelect.selectedTest = projectToSelect.selectedTest;
    projectToSelect.savings = {
      kva: projectToSelect.kvaSavings,
      kvar: projectToSelect.kvarSavings,
      kw: projectToSelect.kwPeakSavings,
      kwp: projectToSelect.kwPeakSavings,
      kwh: projectToSelect.kwhSavings,
      pf: projectToSelect.pfSavings
    };
    //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    this.user.selectedProject = projectToSelect;
    localStorage.setItem(this.projectIdKey, projectId);
  }

  updateProjectSavings(testId, savings) {
    this.user.selectedProject.savings = {
      kva: savings.kva,
      kvar: savings.kvar,
      kw: savings.kwp,
      kwp: savings.hasOwnProperty('kwp') ? savings.kwp: savings.kwPeak,
      kwh: savings.kwh,
      pf: savings.pf
    };
    this.user.selectedProject.selectedTest = testId;
  }

  deselectProject() {
    this.user.selectedProject = null;
    localStorage.removeItem(this.projectIdKey);
  }

  updateUser(params) {
    for (let prop in this.user) {
      if(params[prop]) {
        this.user[prop] = params[prop];
      }
    }
  }

}
