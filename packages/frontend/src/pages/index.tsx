import { Button } from '@chakra-ui/react'
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
import Image from 'next/image'
import { useEffect, useState } from 'react'
import 'twin.macro'

type Item = {
  name: string
  game: string
  uri: string
  price: string
  maxSupply: string
  currentSupply: string
  seller: string
  owners: string[]
}

export default function Game() {
  const { api, activeAccount, activeSigner, activeChain } = useInkathon()
  const { contract, address: contractAddress } = useRegisteredContract(ContractIds.Market)
  const [chainInfo, setChainInfo] = useState<{ [_: string]: any }>()

  const [allPokemons, setAllPokemons] = useState<Item[]>([])
  const [ownedPokemons, setOwnedPokemons] = useState<Item[]>([])
  const [selectedPokemon, setSelectedPokemon] = useState<Item>()

  const PokemonShopItem = ({
    img,
    name,
    price,
    item_id,
    seller,
  }: {
    img: string
    name: string
    price: number
    item_id: number
    seller: string
  }) => {
    return (
      <div tw="relative my-2 flex rounded-xl bg-white/10 py-1">
        <Image src={img} width={69} height={69} alt="pokemon" tw="h-20 w-20 p-2" />
        <div tw="grow pr-2 text-right">
          <div tw="font-bold">{name}</div>
          <div tw="">
            {price} {chainInfo?.Token}
          </div>
          <Button
            tw="ml-auto block rounded-lg px-2 font-bold"
            marginLeft="auto"
            colorScheme="purple"
            size="sm"
            onClick={() => {
              buyItem({ buy_from: seller, item_id, amt_to_buy: 1 })
            }}
          >
            buy
          </Button>
        </div>
      </div>
    )
  }

  const MyPokemon = ({
    img,
    name,
    price,
    item_id,
    seller,
  }: {
    img: string
    name: string
    price: number
    item_id: number
    seller: string
  }) => {
    return (
      <div tw="relative my-2 flex rounded-xl bg-white/10 py-1">
        <Image src={img} width={69} height={69} alt="pokemon" tw="h-20 w-20 p-2" />
        <div tw="grow pr-2 text-right">
          <div tw="font-bold">{name}</div>
          {/* <div tw="">{price} {chainInfo?.Token}</div> */}
          <Button
            tw="absolute bottom-2 right-2 ml-auto block rounded-lg px-2 font-bold"
            marginLeft="auto"
            colorScheme="purple"
            size="sm"
          >
            use in battle
          </Button>
        </div>
      </div>
    )
  }

  const fetchChainInfo = async () => {
    if (!api) {
      setChainInfo(undefined)
      return
    }

    const chain = (await api.rpc.system.chain())?.toString() || ''
    const version = (await api.rpc.system.version())?.toString() || ''
    const properties = ((await api.rpc.system.properties())?.toHuman() as any) || {}
    const tokenSymbol = properties?.tokenSymbol?.[0] || 'UNIT'
    const tokenDecimals = properties?.tokenDecimals?.[0] || 12
    const chainInfo = {
      Chain: chain,
      Version: version,
      Token: `${tokenSymbol}`,
    }
    setChainInfo(chainInfo)
  }
  useEffect(() => {
    fetchChainInfo()
  }, [api])

  const fetchItemCount = async () => {
    if (!contract || !api) return
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
    try {
      const result = await contractQuery(api, '', contract, 'get_item', {}, [item_id])
      const { output, isError, decodedOutput } = decodeOutput(result, contract, 'get_item')
      if (isError) throw new Error(decodedOutput)
      console.log(output)
    } catch (e) {
      console.log('error', e)
    }
  }

  const fetchAllItems = async () => {
    if (!contract || !api) return
    try {
      console.log('fetching all items')
      const result = await contractQuery(api, '', contract, 'get_all_items')
      const { output, isError, decodedOutput } = decodeOutput(result, contract, 'get_all_items')
      if (isError) throw new Error(decodedOutput)
      console.log(output)
      setAllPokemons(output)
    } catch (e) {
      console.log('error', e)
    }
  }

  const fetchAllSuppliers = async () => {
    if (!contract || !api) return
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

  const fetchOwnedItems = async (owner_address: string) => {
    if (!contract || !api) return
    try {
      const result = await contractQuery(api, '', contract, 'get_owned_items', {}, [owner_address])
      const { output, isError, decodedOutput } = decodeOutput(result, contract, 'get_owned_items')
      if (isError) throw new Error(decodedOutput)
      console.log(output)
      setOwnedPokemons(output)
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
      /* empty */
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
    try {
      await contractTxWithToast(api, activeAccount.address, contract, 'buy_item', {}, [
        buy_from,
        item_id,
        amt_to_buy,
      ])
    } catch (e) {
      console.error(e)
    } finally {
      /* empty */
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
    try {
      await contractTxWithToast(api, activeAccount.address, contract, 'set_item_for_sale', {}, [
        item_id,
        copies_to_sell,
        price_per_copy,
      ])
    } catch (e) {
      console.error(e)
    } finally {
      /* empty */
    }
  }

  useEffect(() => {
    fetchAllItems()
  }, [api, contract])

  useEffect(() => {
    if (!activeAccount) return
    fetchOwnedItems(activeAccount.address)
  }, [api, contract])

  return (
    <div tw="flex h-screen justify-evenly gap-3 bg-gray-800 p-3">
      {/* LEFT PANEL (POKEMON SHOP) */}
      <div tw="w-1/6 rounded-2xl bg-black/60 p-2 px-3">
        <div tw="rounded-xl bg-white/10 text-center">Pokemon Shop</div>
        {allPokemons.map((item, index) => {
          console.log(item)
          return (
            <PokemonShopItem
              key={index}
              img={item.uri}
              name={item.name}
              price={parseInt(item.price)}
              item_id={index}
              seller={item.seller}
            />
          )
        })}
      </div>
      {/* MIDDLE WINDOW (GAME) */}
      <div tw="flex grow flex-col items-center justify-center rounded-2xl bg-black/80 p-2 px-3">
        <ConnectButton />
        <ChainInfo />
        <Button margin={3}>Start Game</Button>
      </div>
      {/* RIGHT PANEL (OWNED POKEMONS) */}
      <div tw="w-1/6 rounded-2xl bg-black/60 p-2 px-3">
        <div tw="rounded-xl bg-white/10 text-center">My Pokemons</div>
        {ownedPokemons.map((item, index) => {
          console.log(item)
          return (
            <MyPokemon
              key={index}
              img={item.uri}
              name={item.name}
              price={parseInt(item.price)}
              item_id={index}
              seller={item.seller}
            />
          )
        })}
      </div>
    </div>
  )
}
