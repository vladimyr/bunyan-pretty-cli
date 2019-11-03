'use strict';

module.exports = {
  customPrettifiers: {
    foo: val => `${val}_baz\nmultiline`,
    bar: val => `"${val}"`,
    cow: val => val.toUpperCase()
  }
};
