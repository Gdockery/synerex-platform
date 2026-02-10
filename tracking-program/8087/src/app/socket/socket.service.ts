import {Injectable, NgZone}              from '@angular/core';



window['io'] = window['io'] || require('sails.io.js/sails.io.js')(require('socket.io-client/dist/socket.io.js'));
var io = window['io'];

@Injectable()
export class SocketService {

  //Allows Angular view to update after asynchronous callback
  private doThenRender;

  constructor() {
    let _zone = new NgZone({ enableLongStackTrace: false });
    this.doThenRender = function(proceed){ _zone.run(proceed); };
  }

  on(action, callback:Function) {
    let self = this;
    io.socket.on(action, function onRelevantServerSentMsg(result) {
      self.doThenRender(()=>{
        callback(result);
      });
    });
  }

  get(url, params, callback:Function) {
    let self = this;
    io.socket.get(url, params, (result, jwr)=>{
      if (jwr.error) {
        // this should never fail, but if it does, error toaster time
        // TODO: toast  (in the mean time, just throwing)
        throw jwr.error;
      }
      self.doThenRender(()=>{
        callback(result);
      });
    });
  }

  /**
   * Get data from a url, and also subscribe to socket.io.
   *
   * @param url
   * @param action
   * @param params
   * @param callback
   */
  getThenOn(action, url, params, callback:Function) {
    this.get(url, params, callback);
    this.on(action, callback);
  }

  off(action) {
    let self = this;
    io.socket.off(action);
    /*io.socket.off(action, function onRelevantServerSentMsg(result) {
      self.doThenRender(()=>{
        callback(result);
      });
    });*/
  }

}
