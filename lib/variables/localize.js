'use strict';

const localize = (getterOptions = {}, options) => {
  let opts = { locale: 'en-US', ...options, ...getterOptions };
  let date = opts.date ? new Date(opts.date) : new Date();
  delete opts.locale;
  delete opts.date;
  return new Intl.DateTimeFormat(opts.locale, opts).format(date);
};

module.exports = localize;
