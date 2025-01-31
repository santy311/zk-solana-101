use anchor_lang::prelude::*;
use ark_serialize::{CanonicalDeserialize, CanonicalSerialize};
use groth16_solana::groth16::Groth16Verifier;

mod verifying_key;
use verifying_key::VERIFYINGKEY;
type G1 = ark_bn254::g1::G1Affine;
declare_id!("31PJTVfAeRwLSJe5kvP6CrWZWpHqpdfMwtBeKtqS5xuK");

#[program]
pub mod zk_guide {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }

    pub fn verify(
        _ctx: Context<Verify>,
        root: String,
        nullifier: String,
        proof: [u8; 256],
    ) -> Result<()> {
        msg!("root: {}", root);
        msg!("nullifier: {}", nullifier);

        // Convert hex strings to 32-byte arrays
        let root_bytes = hex_str_to_bytes32(&root)?;
        let nullifier_bytes = hex_str_to_bytes32(&nullifier)?;

        let proof_a: G1 = <G1 as CanonicalDeserialize>::deserialize_uncompressed(
            &*[&change_endianness(&proof[0..64])[..], &[0u8][..]].concat(),
        )
        .unwrap();
        let mut proof_a_neg = [0u8; 65];
        <G1 as CanonicalSerialize>::serialize_uncompressed(&-proof_a, &mut proof_a_neg[..])
            .unwrap();
        let proof_a: [u8; 64] = change_endianness(&proof_a_neg[..64]).try_into().unwrap();
        let proof_b: [u8; 128] = proof[64..192].try_into().unwrap();
        let proof_c: [u8; 64] = proof[192..256].try_into().unwrap();

        // The output should be 32 byte chunk so we can take the u64 and convert it to a left padded u8 array of 32 bytes
        // let mut result = [0u8; 32];
        // let value_bytes = root_u64.to_be_bytes(); // Convert to big-endian bytes
        // result[24..].copy_from_slice(&value_bytes); // Copy to last 8 bytes

        // let mut result2 = [0u8; 32];
        // let value_bytes = nullifier_u64.to_be_bytes(); // Convert to big-endian bytes
        // result2[24..].copy_from_slice(&value_bytes); // Copy to last 8 bytes

        let public_inputs = [root_bytes, nullifier_bytes];

        let mut verifier: Groth16Verifier<'_, 2> =
            Groth16Verifier::new(&proof_a, &proof_b, &proof_c, &public_inputs, &VERIFYINGKEY)
                .unwrap();
        verifier.verify().unwrap();

        msg!("Verification successful");
        Ok(())
    }
}

fn change_endianness(bytes: &[u8]) -> Vec<u8> {
    let mut vec = Vec::new();
    for b in bytes.chunks(32) {
        for byte in b.iter().rev() {
            vec.push(*byte);
        }
    }
    vec
}

fn hex_str_to_bytes32(s: &str) -> Result<[u8; 32]> {
    // Remove "0x" prefix if present
    let s = s.strip_prefix("0x").unwrap_or(s);

    // Convert decimal string to big integer bytes
    let n = s
        .parse::<num_bigint::BigInt>()
        .map_err(|_| error!(ErrorCode::InvalidInput))?;
    let bytes = n.to_bytes_be().1;

    // Create a 32-byte array, right-padded with zeros
    let mut result = [0u8; 32];
    if bytes.len() > 32 {
        return Err(error!(ErrorCode::InvalidInput));
    }
    result[32 - bytes.len()..].copy_from_slice(&bytes);
    Ok(result)
}

#[derive(Accounts)]
pub struct Initialize {}

#[derive(Accounts)]
pub struct Verify {}

#[error_code]
pub enum ErrorCode {
    InvalidInput,
}
