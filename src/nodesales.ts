import { BigInt, Bytes, ethereum, log } from '@graphprotocol/graph-ts'
import { NodeEvent, NodeSale, Purchase, NodeBinding } from '../generated/schema'
import { NodeSaleAdded, NodePurchased, NodeBinded } from '../generated/NodeSale/NodeSale'

export function handleNodeSaleAdded(event: NodeSaleAdded): void {
  const saleId = event.params.id.toString()
  let sale = new NodeSale(saleId)

  
  sale.startTime = event.params.startTime
  sale.title = event.params.title
  sale.quoteToken = event.params.quoteToken
  sale.price = event.params.price
  sale.amount = event.params.amount
  sale.sold = BigInt.fromI32(0)
  sale.enabled = true
  
  sale.save()

  // Create NodeEvent
  const eventId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  let nodeEvent = new NodeEvent(eventId)
  nodeEvent.type = "NODE_SALE_ADDED"
  nodeEvent.nodeSale = sale.id
  nodeEvent.timestamp = event.block.timestamp
  nodeEvent.save()
}

export function handleNodePurchased(event: NodePurchased): void {
  const purchaseId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString()

  const id = event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  let purchase = new Purchase(id)
  purchase.buyer = event.params.buyer
  purchase.saleId = event.params.nodeId
  purchase.count = event.params.count
  purchase.inviteCode = event.params.inviteCode
  purchase.timestamp = event.params.timestamp
  purchase.nodeSale = event.params.nodeId.toString()
  purchase.transactionHash = event.transaction.hash.toHexString()

  // print log
  log.info("1111 Purchase count: =======> {}", [event.params.nodeId.toString()])

  purchase.save()

  // Update NodeSale sold count
  let nodeSale = NodeSale.load(event.params.nodeId.toString())
  if (nodeSale) {
    nodeSale.sold = nodeSale.sold.plus(event.params.count)
    nodeSale.save()
  }
  log.info("22222 Purchase count: =======> {}", [event.params.nodeId.toString()])

  // Create NodeEvent
  let nodeEvent = new NodeEvent(purchaseId)
  nodeEvent.type = "NODE_PURCHASED"
  nodeEvent.nodeSale = event.params.nodeId.toString()
  nodeEvent.buyer = event.params.buyer.toHexString()
  nodeEvent.timestamp = event.block.timestamp
  nodeEvent.save()
  
  log.info("33333 Purchase count: =======> {}", [event.params.nodeId.toString()])

}

export function handleNodeBinded(event: NodeBinded): void {
  const bindId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  let bind = new NodeBinding(bindId)
  bind.buyer = event.params.buyer
  bind.owner = event.params.owner
  bind.npub = event.params.npub
  bind.rewardAddress = event.params.rewardAddress
  bind.save()
}