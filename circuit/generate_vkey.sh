#!/bin/bash

# Exit on any error
set -e

snarkjs powersoftau new bn128 12 circuit/pot12_0000.ptau -v
snarkjs powersoftau contribute circuit/pot12_0000.ptau circuit/pot12_0001.ptau --name="First contribution" -v
snarkjs powersoftau contribute circuit/pot12_0001.ptau circuit/pot12_0002.ptau --name="Second contribution" -v
snarkjs powersoftau prepare phase2 circuit/pot12_0002.ptau circuit/pot12_final.ptau -v
snarkjs groth16 setup circuit/multiply2numbers.r1cs circuit/pot12_final.ptau circuit/multiply2numbers_0000.zkey
snarkjs zkey contribute circuit/multiply2numbers_0000.zkey circuit/multiply2numbers_0001.zkey --name="First contribution" -v
snarkjs zkey contribute circuit/multiply2numbers_0001.zkey circuit/multiply2numbers_0002.zkey --name="Second contribution" -v
snarkjs zkey export verificationkey circuit/multiply2numbers_0002.zkey circuit/vk_multiply2numbers.json -v
rm -f circuit/pot12_0001.ptau circuit/pot12_0002.ptau circuit/pot12_0000.ptau cicuit/pot12_final.ptau
rm -f circuit/multiply2numbers_0000.zkey circuit/multiply2numbers_0001.zkey

## Generate the .rs file
yarn
node circuit/vk_to_rs.js circuit/vk_multiply2numbers.json programs/zk-guide/src

echo "Done!"