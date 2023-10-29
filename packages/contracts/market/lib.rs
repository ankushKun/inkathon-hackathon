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
        owners: Mapping<AccountId, Vec<(u32, u32)>>, // account => item_id, copies_owned
    }

    impl Market {
        #[ink(constructor)]
        pub fn default() -> Self {
            Self {
                count: Default::default(),
                items: Default::default(),
                sellers_2_item: Default::default(),
                seller_ids: Default::default(),
                owners: Default::default(),
            }
        }

        #[ink(message)]
        pub fn get_item_count(&self) -> u32 {
            self.count
        }

        #[ink(message)]
        pub fn get_specific_items(&self, item_ids: Vec<u32>) -> Vec<Item> {
            let mut items = Vec::new();
            for item_id in item_ids {
                items.push(self.items.get(&item_id).unwrap());
            }
            items
        }

        // #[ink(message)]
        // pub fn get_all_items(&self) -> Mapping<u32, Item> {
        //     self.items
        // }

        #[ink(message)]
        pub fn get_item(&self, item_id: u32) -> Item {
            self.items.get(&item_id).unwrap()
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
        pub fn get_owned_items(&self, owner: AccountId) -> Vec<(u32, u32)> {
            self.owners.get(owner).unwrap_or_default()
        }

        #[ink(message)]
        pub fn get_all_items(&self) -> Vec<Item> {
            let mut items = Vec::new();
            for i in 0..self.count {
                items.push(self.items.get(&i).unwrap());
            }
            items
        }

        #[ink(message)]
        pub fn new_item(
            &mut self,
            name: String,
            game: String,
            uri: String,
            price: u128,
            max_supply: u32,
        ) -> u32 {
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
            self.count += 1;
            self.count - 1
        }

        #[ink(message, payable)]
        pub fn buy_item(&mut self, buy_from: AccountId, item_id: u32, amt_to_buy: u32) {
            assert!(self.seller_ids.contains(&buy_from), "Seller does not exist");
            assert!(self.items.contains(&item_id), "Item does not exist");

            let mut itm = self.items.get(&item_id).unwrap();

            assert!(
                itm.current_supply < itm.max_supply || itm.owners.len() > 0,
                "Item is not available for sale"
            );

            let mut bought = false;
            if itm.current_supply + amt_to_buy <= itm.max_supply {
                // mint new copies
                assert!(itm.seller == buy_from, "Seller does not own the item");
                let price_to_pay = amt_to_buy as u128 * itm.price;
                assert!(
                    self.env().transferred_value() >= price_to_pay,
                    "Not enough funds to buy"
                );
                let remainder = self.env().transferred_value() - price_to_pay;
                self.env().transfer(buy_from, price_to_pay).unwrap();
                if remainder > 0 {
                    self.env().transfer(self.env().caller(), remainder).unwrap();
                }

                itm.current_supply += amt_to_buy;
                let mut already_owned = false;
                for (i, (owner, copies_owned, copies_for_sale, price_per_copy)) in
                    itm.owners.clone().iter().enumerate()
                {
                    if *owner == self.env().caller() {
                        itm.owners[i].1 += amt_to_buy;
                        already_owned = true;
                    }
                }
                if !already_owned {
                    itm.owners
                        .push((self.env().caller(), amt_to_buy, 0, itm.price));
                }

                bought = true;
                self.items.insert(item_id, &itm);
            } else {
                // transfer ownership
                let mut owner_found = false;
                for (i, (owner, copies_owned, copies_for_sale, price_per_copy)) in
                    itm.owners.clone().iter().enumerate()
                {
                    if *owner == buy_from {
                        assert!(
                            *copies_owned >= amt_to_buy,
                            "Not enough copies owned to sell"
                        );
                        assert!(
                            *copies_for_sale >= amt_to_buy,
                            "Not enough copies for sale to sell"
                        );
                        let price_to_pay = amt_to_buy as u128 * price_per_copy;
                        assert!(
                            self.env().transferred_value() >= price_to_pay,
                            "Not enough funds to buy"
                        );
                        itm.owners[i].1 -= amt_to_buy;
                        itm.owners[i].2 -= amt_to_buy;
                        let remainder = self.env().transferred_value() - price_to_pay;
                        self.env().transfer(buy_from, price_to_pay).unwrap();
                        if remainder > 0 {
                            self.env().transfer(self.env().caller(), remainder).unwrap();
                        }
                        owner_found = true;

                        // transfer ownership
                        let mut new_owner_found = false;
                        for (j, (owner, copies_owned, copies_for_sale, price_per_copy)) in
                            itm.owners.clone().iter().enumerate()
                        {
                            if *owner == self.env().caller() {
                                itm.owners[j].1 += amt_to_buy;
                                new_owner_found = true;
                                bought = true;
                                self.items.insert(item_id, &itm);
                                break;
                            }
                        }
                        if !new_owner_found {
                            itm.owners
                                .push((self.env().caller(), amt_to_buy, 0, itm.price));
                            bought = true;
                            self.items.insert(item_id, &itm);
                        }
                        break;
                    }
                }
                if !owner_found {
                    panic!("Seller does not own the item");
                }
            }
            if bought {
                // add the item to owners mapping
                let mut items_ids = self.owners.get(self.env().caller()).unwrap_or_default();
                let mut already_owned = false;
                for (i, (owned_item_id, copies_owned)) in items_ids.clone().iter().enumerate() {
                    if item_id == *owned_item_id {
                        items_ids[i].1 += amt_to_buy;
                        already_owned = true;
                    }
                }
                if !already_owned {
                    items_ids.push((item_id, amt_to_buy));
                } else {
                    items_ids.retain(|(_, copies_owned)| *copies_owned > 0);
                }
                self.owners.insert(self.env().caller(), &items_ids);

                // decrement if it was owned by someone else
                if buy_from != itm.seller {
                    let mut items_ids = self.owners.get(buy_from).unwrap_or_default();
                    let mut already_owned = false;
                    for (i, (owned_item_id, copies_owned)) in items_ids.clone().iter().enumerate() {
                        if item_id == *owned_item_id {
                            items_ids[i].1 -= amt_to_buy;
                            already_owned = true;
                        }
                    }
                    if !already_owned {
                        items_ids.push((item_id, amt_to_buy));
                    } else {
                        items_ids.retain(|(_, copies_owned)| *copies_owned > 0);
                    }
                    self.owners.insert(buy_from, &items_ids);
                }
            }
        }

        #[ink(message)]
        pub fn set_item_for_sale(
            &mut self,
            item_id: u32,
            copies_to_sell: u32,
            price_per_copy: u128,
        ) {
            assert!(self.items.contains(&item_id), "Item does not exist");
            let mut itm = self.items.get(&item_id).unwrap();

            let mut already_owned = false;
            for (i, (owner, copies_owned, copies_for_sale, old_price_per_copy)) in
                itm.owners.clone().iter().enumerate()
            {
                if *owner == self.env().caller() {
                    itm.owners[i].2 = copies_to_sell;
                    itm.owners[i].3 = price_per_copy;
                    already_owned = true;
                }
            }
            if !already_owned {
                panic!("Caller does not own the item");
            }
        }
    }
}
