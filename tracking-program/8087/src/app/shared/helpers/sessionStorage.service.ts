import { Injectable } from '@angular/core';
import { CurrentUserService } from "../user/currentUser.service";

@Injectable()
export class SessionStorage {
	constructor(private users: CurrentUserService) {}

	tableFirstHandler(tableName: string = "default") {
		const key = [
			'table-first',
			(this.users.user.selectedProject || {}).id,
			window.location.href.toString(),
			tableName
		].join(' ')

		return {
			get() {
				let value = window.sessionStorage.getItem(key)
				if(value === null) {
					return 0
				}
				return parseInt(value) || 0
			},
			set(newValue: number) {
				window.sessionStorage.setItem(key, '' + newValue)
			}
		}
	}
}