import _ from 'lodash'
import BufferUtil from '../util/buffer'
import BufferReader from '../encoding/bufferreader'
import BufferWriter from '../encoding/bufferwriter'
import Hash from '../crypto/hash'
import $ from '../util/preconditions'
import BlockHeader from './blockheader'
import Transaction from '../transaction'


/**
 * Instantiate a MerkleBlock from a Buffer, JSON object, or Object with
 * the properties of the Block
 *
 * @param {*} - A Buffer, JSON string, or Object representing a MerkleBlock
 * @returns {MerkleBlock}
 * @constructor
 */
export default class MerkleBlock {
  constructor(arg) {
    let info = {};
    if (BufferUtil.isBuffer(arg)) {
      info = MerkleBlock._fromBufferReader(BufferReader(arg));
    } else if (_.isObject(arg)) {
      let header;
      if (arg.header instanceof BlockHeader) {
        header = arg.header;
      } else {
        header = BlockHeader.fromObject(arg.header);
      }
      info = {
        /**
         * @name MerkleBlock#header
         * @type {BlockHeader}
         */
        header,
        /**
         * @name MerkleBlock#numTransactions
         * @type {Number}
         */
        numTransactions: arg.numTransactions,
        /**
         * @name MerkleBlock#hashes
         * @type {String[]}
         */
        hashes: arg.hashes,
        /**
         * @name MerkleBlock#flags
         * @type {Number[]}
         */
        flags: arg.flags
      };
    } else {
      throw new TypeError('Unrecognized argument for MerkleBlock');
    }
    Object.assign(this, info)
  }

  /**
   * @param {Buffer} - MerkleBlock data in a Buffer object
   * @returns {MerkleBlock} - A MerkleBlock object
   */
  static fromBuffer(buf) {
    return MerkleBlock.fromBufferReader(BufferReader(buf));
  }

  /**
   * @param {BufferReader} - MerkleBlock data in a BufferReader object
   * @returns {MerkleBlock} - A MerkleBlock object
   */
  static fromBufferReader(br) {
    return new MerkleBlock(this._fromBufferReader(br));
  }

  /**
   * @returns {Buffer} - A buffer of the block
   */
  toBuffer() {
    return this.toBufferWriter().concat();
  }

  /**
   * @param {BufferWriter} - An existing instance of BufferWriter
   * @returns {BufferWriter} - An instance of BufferWriter representation of the MerkleBlock
   */
  toBufferWriter(bw) {
    if (!bw) {
      bw = new BufferWriter();
    }
    bw.write(this.header.toBuffer());
    bw.writeUInt32LE(this.numTransactions);
    bw.writeVarintNum(this.hashes.length);
    for (var i = 0; i < this.hashes.length; i++) {
      bw.write(Buffer.from(this.hashes[i], 'hex'));
    }
    bw.writeVarintNum(this.flags.length);
    for (i = 0; i < this.flags.length; i++) {
      bw.writeUInt8(this.flags[i]);
    }
    return bw;
  }

  /**
   * @returns {Object} - A plain object with the MerkleBlock properties
   */
  toObject() {
    return {
      header: this.header.toObject(),
      numTransactions: this.numTransactions,
      hashes: this.hashes,
      flags: this.flags
    };
  }

  /**
   * Verify that the MerkleBlock is valid
   * @returns {Boolean} - True/False whether this MerkleBlock is Valid
   */
  validMerkleTree() {
    $.checkState(_.isArray(this.flags), 'MerkleBlock flags is not an array');
    $.checkState(_.isArray(this.hashes), 'MerkleBlock hashes is not an array');

    // Can't have more hashes than numTransactions
    if (this.hashes.length > this.numTransactions) {
      return false;
    }

    // Can't have more flag bits than num hashes
    if (this.flags.length * 8 < this.hashes.length) {
      return false;
    }

    const height = this.calcTreeHeight();
    const opts = { hashesUsed: 0, flagBitsUsed: 0 };
    const root = this.traverseMerkleTree(height, 0, opts);
    if (opts.hashesUsed !== this.hashes.length) {
      return false;
    }
    return BufferUtil.equals(root, this.header.merkleRoot);
  }

  /**
   * Traverse a the tree in this MerkleBlock, validating it along the way
   * Modeled after pqcoin Core merkleblock.cpp TraverseAndExtract()
   * @param {Number} - depth - Current height
   * @param {Number} - pos - Current position in the tree
   * @param {Object} - opts - Object with values that need to be mutated throughout the traversal
   * @param {Number} - opts.flagBitsUsed - Number of flag bits used, should start at 0
   * @param {Number} - opts.hashesUsed - Number of hashes used, should start at 0
   * @param {Array} - opts.txs - Will finish populated by transactions found during traversal
   * @returns {Buffer|null} - Buffer containing the Merkle Hash for that height
   * @private
   */
  traverseMerkleTree(depth, pos, opts) {
    /* jshint maxcomplexity:  12 */
    /* jshint maxstatements: 20 */

    opts = opts || {};
    opts.txs = opts.txs || [];
    opts.flagBitsUsed = opts.flagBitsUsed || 0;
    opts.hashesUsed = opts.hashesUsed || 0;

    if (opts.flagBitsUsed > this.flags.length * 8) {
      return null;
    }
    const isParentOfMatch = (this.flags[opts.flagBitsUsed >> 3] >>> (opts.flagBitsUsed++ & 7)) & 1;
    if (depth === 0 || !isParentOfMatch) {
      if (opts.hashesUsed >= this.hashes.length) {
        return null;
      }
      const hash = this.hashes[opts.hashesUsed++];
      if (depth === 0 && isParentOfMatch) {
        opts.txs.push(hash);
      }
      return Buffer.from(hash, 'hex');
    } else {
      const left = this.traverseMerkleTree(depth - 1, pos * 2, opts);
      let right = left;
      if (pos * 2 + 1 < this.calcTreeWidth(depth - 1)) {
        right = this.traverseMerkleTree(depth - 1, pos * 2 + 1, opts);
      }
      return Hash.sha256sha256(Buffer.concat([left, right]));
    }
  }

  /** Calculates the width of a merkle tree at a given height.
   *  Modeled after pqcoin Core merkleblock.h CalcTreeWidth()
   * @param {Number} - Height at which we want the tree width
   * @returns {Number} - Width of the tree at a given height
   * @private
   */
  calcTreeWidth(height) {
    return (this.numTransactions + (1 << height) - 1) >> height;
  }

  /** Calculates the height of the merkle tree in this MerkleBlock
   * @param {Number} - Height at which we want the tree width
   * @returns {Number} - Height of the merkle tree in this MerkleBlock
   * @private
   */
  calcTreeHeight() {
    let height = 0;
    while (this.calcTreeWidth(height) > 1) {
      height++;
    }
    return height;
  }

  /**
   * @param {Transaction|String} - Transaction or Transaction ID Hash
   * @returns {Boolean} - return true/false if this MerkleBlock has the TX or not
   * @private
   */
  hasTransaction(tx) {
    $.checkArgument(!_.isUndefined(tx), 'tx cannot be undefined');
    $.checkArgument(
      tx instanceof Transaction || typeof tx === 'string',
      'Invalid tx given, tx must be a "string" or "Transaction"'
    );

    let hash = tx;
    if (tx instanceof Transaction) {
      // We need to reverse the id hash for the lookup
      hash = BufferUtil.reverse(Buffer.from(tx.id, 'hex')).toString('hex');
    }

    const txs = [];
    const height = this.calcTreeHeight();
    this.traverseMerkleTree(height, 0, { txs });
    return txs.indexOf(hash) !== -1;
  }

  /**
   * @param {Buffer} - MerkleBlock data
   * @returns {Object} - An Object representing merkleblock data
   * @private
   */
  static _fromBufferReader(br) {
    $.checkState(!br.finished(), 'No merkleblock data received');
    const info = {};
    info.header = BlockHeader.fromBufferReader(br);
    info.numTransactions = br.readUInt32LE();
    const numHashes = br.readVarintNum();
    info.hashes = [];
    for (let i = 0; i < numHashes; i++) {
      info.hashes.push(br.read(32).toString('hex'));
    }
    const numFlags = br.readVarintNum();
    info.flags = [];
    for (let i = 0; i < numFlags; i++) {
      info.flags.push(br.readUInt8());
    }
    return info;
  }

  /**
   * @param {Object} - A plain JavaScript object
   * @returns {MerkleBlock} - An instance of block
   */
  static fromObject(obj) {
    return new MerkleBlock(obj);
  }
}
