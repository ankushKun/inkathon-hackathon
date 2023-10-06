#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod market {
    use ink::prelude::string::String;
    use ink::prelude::vec::Vec;
    use ink::storage::Mapping;

    #[ink(event)]
    #[derive(Clone)]
    #[cfg_attr(
        feature = "std",
        derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
    )]
    pub struct Item {
        name: String,
        price: u32,
        max_supply: u32,
        current_supply: u32,
        supplier: AccountId,
    }

    #[ink(storage)]
    pub struct Market {
        count: u32,
        items: Mapping<u32, Item>,
        owners: Mapping<AccountId, Vec<(u32, u32)>>,
    }

    impl Market {
        #[ink(constructor)]
        pub fn default() -> Self {
            Self {
                count: Default::default(),
                items: Mapping::new(),
                owners: Mapping::new(),
            }
        }

        #[ink(message)]
        pub fn new_item(&mut self) -> u32 {
            self.count += 1;
            let item = Item {
                name: String::from("test"),
                price: 1,
                max_supply: 1,
                current_supply: 1,
                supplier: Self::env().caller(),
            };
            self.items.insert(self.count, &item);
            let mut owner_items = self.owners.get(&Self::env().caller()).unwrap_or(Vec::new());
            owner_items.push((self.count, 1));
            self.owners.insert(Self::env().caller(), &owner_items);
            return self.count;
        }
    }
}
