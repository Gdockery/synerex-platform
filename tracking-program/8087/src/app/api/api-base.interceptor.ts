import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Prepends apiBasePath (e.g. /tracking) to /api/* and /files/* requests when the app is behind a proxy.
 * Without this, requests from http://localhost:8080/tracking/ would hit the website (location /)
 * instead of the tracking app (location /tracking/).
 */
@Injectable()
export class ApiBaseInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const bootstrap = (typeof window !== 'undefined' && window['BOOTSTRAP_DATA']) || {};
    const apiBasePath = (bootstrap['apiBasePath'] || '').toString().replace(/\/$/, '');
    if (apiBasePath && (req.url.startsWith('/api') || req.url.startsWith('/files'))) {
      const newUrl = apiBasePath + req.url;
      req = req.clone({ url: newUrl });
    }
    return next.handle(req);
  }
}
