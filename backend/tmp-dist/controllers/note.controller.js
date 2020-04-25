"use strict";
module.exports = {
    '/note': function (req, res) {
        res.send(['foo', 'bar', 'baz'].toString());
    }
};
