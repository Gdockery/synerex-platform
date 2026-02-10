## Monitoring App

Application that supports:
- defining recurrent tasks
- reading/writing data from/to MySQL and InfluxDB
- sending slack notifications

**NOTE** The application needs the `config/local.js` file from the root of the repo to contain:
- mysql connection string
- influx DB URL
- slack webhook URL

### Installation

1. `npm i` in this folder
2. `npm run compile` to generate the running code
3. install the service locally

### Development

1. `npm i`
2. `npm run watch` to continuously compile the code
3. `npm run start` to run and have the app automatically reload on changes