import { Injectable } from '@angular/core';
import {SocketService} from "../socket/socket.service";

@Injectable()
export class GlobalNotificationService {

  constructor(private socketService: SocketService) {}

  public subscribe() {
    this.socketService.on('notification', function(response) {
      alert(response.message);
    })
  }

}
