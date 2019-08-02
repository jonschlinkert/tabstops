'use strict';

require('mocha');
const assert = require('assert').strict;
const Data = require('../lib/Data');

describe('Data class', () => {
  describe('.set', () => {
    it('should set values on data.cache', () => {
      let data = new Data();
      data.set('foo', 'bar');
      assert.equal(data.cache.foo, 'bar');
    });
  });

  describe('.get', () => {
    it('should get values', () => {
      let data = new Data();
      data.set('foo', 'bar');
      assert.equal(data.get('foo'), 'bar');
    });

    it('should get nested values', () => {
      let data = new Data();
      data.set('foo', { bar: { baz: 'qux' } });
      assert.equal(data.get('foo.bar.baz'), 'qux');
    });
  });

  describe('.has', () => {
    it('should return true if data has the given key', () => {
      let data = new Data();
      data.set('foo', 'bar');
      assert.equal(data.has('foo'), true);
    });

    it('should return true if data has a nested property', () => {
      let data = new Data();
      data.set('foo', { bar: 'baz' });
      assert.equal(data.has('foo.bar'), true);
    });

    it('should return false when key is not given', () => {
      let data = new Data();
      assert.equal(data.has(''), false);
      assert.equal(data.has(), false);
    });

    it('should return false when values do not exist', () => {
      let data = new Data();
      assert.equal(data.has('foo'), false);
      assert.equal(data.has('foo.bar'), false);
      assert.equal(data.has('foo.bar.blah'), false);
    });
  });

  describe('.delete', () => {
    it('should delete values', () => {
      let data = new Data();
      data.set('foo', 'bar');
      assert.equal(data.get('foo'), 'bar');
      data.delete('foo');
      assert.equal(data.get('foo'), void 0);
    });

    it('should delete nested values', () => {
      let data = new Data();

      data.set('foo', { bar: { baz: 'qux' } });
      assert.equal(data.get('foo.bar.baz'), 'qux');

      data.delete('foo.bar.baz');
      assert.deepEqual(data.get('foo'), { bar: {} });

      data.delete('foo.bar');
      assert.deepEqual(data.get('foo'), {});

      data.delete('foo');
      assert.deepEqual(data.get('foo'), void 0);
    });

    it('should ignore when key is not given', () => {
      let data = new Data();
      assert.doesNotThrow(() => data.delete(''));
      assert.doesNotThrow(() => data.delete(), void 0);
    });

    it('should return undefined when values do not exist', () => {
      let data = new Data();
      assert.doesNotThrow(() => data.delete('foo'), void 0);
      assert.doesNotThrow(() => data.delete('foo.bar'), void 0);
      assert.doesNotThrow(() => data.delete('foo.bar.blah'), void 0);
    });
  });

  describe('isData', () => {
    it('should be true when a value is an instance of Data', () => {
      assert(Data.isData(new Data()));

      class CustomData extends Data {}
      assert(Data.isData(new CustomData()));
    });

    it('should be true when value is an object with .get/.set methods', () => {
      assert(Data.isData(new Map()));
    });

    it('should be be false when object does not have .get/.set methods', () => {
      assert(!Data.isData({}));
      assert(!Data.isData(null));
      assert(!Data.isData());
    });
  });
});
