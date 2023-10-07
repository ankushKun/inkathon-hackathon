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
        game: String,
        uri: String,
        price: u128,
        max_supply: u32,
        current_supply: u32,
        seller: AccountId,
        owners: Vec<(AccountId, u32, u32, u128)>, // (account, copies_owned, copies_for_sale, price_per_copy)
    }

    #[ink(storage)]
    pub struct Market {
        count: u32,
        items: Mapping<u32, Item>,                    // id => item
        sellers_2_item: Mapping<AccountId, Vec<u32>>, // account => item_id
        seller_ids: Vec<AccountId>,
    }

    impl Market {
        #[ink(constructor)]
        pub fn default() -> Self {
            Self {
                count: Default::default(),
                items: Default::default(),
                sellers_2_item: Default::default(),
                seller_ids: Default::default(),
            }
        }

        #[ink(message)]
        pub fn get_all_suppliers(&self) -> Vec<AccountId> {
            self.seller_ids.clone()
        }

        #[ink(message)]
        pub fn get_supplier_items(&self, supplier: AccountId) -> Vec<u32> {
            self.sellers_2_item.get(supplier).unwrap_or_default()
        }

        #[ink(message)]
        pub fn new_item(
            &mut self,
            name: String,
            game: String,
            uri: String,
            price: u128,
            max_supply: u32,
        ) {
            self.count += 1;

            // define a new item and add it to items mapping
            let itm = Item {
                name,
                game,
                uri,
                price,
                max_supply,
                current_supply: 0,
                seller: self.env().caller(),
                owners: Default::default(),
            };
            self.items.insert(self.count, &itm);

            // add the item to sellers_2_item mapping
            let mut items_ids = self
                .sellers_2_item
                .get(self.env().caller())
                .unwrap_or_default();
            items_ids.push(self.count);
            self.sellers_2_item.insert(self.env().caller(), &items_ids);

            // add the seller to seller_ids vector
            if !self.seller_ids.contains(&self.env().caller()) {
                self.seller_ids.push(self.env().caller());
            }
        }

        #[ink(message, payable)]
        pub fn buy_item(&mut self, buy_from: AccountId, item_id: u32, amt_to_buy: u32) {
            assert!(self.seller_ids.contains(&buy_from), "Seller does not exist");
            assert!(self.items.contains(&item_id), "Item does not exist");

            let itm = self.items.get(&item_id).unwrap();

            assert!(
                itm.current_supply < itm.max_supply || itm.owners.len() > 0,
                "Item is not available for sale"
            );
        }

        #[ink(message)]
        pub fn set_item_for_sale(
            &mut self,
            item_id: u32,
            copies_to_sell: u32,
            price_per_copy: u128,
        ) {
        }
    }
}
