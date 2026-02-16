import { Injectable } from '@angular/core';
import { SocketService } from "../socket/socket.service";

@Injectable()
export class GlobalNotificationService {

  constructor(private socketService: SocketService) {}

  /**
   * Subscribe to real-time notifications.
   * Disabled: backend does not emit 'notification' events yet.
   * Re-enable when Flask socket_events.py emits notifications.
   */
  public subscribe() {
    // this.socketService.on('notification', function(response) {
    //   alert(response.message);
    // });
  }

}
