import { log } from '@graphprotocol/graph-ts'
import {
  OrderCreated,
  OrderSuccessful,
  OrderCancelled
} from '../entities/Marketplace/Marketplace'
import { Order, NFT, Parcel, Wearable, Estate } from '../entities/schema'
import { getNFTId } from '../modules/nft'
import { getCategory } from '../modules/category'
import { buildCountFromOrder } from '../modules/count'
import * as status from '../modules/order/status'
import * as categories from '../modules/category/categories'

export function handleOrderCreated(event: OrderCreated): void {
  let category = getCategory(event.params.nftAddress.toHexString())
  let nftId = getNFTId(
    category,
    event.params.nftAddress.toHexString(),
    event.params.assetId.toString()
  )
  let orderId = event.params.id.toHex()

  let nft = NFT.load(nftId)
  if (nft == null) {
    log.error('Undefined NFT {} for order {}', [nftId, orderId])
    throw new Error('Undefined NFT')
  }

  let order = new Order(orderId)
  order.status = status.OPEN
  order.category = category
  order.nft = nftId
  order.nftAddress = event.params.nftAddress
  order.txHash = event.transaction.hash
  order.owner = event.params.seller
  order.price = event.params.priceInWei
  order.expiresAt = event.params.expiresAt
  order.blockNumber = event.block.number
  order.createdAt = event.block.timestamp
  order.updatedAt = event.block.timestamp

  order.save()

  let oldOrder = Order.load(nft.activeOrder)
  if (oldOrder != null) {
    // Here we are setting old orders as cancelled, because the smart contract allows new orders to be created
    // and they just overwrite them in place. But the subgraph stores all orders ever
    // you can also overwrite ones that are expired
    oldOrder.status = status.CANCELLED
    oldOrder.updatedAt = event.block.timestamp
    oldOrder.save()
  }

  nft.activeOrder = orderId
  nft.searchOrderStatus = status.OPEN
  nft.searchOrderExpiresAt = event.params.expiresAt
  nft.save()

  let count = buildCountFromOrder(order)
  count.save()
}

export function handleOrderSuccessful(event: OrderSuccessful): void {
  let category = getCategory(event.params.nftAddress.toHexString())
  let nftId = getNFTId(
    category,
    event.params.nftAddress.toHexString(),
    event.params.assetId.toString()
  )
  let orderId = event.params.id.toHex()

  let order = new Order(orderId)
  order.category = category
  order.status = status.SOLD
  order.buyer = event.params.buyer
  order.price = event.params.totalPrice
  order.blockNumber = event.block.number
  order.updatedAt = event.block.timestamp
  order.save()

  let nft = new NFT(nftId)
  nft.owner = event.params.buyer.toHex()
  nft.activeOrder = null
  nft.searchOrderStatus = status.SOLD
  nft.save()
}

export function handleOrderCancelled(event: OrderCancelled): void {
  let category = getCategory(event.params.nftAddress.toHexString())
  let nftId = getNFTId(
    category,
    event.params.nftAddress.toHexString(),
    event.params.assetId.toString()
  )
  let orderId = event.params.id.toHex()

  let order = new Order(orderId)
  order.category = category
  order.status = status.CANCELLED
  order.blockNumber = event.block.number
  order.updatedAt = event.block.timestamp
  order.save()

  let nft = new NFT(nftId)
  nft.activeOrder = null
  nft.searchOrderStatus = status.CANCELLED
  nft.save()
}
