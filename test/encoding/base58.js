const should = require('chai').should()
import pqccore from '../../lib'
const {Base58} = pqccore.encoding

describe('Base58', () => {
  const buf = new Buffer([0, 1, 2, 3, 253, 254, 255]);
  const enc = '1W7N4RuG';

  it('should make an instance with "new"', () => {
    const b58 = new Base58();
    should.exist(b58);
  });

  it('should decode', () => {
    const buffer = new Buffer([0xc4])
    console.log(Base58.decode('g'), Base58.encode(buffer))
  });

  it('validates characters with no false negatives', () => {
    Base58.validCharacters('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz').should.equal(true);
  });
  it('validates characters from buffer', () => {
    Base58.validCharacters(new Buffer('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz')).should.equal(true);
  });

  it('some characters are invalid (no false positives)', () => {
    Base58.validCharacters('!@#%^$&*()\\').should.equal(false);
  });

  it('should make an instance without "new"', () => {
    const b58 = Base58();
    should.exist(b58);
  });

  it('should allow this handy syntax', () => {
    Base58(buf).toString().should.equal(enc);
    Base58(enc).toBuffer().toString('hex').should.equal(buf.toString('hex'));
  });

  describe('#set', () => {
    it('should set a blank buffer', () => {
      Base58().set({
        buf: new Buffer([])
      });
    });
  });

  describe('@encode', () => {
    it('should encode the buffer accurately', () => {
      Base58.encode(buf).should.equal(enc);
    });

    it('should throw an error when the Input is not a buffer', () => {
      (function () {
        Base58.encode('string');
      }).should.throw('Input should be a buffer');
    });
  });

  describe('@decode', () => {
    it('should decode this encoded value correctly', () => {
      Base58.decode(enc).toString('hex').should.equal(buf.toString('hex'));
    });

    it('should throw an error when Input is not a string', () => {
      (function () {
        Base58.decode(5);
      }).should.throw('Input should be a string');
    });
  });

  describe('#fromBuffer', () => {
    it('should not fail', () => {
      should.exist(Base58().fromBuffer(buf));
    });

    it('should set buffer', () => {
      const b58 = Base58().fromBuffer(buf);
      b58.buf.toString('hex').should.equal(buf.toString('hex'));
    });
  });

  describe('#fromString', () => {
    it('should convert this known string to a buffer', () => {
      Base58().fromString(enc).toBuffer().toString('hex').should.equal(buf.toString('hex'));
    });
  });

  describe('#toBuffer', () => {
    it('should return the buffer', () => {
      const b58 = Base58({
        buf
      });
      b58.buf.toString('hex').should.equal(buf.toString('hex'));
    });
  });

  describe('#toString', () => {
    it('should return the buffer', () => {
      const b58 = Base58({
        buf
      });
      b58.toString().should.equal(enc);
    });
  });
});
