import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Prepends apiBasePath (e.g. /tracking) to /api/* and /files/* requests when the app is behind a proxy.
 * Without this, requests from http://localhost:8080/tracking/ would hit the website (location /)
 * instead of the tracking app (location /tracking/).
 *
 * Also handles platform-level error codes from the Flask backend:
 *  - LICENSE_REQUIRED (403): redirect to the license portal so user can renew/activate.
 *  - EMV_ACCESS_DENIED (403): surface a clear console warning (the backend blocks the request;
 *    no navigation needed as the UI should not show EMV controls to customer users).
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
    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 403 && err.error) {
          const code = err.error.code || '';
          if (code === 'LICENSE_REQUIRED') {
            const licenseUrl = (bootstrap['licenseServicePublicUrl'] || '/license').toString().replace(/\/$/, '');
            if (typeof window !== 'undefined') {
              window.location.href = licenseUrl + '/register/?program=tracking';
            }
          } else if (code === 'EMV_ACCESS_DENIED') {
            console.warn('[Synerex] EM&V Program access denied: client users cannot access EM&V endpoints.');
          }
        }
        return throwError(err);
      })
    );
  }
}
