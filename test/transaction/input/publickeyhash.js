
const should = require('chai').should();
const expect = require('chai').expect;
const _ = require('lodash');

import pqccore from '../../../lib'

const {
  Script, Address, Networks, Opcode, Transaction, errors, PrivateKey
} = pqccore
const {BN, Signature, Hash} = pqccore.crypto

describe('PublicKeyHashInput', () => {
  const privateKey = new PrivateKey('2SRLnpdFnpiqzeAbJXSBoLeCvG65m7ham4N7ZuFuSgRSAmAVQwKDVrJnui3gY4Ywv7ZFVeW5QuFC4oakVAxetMxGVnvEyct');
  const publicKey = privateKey.publicKey;
  const address = new Address(publicKey, Networks.livenet);

  const output = {
    address: 'Lfci7ooSc31oNijNG9zDeHBBHJddxrPEKX',
    txId: '66e64ef8a3b384164b78453fa8c8194de9a473ba14f89485a0e433699daec140',
    outputIndex: 0,
    script: new Script(address),
    glv: 1000000
  };
  it('can count missing signatures', function() {
    this.timeout(20 * 1000)
    const transaction = new Transaction()
      .from(output)
      .to(address, 1000000);
    const input = transaction.inputs[0];

    input.isFullySigned().should.equal(false);
    transaction.sign(privateKey);
    input.isFullySigned().should.equal(true);
  });
  it('it\'s size can be estimated', function() {
    this.timeout(20 * 1000)
    const transaction = new Transaction()
      .from(output)
      .to(address, 1000000);
    const input = transaction.inputs[0];
    input._estimateSize().should.equal(107);
  });
  it('it\'s signature can be removed', function() {
    this.timeout(20 * 1000)
    const transaction = new Transaction()
      .from(output)
      .to(address, 1000000);
    const input = transaction.inputs[0];

    transaction.sign(privateKey);
    input.clearSignatures();
    input.isFullySigned().should.equal(false);
  });
  it('returns an empty array if private key mismatches', function() {
    this.timeout(20 * 1000)
    const transaction = new Transaction()
      .from(output)
      .to(address, 1000000);
    const input = transaction.inputs[0];
    const signatures = input.getSignatures(transaction, new PrivateKey(), 0);
    signatures.length.should.equal(0);
  });
});
