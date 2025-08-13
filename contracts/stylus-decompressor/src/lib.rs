//!
//! Decompressor
//!
// Allow `cargo stylus export-abi` to generate a main function.
#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
#![cfg_attr(not(any(test, feature = "export-abi")), no_std)]

#[macro_use]
extern crate alloc;

use alloc::vec::Vec;
use alloy_sol_types::sol;
use miniz_oxide::inflate::decompress_to_vec_zlib;
use rlp::Rlp;

use stylus_sdk::abi::Bytes;
/// Import items from the SDK. The prelude contains common traits and macros.
use stylus_sdk::prelude::*;

#[storage]
#[entrypoint]
pub struct Decompressor {}

// Declare events and Solidity error types
sol! {
    error EmptyData();
    error InvalidZlib();
    error InvalidRlp();
}

#[derive(SolidityError)]
pub enum DecompressorErrors {
    EmptyData(EmptyData),
    InvalidZlib(InvalidZlib),
    InvalidRlp(InvalidRlp),
}

/// Declare that `Decompressor` is a contract with the following external methods.
#[public]
impl Decompressor {
    pub fn decompress(&self, data: Bytes) -> Result<Vec<Bytes>, DecompressorErrors> {
        // Check for empty data first
        if data.is_empty() {
            return Err(DecompressorErrors::EmptyData(EmptyData {}));
        }

        // Decompress using miniz_oxide
        let decoded_bytes = decompress_to_vec_zlib(data.as_slice())
            .map_err(|_| DecompressorErrors::InvalidZlib(InvalidZlib {}))?;

        // Decode RLP
        let rlp = Rlp::new(&decoded_bytes);
        let transactions: Result<Vec<Bytes>, _> = rlp
            .as_list::<Vec<u8>>()
            .map(|vec_list| vec_list.into_iter().map(|v| v.into()).collect());

        transactions.map_err(|_| DecompressorErrors::InvalidRlp(InvalidRlp {}))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use stylus_sdk::testing::*;

    #[test]
    fn test_decompress() {
        let vm = TestVM::default();
        let contract = Decompressor::from(&vm);

        let compressed = hex::decode("789c0171008efff86fb86d02f86a82f9530c01840bebc20182520894b8efb7d8a0f93d5a42ee8a5bd5e89cacc2160d878203e880c001a07c6b4a88f8f4aa9945a1708bb745548608008e7257f58a415fa590684f93477ea051d812417cec75c8a3b58ae9f6a76bd99b5ce21b83837cfb92e880b6712e867af2803b41").expect("Invalid hex string");
        let uncompressed = hex::decode("02f86a82f9530c01840bebc20182520894b8efb7d8a0f93d5a42ee8a5bd5e89cacc2160d878203e880c001a07c6b4a88f8f4aa9945a1708bb745548608008e7257f58a415fa590684f93477ea051d812417cec75c8a3b58ae9f6a76bd99b5ce21b83837cfb92e880b6712e867a").expect("Invalid hex string");

        let decompressed = contract.decompress(compressed.to_vec().into());
        assert!(decompressed.is_ok());

        let decompressed_vec = decompressed.unwrap_or_default();
        assert_eq!(decompressed_vec.len(), 1);
        assert_eq!(decompressed_vec[0].as_slice(), uncompressed.as_slice());
    }
}
