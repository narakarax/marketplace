import { Parcel } from './parcel/types'
import { Estate } from './estate/types'
import { Wearable } from './wearable/types'

export enum NFTCategory {
  PARCEL = 'parcel',
  ESTATE = 'estate',
  WEARABLE = 'wearable'
}

export enum NFTSortBy {
  NAME = 'name',
  CREATED_AT = 'createdAt',
  ORDER_CREATED_AT = 'searchOrderCreatedAt',
  PRICE = 'searchOrderPrice'
}

export type NFT = {
  id: string
  contractAddress: string
  tokenId: string
  activeOrderId: string | null
  owner: {
    address: string
  }
  name: string
  category: NFTCategory
  image: string
  parcel: Parcel | null
  estate: Estate | null
  wearable: Wearable | null
}
