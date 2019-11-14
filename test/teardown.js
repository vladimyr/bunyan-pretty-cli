'use strict';

const del = require('del');

module.exports = () => del.sync(process.env.TEMP_DIR);
