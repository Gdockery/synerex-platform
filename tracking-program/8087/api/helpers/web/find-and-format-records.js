module.exports = {


  friendlyName: 'Find and format records',


  description: 'Fetch the specified page of records from the databse and report back.',


  inputs: {

    model: {
      description: 'The Sails/Waterline model to search.',
      type: 'ref',
      required: true,
    },

    selectClause: {
      description: 'An optional `select` clause to use with this query.',
      type: 'ref',
      defaultsTo: ['*']
    },

    whereClause: {
      description: 'An optional `where` clause to use with this query.',
      type: 'ref',
      defaultsTo: {}
    },

    sortClause: {
      description: 'An optional `sort` clause to use with this query.',
      type: 'ref',
      defaultsTo: 'id ASC'
    },

    populates: {
      description: 'An optional dictionary for the `populates` QK (query key).',
      type: 'ref',
      defaultsTo: {}
    },

    page: sails.config.constants.PAGINATION_INPUTS.page,

    pageSize: sails.config.constants.PAGINATION_INPUTS.pageSize,

  },


  exits: {

    success: sails.config.constants.getPaginationSuccessExit(),

    badRequest: {
      description: 'Maximum page size exceeded.'
    }

  },


  fn: function (inputs, exits) {

    var effectivePageSize = inputs.pageSize;
    if (_.isUndefined(inputs.pageSize)) {
      effectivePageSize = sails.config.constants.DEFAULT_PAGE_SIZE;
    }

    var MAX_PAGE_SIZE = 500;
    if (effectivePageSize > MAX_PAGE_SIZE) {
      return exits.badRequest(new Error('Cannot exceed maximum allowed `pageSize` ('+MAX_PAGE_SIZE+').  Please declare a smaller value for `pageSize`, or simply omit it altogether.'));
    }

    var zeroIndexedPage;
    if (!_.isUndefined(inputs.page)) {
      zeroIndexedPage = inputs.page - 1;
    }
    else {
      zeroIndexedPage = 0;
    }

    // Determine if `primaryKey` was explicitly called out in the `select` clause
    // by either the attr name (e.g. "id") or "*".  If it WAS NOT, then in a bit,
    // we'll strip it out of the dataset before exiting.
    // (This is so the result from this helper can be direcly used in a web API.)
    //
    // > Note that we HAVE to do this before running queries!
    // > (Otherwise `inputs.selectClause` will be mutated, since Waterline normalizes
    // > it in-place to maximize performance.)
    var wantsPk = _.intersection(inputs.selectClause, ['*',inputs.model.primaryKey]).length > 0;
    // console.log('wants pk?',wantsPk, 'why?',_.intersection(inputs.selectClause, ['*',inputs.model.primaryKey]));

    async.auto({
      count: function (proceed){
        inputs.model.count(inputs.whereClause).exec(proceed);
      },
      list: function (proceed){
        inputs.model.find(inputs.whereClause, inputs.populates)
        .paginate(zeroIndexedPage, effectivePageSize)
        .sort(inputs.sortClause)
        .select(inputs.selectClause)
        .exec(proceed);
      }
    }, function (err, snowball){
      if (err) { return exits.error(err); }

      snowball.list = _.map(snowball.list, function(record) {
        // Strip primary key value (unless it was specifically demanded)
        if (!wantsPk) {
          delete record[inputs.model.primaryKey];
        }
        return record;
      });

      return exits.success({
        meta: {
          page: zeroIndexedPage + 1,
          total: snowball.count
        },
        response: snowball.list,
      });

    });//</ async.auto() >

  }


};




/*
  Example usage:

  ```
  sails.helpers.web.findAndFormatRecords({
    model: SavingsReport,
    selectClause: ['month', 'createdAt'],
    whereClause: {
      project: inputs.project
    },
    sortClause: (inputs.orderBy||'createdAt') + ' ' + (inputs.orderDirection||'DESC'),
    pageSize: inputs.pageSize,
    page: inputs.page
  }).exec(function(err, report) {
    if (err) { return exits.error(err); }
    console.log(report);
    return exits.success(undefined, report);
  });
  ```
*/
