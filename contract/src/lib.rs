/*
 * This is an example of a Rust smart contract with two simple, symmetric functions:
 *
 * 1. set_greeting: accepts a greeting, such as "howdy", and records it for the user (account_id)
 *    who sent the request
 * 2. get_greeting: accepts an account_id and returns the greeting saved for it, defaulting to
 *    "Hello"
 *
 * Learn more about writing NEAR smart contracts with Rust:
 * https://github.com/near/near-sdk-rs
 *
 */

// To conserve gas, efficient serialization is achieved through Borsh (http://borsh.io/)
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::{env, near_bindgen, AccountId, Timestamp, Balance, setup_alloc};
use near_sdk::collections::UnorderedMap;
use near_sdk::serde::{Serialize, Deserialize};


setup_alloc!();

// Structs in Rust are similar to other languages, and may include impl keyword as shown below
// Note: the names of the structs are not important when calling the smart contract, but the function names are
#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct HelloNear {
    records: UnorderedMap<AccountId, Messenger>,
    total_mess: u64
}

impl Default for HelloNear {
  fn default() -> Self {
    Self {
      records: UnorderedMap::new(b"a".to_vec()),
      total_mess: 0
    }
  }
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct Messenger {
    pub owner_id: AccountId,
    pub mess: String,
    pub donate: Balance,
    pub time: Timestamp
}


#[near_bindgen]
impl HelloNear {
    
    // get lists messenger and donate
    pub fn get_leaderboard_donate(& self) -> Vec<Messenger> {
        let n =  self.records.len() as u64;

        self.records.iter()
        .skip(0)
        .take(n as usize)
        .map(|id| { let (i,mess) = id;  return self.records.get(&i).unwrap() })
        .collect()
    }

    #[payable]
    pub fn add_mess_and_donate(&mut self, message: String) {
        let account_id = env::predecessor_account_id();
        
        let exist_account = &self.records.get(&account_id);

        assert!(message.len() > 0, "MESS CANT EMPTY");
        self.total_mess+= 1;

        let mess_donate = if let Some(exist_account) = exist_account {
            Messenger {
                owner_id: account_id.clone(),
                mess: message,
                donate: exist_account.donate + env::attached_deposit(),
                time: env::block_timestamp(),
            }
        } else {
            Messenger {
                owner_id: account_id.clone(),
                mess: message,
                donate: env::attached_deposit(),
                time: env::block_timestamp(),
            }
        };

        self.records.insert(&account_id, &mess_donate);
    }

    
}

/*
 * The rest of this file holds the inline tests for the code above
 * Learn more about Rust tests: https://doc.rust-lang.org/book/ch11-01-writing-tests.html
 *
 * To run from contract directory:
 * cargo test -- --nocapture
 *
 * From project root, to run in combination with frontend tests:
 * yarn test
 *
 */
#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::MockedBlockchain;
    use near_sdk::{testing_env, VMContext};

    // mock the context for testing, notice "signer_account_id" that was accessed above from env::
    fn get_context(input: Vec<u8>, is_view: bool) -> VMContext {
        VMContext {
            current_account_id: "alice_near".to_string(),
            signer_account_id: "bob_near".to_string(),
            signer_account_pk: vec![0, 1, 2],
            predecessor_account_id: "carol_near".to_string(),
            input,
            block_index: 0,
            block_timestamp: 0,
            account_balance: 0,
            account_locked_balance: 0,
            storage_usage: 0,
            attached_deposit: 0,
            prepaid_gas: 10u64.pow(18),
            random_seed: vec![0, 1, 2],
            is_view,
            output_data_receivers: vec![],
            epoch_height: 19,
        }
    }

    
}
