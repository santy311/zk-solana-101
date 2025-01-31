import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { ZkGuide } from "../target/types/zk_guide";

import * as snarkjs from "snarkjs";

describe("zk-guide", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.ZkGuide as Program<ZkGuide>;

  it("Verifies a proof", async () => {
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      {
        nullifier: BigInt(1234),
        secret: BigInt(5678),
        path_elements: [
          "20595346326572914964186581639484694308224330290454662633399973481953444150659",
          "20403006909364192806930024120627684483381303094884559877071101381067530732246",
          "6494326098466164952080577608230455345257528668955319299844368625460411395488"
        ],
        path_indices: [0, 1, 0],
        root: "15157027679257943619680443910020794781589735471572686454300031870659269110888",
        nullifier_hash: "6739237337836053036050092520295483268472201574170554680955096201102421203684"
      },
      "./circuit/merkle/merkle.wasm",
      "./circuit/merkle/merkle.zkey"
    )

    console.log(proof);
    console.log(publicSignals);

    const proofBytes = convertProofToBytes(proof);
    console.log("Proof Bytes:", proofBytes);
    console.log("Proof Bytes Length:", proofBytes.length);

    console.log("publicSignals[0]", publicSignals[0].length);
    console.log("publicSignals[1]", publicSignals[1].length);
    const txn = await program.methods.verify(
      publicSignals[0].toString(),
      publicSignals[1].toString(),
      Array.from(proofBytes)
    ).rpc(
      {
        commitment: "confirmed"
      }
    );
    console.log("Verified!", txn);

    // Get the transaction details with explicit commitment level
    const txnDetails = await program.provider.connection.getTransaction(txn, {
      commitment: "confirmed"
    });
    
    console.log("txnDetails", txnDetails);
  })
})


function bigIntToBytes32(num) {
  // Convert BigInt to 32-byte hex string
  let hex = BigInt(num).toString(16);
  // Pad to 64 characters (32 bytes)
  hex = hex.padStart(64, '0');
  // Convert hex string to Uint8Array
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, (i + 1) * 2), 16);
  }
  return bytes;
}

function concatenateUint8Arrays(arrays) {
  // Calculate total length
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  // Create new array with total length
  const result = new Uint8Array(totalLength);
  // Copy each array into result
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

function convertProofToBytes(proof: { pi_a: any[]; pi_b: any[][]; pi_c: any[]; }) {
  // Convert pi_a components
  const pi_a = [
    bigIntToBytes32(proof.pi_a[0]),
    bigIntToBytes32(proof.pi_a[1])
  ];

  // Convert pi_b components (note the reversed order within pairs)
  const pi_b = [
    // First pair
    bigIntToBytes32(proof.pi_b[0][1]),  // Reversed order
    bigIntToBytes32(proof.pi_b[0][0]),
    // Second pair
    bigIntToBytes32(proof.pi_b[1][1]),  // Reversed order
    bigIntToBytes32(proof.pi_b[1][0])
  ];

  // Convert pi_c components
  const pi_c = [
    bigIntToBytes32(proof.pi_c[0]),
    bigIntToBytes32(proof.pi_c[1])
  ];

  // Concatenate all components
  const allBytes = concatenateUint8Arrays([
    ...pi_a,
    ...pi_b,
    ...pi_c
  ]);

  return allBytes;
}