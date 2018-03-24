import Hash from '../hash'
import Input from './input'
import Output from './output'
import Keypair from '../keypair'
import Consensus from '../consensus'
import IO from '../io'
const {TX} = IO

export default class Transaction {
  constructor(obj) {
    this.type = Consensus.TX.type.Normal
    this.version = obj.version
    this.inputs = obj.inputs.map(obj => Input.fromJSON(obj))
    this.outputs = obj.outputs.map(obj => Output.fromJSON(obj))
    this.locktime = obj.locktime
  }

  /**
   * create a coinbase transaction
   * @param keypair {Keypair}
   * @param coinbase {Buffer}
   * @param amount {Number}
   * @return {Transaction}
   */
  static createCoinbaseTransaction(keypair, coinbase, amount) {
    const obj = {
      signature: coinbase
    }
    const address = keypair.toAddress()
    const inputs = [new Input(obj)]
    const publicKeyHash = Keypair.addressToPublicKeyHash(address)
    const outputs = [new Output(amount, publicKeyHash)]
    const info = {
      version: 1,
      inputs,
      outputs,
      locktime: 0
    }
    return new Transaction(info)
  }

  /** pack transaction to protobuf
   * @return {Buffer}
   */
  toBuffer() {
    return TX.encode(this).finish()
  }

  /**
   * create transaction from protobuf formated data
   * @param buffer
   * @return {Transaction}
   */
  static fromBuffer(buffer) {
    const obj = TX.decode(buffer)
    return new Transaction(obj)
  }

  /**
   * create transaction from object
   * @param obj
   * @return {Transaction}
   */
  static fromJSON(obj) {
    if (obj instanceof Transaction) {
      return obj
    }
    return new Transaction(obj)
  }
  /** do sha256sha256 on transaction buffer
   * @return {Buffer}
   */
  hash() {
    return Hash.defaultHash(this.toBuffer())
  }

  /**
   * debug usage
   * @return {string}
   */
  inspect() {
    return `<Transaction ${this.hash().toString('hex')} >`
  }
}
