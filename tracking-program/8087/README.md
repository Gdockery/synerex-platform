# XECO integrated app

a [Sails](http://sailsjs.com) 1.0 application serving an Angular 2 front end for the XECO application.

### To run:

```
npm install
sails lift
```

and the app will be live at the URL in `TRACKING_BASE_URL`.

### Angular v6

At the moment of this writing, the code has been succesfully upgraded from Angular v4 to Angular v6. Although the application works, these two items (from the Angular update guide) are still left pending:
- If you use the legacy `HttpModule` and the `Http` service, switch to `HttpClientModule` and the `HttpClient` service. `HttpClient` simplifies the default ergonomics (you don't need to map to JSON anymore) and now supports typed return values and interceptors. Read more on angular.io.
- Support for using the `ngModel` input property and `ngModelChange` event with reactive form directives has been deprecated in v6 and removed in v7.

### Notes about the current version (v0.0.3)

This is really just the Angular 2 seed app, being served by a Sails back end.  When lifted in development mode (the default) it will used Webpack to compile all the scripts in the `/src` folder, and serve `/static/js/main.bundle.js` locally.  In production mode, the S3_BUCKET_NAME environment variable must be set, and the `main.bundle.js` file will be served from an S3 URL based on that bucket name and the current app version, e.g. `http://s3.amazonaws.com/myfancybucket-us-east-1-415383322648/0.0.3/static/js/main.bundle.js`.

As an example of how asset URLs from within the front-end app might be managed, see `/src/app/app.component.ts` and `/src/app/shared/constants.service.ts`.  The `Constants` service leverages data that is bootstrapped onto the page by Sails, including the app version, environment and S3 bucket url.  These can be used to create an "asset URL prefix" that can be used when loading images and other .js or .css files.

Currently the app serves a single page via the `/api/controllers/index.js` action, which displays the `views/homepage.ejs` view with some bootstrapped data.  The homepage view loads the main JavaScript bundle from either the local server or S3 depending on the environment.

##### Setting up the MySQL server

1. Make sure you have Docker installed.
2. From the `sails-xeco` directory, run:
   ```
   docker build -f docker/mysql/mysql.dockerfile -t xeco/mysql docker/mysql
   ```
   to build the Docker image.
3. Run:
   ```
   docker run --name xeco-mysql -d -p 3333:3306 xeco/mysql
   ```
   to create and run a container in the background, using the `xeco/mysql` image.

