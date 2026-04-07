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
  public clientName: String;
  public userLogo: String;
  public orgId: String;
  public sponsorOrgId: String;

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
      this.clientName = user.clientName;
      this.orgId = user.orgId || '';
      this.sponsorOrgId = user.sponsorOrgId || '';
    }
  }

  getInitials() {
    return this.firstName[0].toUpperCase() + ' ' +this.lastName[0].toUpperCase();
  }

  /**
   * Returns the best display name for the welcome greeting:
   * - OEM users (role 9/10): their client/company name
   * - Client users (role 1-4): their client/company name
   * - Others: their first name
   */
  getDisplayName(): String {
    const r = Number(this.role);
    if ((r >= 1 && r <= 4) || r === 9 || r === 10) {
      if (this.clientName) return this.clientName;
    }
    return this.firstName;
  }
}
