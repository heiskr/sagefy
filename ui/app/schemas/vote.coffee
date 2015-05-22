post = require('./post')
util = require('../modules/utilities')

module.exports = util.extend({}, post, {
    body: {
        type: 'textarea'
        validations: []
    }
    replies_to_id: {
        type: 'hidden'
        validations: []
    }
    response: {
        type: 'select'
        validations: []
    }
})