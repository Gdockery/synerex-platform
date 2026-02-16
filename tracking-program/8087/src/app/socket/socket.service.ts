import { Injectable, NgZone } from '@angular/core';
// socket.io-client v2 - use default import for TS 3.9 compatibility
// eslint-disable-next-line @typescript-eslint/no-var-requires
const io = require('socket.io-client');

@Injectable()
export class SocketService {
  private socket: any = null;

  constructor(private ngZone: NgZone) {}

  private getSocket(): any {
    if (!this.socket) {
      const base = (window as any).location.origin;
      const path = (window as any).location.pathname.startsWith('/tracking')
        ? '/tracking/socket.io'
        : '/socket.io';
      this.socket = io(base, {
        path,
        transports: ['websocket', 'polling'],
        autoConnect: true,
      });
    }
    return this.socket as any;
  }

  private doThenRender(callback: () => void): void {
    if (NgZone.isInAngularZone()) {
      callback();
    } else {
      this.ngZone.run(callback);
    }
  }

  /** Listen for server events (replaces io.socket.on) */
  on(event: string, callback: (data: any) => void): void {
    this.getSocket().on(event, (data: any) => {
      this.doThenRender(() => callback(data));
    });
  }

  /** Unsubscribe from event */
  off(event: string): void {
    this.socket?.off(event);
  }

  /** Emit to server (for join_project, leave_project, etc.) */
  emit(event: string, data?: any, callback?: (res: any) => void): void {
    const sock = this.getSocket();
    if (callback) {
      sock.emit(event, data, callback);
    } else {
      sock.emit(event, data);
    }
  }

  /** Join project room for ticker updates. Call after HTTP GET /api/project/ticker. */
  joinProject(projectId: number, callback?: (ok: boolean) => void): void {
    this.emit('join_project', { project: projectId }, (res: any) => {
      const ok = res && !res.error;
      if (callback) {
        this.doThenRender(() => callback(ok));
      }
    });
  }

  /** Leave project room */
  leaveProject(projectId: number, callback?: (ok: boolean) => void): void {
    this.emit('leave_project', { project: projectId }, (res: any) => {
      const ok = res && !res.error;
      if (callback) {
        this.doThenRender(() => callback(ok));
      }
    });
  }

  /** Connection state (for debugging) */
  get connected(): boolean {
    return !!this.socket?.connected;
  }
}
