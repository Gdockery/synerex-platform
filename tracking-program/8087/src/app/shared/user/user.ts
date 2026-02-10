import {Project} from "../project/project";
export class User {
  public id: number;
  public firstName: String;
  public lastName: String;
  public email: String;
  public role: Number;
  public roleFriendlyName: String;
  public defaultProject: Number;
  public lastActiveAt: Number;
  public projects: Array<Project>;
  public selectedProject: Project;
  public client: any;
  public userLogo: String;

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Reminder:  Be careful -- it seems like this `User` class is used
  // in two different places in the UI code, so be sure any changes are
  // safe in both spots!
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  constructor(user: any) {
    if(user.id) {
      this.id = user.id;
      this.firstName = user.firstName;
      this.lastName = user.lastName;
      this.email = user.email;
      this.role = user.role;
      this.lastActiveAt = user.lastActiveAt;
      this.roleFriendlyName = user.roleFriendlyName;
      this.defaultProject = user.defaultProject;
      this.projects = user.projects;
      this.selectedProject = null;
      this.client = user.client;
    }
  }

  getInitials() {
    return this.firstName[0].toUpperCase() + ' ' +this.lastName[0].toUpperCase();
  }
}
