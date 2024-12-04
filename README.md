# ZK-on-Solana 101

In this guide, we'll go over the basics of creating a circom circuit, creating a proof for it, and verifying it on Solana blockchain. 

There's plenty of resources for learning about what zero knowledge proofs are and how they work, like [this](https://docs.circom.io/background/background/#summary), so we'll focus instead on specifics of the implementation for engineers.

### Contact
If you run into any issues, please reach out to [spacemandev](https://twitter.com/spacemandev) on Twitter/Discord/Telegram.
You can also ask for help in the 76Devs Discord Server.

### Prerequesites
You'll need to have the following installed:

1. [Rust](https://www.rust-lang.org/tools/install)
2. [Node.js](https://solana.com/docs/intro/installation#install-anchor-cli)
3. [Yarn](https://yarnpkg.com/getting-started/install)
4. [Circom](https://docs.circom.io/getting-started/installation/)
5. [Solana CLI](https://solana.com/docs/intro/installation#install-the-solana-cli)
6. [Anchor](https://solana.com/docs/intro/installation#install-anchor-cli)
7. [SnarkJS](https://yarnpkg.com/package?q=snarkjs&name=snarkjs)
8. (Optional) [SnarkJS Types](https://yarnpkg.com/package?q=snarkjs&name=@types/snarkjs)

Optional VS Code extensions:
- [Rust Analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
- [Circom](https://marketplace.visualstudio.com/items?itemName=iden3.circom)

## The Circuit
Under the /circuit folder, you'll find a simple circuit that multiplies two numbers and checks that the result is correct. We won't focus on advanced circuit design, but you can find more examples in the [circom docs](https://docs.circom.io/circom-language/signals/).

After you have your circuit, you can compile it with the following command:
```sh
circom circuit/multiply2numbers.circom --r1cs --wasm --sym --output circuit/
```
The flags mean:
- `--r1cs`: compiles the circuit to a R1CS file that contains the R1CS constraint system of the circuit in binary format.  
- `--wasm`: it generates the directory multiply2numbers_js that contains the Wasm code (multiplier2.wasm) and other files needed to generate the witness  
- `--sym`: compiles the circuit to a Sym file a symbols file required for debugging or for printing the constraint system in an annotated mode.
- `--output circuit/`: specifies the output directory for the compiled files

The compiled files will be in the circuit folder.

## The VKey
Next we'll generate the verification key for the circuit. This will be used to generate and verify proofs for the circuit.

```sh
sh circuit/generate_vkey.sh
```

This will generate the ```vk_multiply2numbers.json``` file in the circuit folder which we can use in typescript AND generate the ```verifying_key.rs``` file that we'll use in the on chain program.

## The Solana Program
Next, let's tackle writing the on chain program. For this we'll need to add a couple of dependencies to our cargo.toml file:

```toml
[dependencies]
...
groth16-solana = "0.0.3"
ark-bn254 = "0.5.0"
ark-serialize = "0.5.0"
```

You can find the full code in the [programs/zk-guide/src/lib.rs](programs/zk-guide/src/lib.rs) file.
The key thing to note is that we're using the `Groth16Verifier` struct to verify the proof. This struct takes the proof, public inputs, and the verification key as arguments. The public inputs are the OUTPUT of the circuit (the 'c') value.

Next run ```anchor build``` to compile the program.

[!INFO]  
If you get the ```lock file version 4 requires `-Znext-lockfile-bump` ``` error, you can just manually set the version in Cargo.lock to '3'. This should be fixed in the next release of Anchor.

## The Test

To run the test, run ```anchor test``` in the root directory of the project. This will run the test in the [tests/zk-guide.ts](tests/zk-guide.ts) file.

The test file contains a number of helper functions to convert the proof to bytes. This is necessary because the proof is a JavaScript object, and we need to convert it to a byte array before passing it to the program.

If everything is working correctly, you should see the following output:

```sh
Verified!
```

