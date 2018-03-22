var superSphincs = require('supersphincs')

describe('Sphincs', () => {
  it('should ', async function() {
    this.timeout(200 * 1000)
    const keyPair /*: {privateKey: Uint8Array; publicKey: Uint8Array} */ =
        await superSphincs.keyPair()
    ;

    const message /*: Uint8Array */ =
        new Uint8Array([104, 101, 108, 108, 111]) // "hello"
    ;

    // Optional additional data argument, similar conceptually to what AEAD ciphers support.
    // If specified, must be the same when signing and verifying. For more information and
    // usage advice, see: https://download.libsodium.org/doc/secret-key_cryptography/aead.html
    const additionalData /*: Uint8Array */ =
        new Uint8Array([119, 111, 114, 108, 100]) // "world"
    ;

    /* Combined signatures */

    const signed /*: Uint8Array */ =
        await superSphincs.sign(message, keyPair.privateKey, additionalData)
    ;

    const verified /*: Uint8Array */ =
        await superSphincs.open(signed, keyPair.publicKey, additionalData) // same as message
    ;

    /* Detached signatures */

    const signature /*: Uint8Array */ =
        await superSphincs.signDetached(message, keyPair.privateKey, additionalData)
    ;

    console.log(37, new Buffer(signature).toString('hex'))

    const isValid /*: boolean */ =
        await superSphincs.verifyDetached(
            signature,
            message,
            keyPair.publicKey,
            additionalData
        ) // true
    ;

    console.log(48, isValid)
    /* Export and optionally encrypt keys */

    const keyData /*: {
		private: {
			rsa: string;
			sphincs: string;
			superSphincs: string;
		};
		public: {
			rsa: string;
			sphincs: string;
			superSphincs: string;
		};
	} */ =
        await superSphincs.exportKeys(keyPair, 'secret passphrase')
    ;

    let localStorage = {};

    // May now save exported keys to disk (or whatever)
    localStorage.superSphincsPrivateKey = keyData.private.superSphincs;
    localStorage.sphincsPrivateKey = keyData.private.sphincs;
    localStorage.rsaPrivateKey = keyData.private.rsa;
    localStorage.superSphincsPublicKey = keyData.public.superSphincs;
    localStorage.sphincsPublicKey = keyData.public.sphincs;
    localStorage.rsaPublicKey = keyData.public.rsa;

    console.log(75, localStorage)
    /* Reconstruct an exported key using either the superSphincs
        value or any pair of valid sphincs and rsa values */

    const keyPair1 = await superSphincs.importKeys({
      public: {
        rsa: localStorage.rsaPublicKey,
        sphincs: localStorage.sphincsPublicKey
      }
    });

    // May now use keyPair1.publicKey as in the above examples
    console.log('Import #1:');
    console.log(keyPair1);

    const keyPair2 = await superSphincs.importKeys(
        {
          private: {
            superSphincs: localStorage.superSphincsPrivateKey
          }
        },
        'secret passphrase'
    );

    // May now use keyPair2 as in the above examples
    console.log('Import #2:');
    console.log(keyPair2);

    // Constructing an entirely new SuperSPHINCS key pair from
    // the original SPHINCS key pair and a new RSA key pair
    const keyPair3 = await superSphincs.importKeys(
        {
          private: {
            rsa: (
                await superSphincs.exportKeys(
                    await superSphincs.keyPair(),
                    'hunter2'
                )
            ).private.rsa,
            sphincs: localStorage.sphincsPrivateKey
          }
        },
        {
          rsa: 'hunter2',
          sphincs: 'secret passphrase'
        }
    );

    // May now use keyPair3 as in the above examples
    console.log('Import #3:');
    console.log(keyPair3);
  });
})

