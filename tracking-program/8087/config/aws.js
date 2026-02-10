module.exports = {
  aws: {
    credentials: {
      accessKeyId: 'AKIAIUGQUUAN7YKNMDEQ',
      secretAccessKey: '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',
      region: 'us-east-1',
    },
    s3: {
      apiVersion: '2006-03-01',
      signatureVersion: 'v4',
      params: {Bucket: 'xeco-dev'}
    },
    iotData: {
      apiVersion: '2015-05-28',
      endpoint: 'a15raz503f5pp3.iot.us-east-1.amazonaws.com'
    },
    ses: {
      apiVersion: '2010-12-01',
      params: {
        Source: 'sailsco@enolalabs.com'
      }
    }
  }
};
