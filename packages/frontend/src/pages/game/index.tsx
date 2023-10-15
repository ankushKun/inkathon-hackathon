import { ChainInfo } from '@components/web3/ChainInfo'
import { ConnectButton } from '@components/web3/ConnectButton'
import { ContractIds } from '@deployments/deployments'

import {
  contractQuery,
  decodeOutput,
  useInkathon,
  useRegisteredContract,
} from '@scio-labs/use-inkathon'
import { contractTxWithToast } from '@utils/contractTxWithToast'
import { useState } from 'react'
import 'twin.macro'

export default function Game() {
  const { api, activeAccount, activeSigner } = useInkathon()
  const { contract, address: contractAddress } = useRegisteredContract(ContractIds.Market)

  const [fetchIsLoading, setFetchIsLoading] = useState<boolean>(false)
  const [updateIsLoading, setUpdateIsLoading] = useState<boolean>(false)

  const fetchItemCount = async () => {
    if (!contract || !api) return
    setFetchIsLoading(true)
    try {
      const result = await contractQuery(api, '', contract, 'get_item_count')
      const { output, isError, decodedOutput } = decodeOutput(result, contract, 'get_item_count')
      if (isError) throw new Error(decodedOutput)
      console.log(output)
    } catch (e) {
      console.log('error', e)
    }
  }

  const fetchSpecificItems = async ({ item_id }: { item_id: number[] }) => {
    if (!contract || !api) return
    setFetchIsLoading(true)
    try {
      const result = await contractQuery(api, '', contract, 'get_item', {}, [item_id])
      const { output, isError, decodedOutput } = decodeOutput(result, contract, 'get_item')
      if (isError) throw new Error(decodedOutput)
      console.log(output)
    } catch (e) {
      console.log('error', e)
    }
  }

  const fetchItem = async ({ item_id }: { item_id: number }) => {
    if (!contract || !api) return
    setFetchIsLoading(true)
    try {
      const result = await contractQuery(api, '', contract, 'get_item', {}, [item_id])
      const { output, isError, decodedOutput } = decodeOutput(result, contract, 'get_item')
      if (isError) throw new Error(decodedOutput)
      console.log(output)
    } catch (e) {
      console.log('error', e)
    }
  }

  const fetchAllSuppliers = async () => {
    if (!contract || !api) return
    setFetchIsLoading(true)
    try {
      const result = await contractQuery(api, '', contract, 'get_all_suppliers')
      const { output, isError, decodedOutput } = decodeOutput(result, contract, 'get_all_suppliers')
      if (isError) throw new Error(decodedOutput)
      console.log(output)
    } catch (e) {
      console.log('error', e)
    }
  }

  const fetchSupplierItems = async ({ supplier_address }: { supplier_address: string }) => {
    if (!contract || !api) return
    setFetchIsLoading(true)
    try {
      const result = await contractQuery(api, '', contract, 'get_supplier_items', {}, [
        supplier_address,
      ])
      const { output, isError, decodedOutput } = decodeOutput(
        result,
        contract,
        'get_supplier_items',
      )
      if (isError) throw new Error(decodedOutput)
      console.log(output)
    } catch (e) {
      console.log('error', e)
    }
  }

  const fetchOwnedItems = async ({ owner_address }: { owner_address: string }) => {
    if (!contract || !api) return
    setFetchIsLoading(true)
    try {
      const result = await contractQuery(api, '', contract, 'get_owned_items', {}, [owner_address])
      const { output, isError, decodedOutput } = decodeOutput(result, contract, 'get_owned_items')
      if (isError) throw new Error(decodedOutput)
      console.log(output)
    } catch (e) {
      console.log('error', e)
    }
  }

  const newItem = async ({
    name,
    game,
    uri,
    price,
    max_supply,
  }: {
    name: string
    game: string
    uri: string
    price: number
    max_supply: number
  }) => {
    if (!activeAccount || !contract || !activeSigner || !api) {
      console.log('error')
      return
    }
    setUpdateIsLoading(true)
    try {
      const itm_id = await contractTxWithToast(
        api,
        activeAccount.address,
        contract,
        'new_item',
        {},
        [name, game, uri, price, max_supply],
      )
      console.log(itm_id)
    } catch (e) {
      console.error(e)
    } finally {
      setUpdateIsLoading(false)
    }
  }

  const buyItem = async ({
    buy_from,
    item_id,
    amt_to_buy,
  }: {
    buy_from: string
    item_id: number
    amt_to_buy: number
  }) => {
    if (!activeAccount || !contract || !activeSigner || !api) {
      console.log('error')
      return
    }
    setUpdateIsLoading(true)
    try {
      await contractTxWithToast(api, activeAccount.address, contract, 'buy_item', {}, [
        buy_from,
        item_id,
        amt_to_buy,
      ])
    } catch (e) {
      console.error(e)
    } finally {
      setUpdateIsLoading(false)
    }
  }

  const setItemForSale = async ({
    item_id,
    copies_to_sell,
    price_per_copy,
  }: {
    item_id: number
    copies_to_sell: number
    price_per_copy: number
  }) => {
    if (!activeAccount || !contract || !activeSigner || !api) {
      console.log('error')
      return
    }
    setUpdateIsLoading(true)
    try {
      await contractTxWithToast(api, activeAccount.address, contract, 'set_item_for_sale', {}, [
        item_id,
        copies_to_sell,
        price_per_copy,
      ])
    } catch (e) {
      console.error(e)
    } finally {
      setUpdateIsLoading(false)
    }
  }

  return (
    <div tw="flex h-screen justify-evenly gap-3 bg-gray-800 p-3">
      {/* LEFT PANEL (POKEMON SHOP) */}
      <div tw="w-1/6 rounded-2xl bg-black/60 p-2 px-3">left</div>
      {/* MIDDLE WINDOW (GAME) */}
      <div tw="flex grow flex-col items-center justify-center rounded-2xl bg-black/80 p-2 px-3">
        <ConnectButton />
        <ChainInfo />
      </div>
      {/* RIGHT PANEL (OWNED POKEMONS) */}
      <div tw="w-1/6 rounded-2xl bg-black/60 p-2 px-3">right</div>
    </div>
  )
}
