import assert from 'assert'
const js = require('./js')
import $ from './preconditions'
import XMSS from 'xmss'

function equals(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  const length = a.length;
  for (let i = 0; i < length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

function fill(buffer, value) {
  $.checkArgumentType(buffer, 'Buffer', 'buffer');
  $.checkArgumentType(value, 'number', 'value');
  const length = buffer.length;
  for (let i = 0; i < length; i++) {
    buffer[i] = value;
  }
  return buffer;
}

function bufferToVector(buffer) {
  const ret = new XMSS.VectorUChar()
  for (let i = 0; i < buffer.length; i++) {
    // Put some data
    ret.push_back(buffer[i])
  }
  return ret
}

function vectorToBuffer(vector) {
  const size = vector.size()
  const buffer = Buffer.alloc(size)
  for (let i = 0; i < size; i++) {
    // Put some data
    buffer[i] = vector.get(i)
  }
  return buffer
}

export default {
  bufferToVector,
  vectorToBuffer,
  /**
   * Fill a buffer with a value.
   *
   * @param {Buffer} buffer
   * @param {number} value
   * @return {Buffer}
   */
  fill,

  /**
   * Return a copy of a buffer
   *
   * @param {Buffer} original
   * @return {Buffer}
   */
  copy(original) {
    const buffer = new Buffer(original.length);
    original.copy(buffer);
    return buffer;
  },

  /**
   * Returns true if the given argument is an instance of a buffer. Tests for
   * both node's Buffer and Uint8Array
   *
   * @param {*} arg
   * @return {boolean}
   */
  isBuffer: function isBuffer(arg) {
    return Buffer.isBuffer(arg) || arg instanceof Uint8Array;
  },

  /**
   * Returns a zero-filled byte array
   *
   * @param {number} bytes
   * @return {Buffer}
   */
  emptyBuffer: function emptyBuffer(bytes) {
    $.checkArgumentType(bytes, 'number', 'bytes');
    const result = new Buffer(bytes);
    for (let i = 0; i < bytes; i++) {
      result.write('\0', i);
    }
    return result;
  },

  /**
   * Concatenates a buffer
   *
   * Shortcut for <tt>Buffer.concat</tt>
   */
  concat: Buffer.concat,

  equals,
  equal: equals,

  /**
   * Transforms a number from 0 to 255 into a Buffer of size 1 with that value
   *
   * @param {number} integer
   * @return {Buffer}
   */
  integerAsSingleByteBuffer: function integerAsSingleByteBuffer(integer) {
    $.checkArgumentType(integer, 'number', 'integer');
    return new Buffer([integer & 0xff]);
  },

  /**
   * Transform a 4-byte integer into a Buffer of length 4.
   *
   * @param {number} integer
   * @return {Buffer}
   */
  integerAsBuffer: function integerAsBuffer(integer) {
    $.checkArgumentType(integer, 'number', 'integer');
    const bytes = [];
    bytes.push((integer >> 24) & 0xff);
    bytes.push((integer >> 16) & 0xff);
    bytes.push((integer >> 8) & 0xff);
    bytes.push(integer & 0xff);
    return new Buffer(bytes);
  },

  /**
   * Transform the first 4 values of a Buffer into a number, in little endian encoding
   *
   * @param {Buffer} buffer
   * @return {number}
   */
  integerFromBuffer: function integerFromBuffer(buffer) {
    $.checkArgumentType(buffer, 'Buffer', 'buffer');
    return buffer[0] << 24 | buffer[1] << 16 | buffer[2] << 8 | buffer[3];
  },

  /**
   * Transforms the first byte of an array into a number ranging from -128 to 127
   * @param {Buffer} buffer
   * @return {number}
   */
  integerFromSingleByteBuffer: function integerFromBuffer(buffer) {
    $.checkArgumentType(buffer, 'Buffer', 'buffer');
    return buffer[0];
  },

  /**
   * Transforms a buffer into a string with a number in hexa representation
   *
   * Shorthand for <tt>toString('hex')</tt>
   *
   * @param {Buffer} buffer
   * @return {string}
   */
  bufferToHex: function bufferToHex(buffer) {
    $.checkArgumentType(buffer, 'Buffer', 'buffer');
    return buffer.toString('hex');
  },

  /**
   * Reverse a buffer
   * @param {Buffer} param
   * @return {Buffer}
   */
  reverse: function reverse(param) {
    const ret = new Buffer(param.length);
    for (let i = 0; i < param.length; i++) {
      ret[i] = param[param.length - i - 1];
    }
    return ret;
  },

  /**
   * Transforms an hexa encoded string into a Buffer with binary values
   *
   * Shorthand for <tt>Buffer(string, 'hex')</tt>
   *
   * @param {string} string
   * @return {Buffer}
   */
  hexToBuffer: function hexToBuffer(string) {
    assert(js.isHexa(string));
    return Buffer.from(string, 'hex');
  }
};

export const NULL_HASH = fill(new Buffer(32), 0);
export const EMPTY_BUFFER = new Buffer(0);
