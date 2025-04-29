import { BigInt, Bytes, ethereum, log } from '@graphprotocol/graph-ts'
import {
  NodeMinted,
  NodeNpubBound,
  NodeActivated,
  NodeStatusChanged,
  Transfer,
  RewardsAdded
} from '../generated/LNNodeNFT/LNNodeNFT'
import { LNNode, NodeEvent, NodeMiningReward, } from '../generated/schema'

function createNodeEvent(
  event: ethereum.Event,
  eventType: string,
  node: LNNode | null = null
): NodeEvent {
  const id = event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
  const nodeEvent = new NodeEvent(id)
  nodeEvent.type = eventType
  nodeEvent.timestamp = event.block.timestamp
  if (node) {
    nodeEvent.node = node.id
  }
  nodeEvent.save()
  return nodeEvent
}

export function handleNodeMinted(event: NodeMinted): void {
  const tokenId = event.params.tokenId.toString()
  let node = new LNNode(tokenId)
  node.tokenId = event.params.tokenId
  node.owner = event.params.owner
  node.buyer = event.params.buyer
  node.createdAt = event.block.timestamp
  node.updatedAt = event.block.timestamp
  node.status = 0
  node.save()

  createNodeEvent(event, "MINTED", node)
}

export function handleNodeNpubBound(event: NodeNpubBound): void {
  const tokenId = event.params.tokenId.toString()
  let node = LNNode.load(tokenId)
  if (node) {
    node.npub = event.params.nodeNpub
    node.updatedAt = event.block.timestamp
    node.save()
    createNodeEvent(event, "NPUB_BOUND", node)
  }
}

export function handleNodeActivated(event: NodeActivated): void {
  const tokenId = event.params.tokenId.toString()
  let node = LNNode.load(tokenId)
  if (node) {
    node.lndPubkey = event.params.lndPubkey
    node.npub = event.params.nodeNpub
    node.status = 2 // Active
    node.updatedAt = event.block.timestamp
    node.save()
    createNodeEvent(event, "ACTIVATED", node)
  }
}

export function handleNodeStatusChanged(event: NodeStatusChanged): void {
  const tokenId = event.params.tokenId.toString()
  let node = LNNode.load(tokenId)
  if (node) {
    node.status = event.params.status.toI32()
    node.updatedAt = event.block.timestamp
    node.save()
    createNodeEvent(event, "STATUS_CHANGED", node)
  }
}

export function handleTransfer(event: Transfer): void {
  const tokenId = event.params.tokenId.toString()
  let node = LNNode.load(tokenId)
  if (node) {
    node.owner = event.params.to
    node.updatedAt = event.block.timestamp
    node.save()
    createNodeEvent(event, "TRANSFERRED", node)
  }
}

export function handleRewardsAdded(event: RewardsAdded): void {
  const tokenId = event.params.tokenId.toString()
  let node = LNNode.load(tokenId)
  
  if (node) {
    // Create static reward
    const staticRewardId = tokenId + '-0' // 0 for static reward
    let staticReward = new NodeMiningReward(staticRewardId)
    staticReward.node = node.id
    staticReward.rewardType = 0
    staticReward.totalAmount = event.params.staticAmount
    staticReward.claimedAmount = BigInt.fromI32(0)
    staticReward.createdAt = event.block.timestamp
    staticReward.updatedAt = event.block.timestamp
    staticReward.save()

    // Create dynamic reward
    const dynamicRewardId = tokenId + '-1' // 1 for dynamic reward
    let dynamicReward = new NodeMiningReward(dynamicRewardId)
    dynamicReward.node = node.id
    dynamicReward.rewardType = 1
    dynamicReward.totalAmount = event.params.dynamicAmount
    dynamicReward.claimedAmount = BigInt.fromI32(0)
    dynamicReward.createdAt = event.block.timestamp
    dynamicReward.updatedAt = event.block.timestamp
    dynamicReward.save()

    // Create airdrop reward
    const airdropRewardId = tokenId + '-2' // 2 for airdrop reward
    let airdropReward = new NodeMiningReward(airdropRewardId)
    airdropReward.node = node.id
    airdropReward.rewardType = 2
    airdropReward.totalAmount = event.params.airdropAmount
    airdropReward.claimedAmount = BigInt.fromI32(0)
    airdropReward.createdAt = event.block.timestamp
    airdropReward.updatedAt = event.block.timestamp
    airdropReward.save()
    
    createNodeEvent(event, "REWARDS_ADDED", node)
  }
} 