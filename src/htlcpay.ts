import { BigInt, Bytes, ethereum, log } from '@graphprotocol/graph-ts'
import {
  LogNewPair,
  LogNewAsset,
  LogNewToken,
  LogHTLCNew,
  LogHTLCWithdraw,
  LogHTLCRefund,
  HashedTimeLock
} from '../generated/HashedTimeLock/HashedTimeLock'
import { AstraAsset, AstraHTLC, AstraPair, AstraToken } from '../generated/schema'

export function handleNewPair(event: LogNewPair): void {
    log.info("NewPair - pairId: {}", [event.params.pairId.toHexString()])
    let pair = new AstraPair(event.params.pairId.toHexString())

    let asset = AstraAsset.load(event.params.assetId.toHexString())
    if (!asset) {
        log.error("NewPair - Asset not found for assetId: {}", [event.params.assetId.toHexString()])
        return
    }

    let token = AstraToken.load(event.params.token.toHexString())
    if (!token) {
        log.error("NewPair - Token not found for tokenId: {}", [event.params.token.toHexString()])
        return
    }
    
    pair.pairId = event.params.pairId
    pair.token = token.id
    pair.asset = asset.id
    pair.createdAt = event.block.timestamp
    pair.transactionHash = event.transaction.hash.toHexString()
    pair.save()
    log.info("NewPair - pairId: {}", [event.params.pairId.toHexString()])
}

export function handleNewAsset(event: LogNewAsset): void {
    log.info("NewAsset - assetId: {}", [event.params.assetId.toHexString()])
    let asset = new AstraAsset(event.params.assetId.toHexString())
    asset.name = event.params.name
    asset.decimal = event.params.decimal
    asset.createdAt = event.block.timestamp
    asset.transactionHash = event.transaction.hash.toHexString()
    asset.save()
    log.info("NewAsset - assetId: {}", [event.params.assetId.toHexString()])
}

export function handleNewToken(event: LogNewToken): void {
    log.info("NewToken - tokenId: {}", [event.params.token.toHexString()])
    let token = new AstraToken(event.params.token.toHexString())
    token.decimal = event.params.decimal
    token.name = event.params.name
    token.createdAt = event.block.timestamp
    token.transactionHash = event.transaction.hash.toHexString()
    token.save()
    log.info("NewToken - tokenId: {}", [event.params.token.toHexString()])
}

export function handleHTLCNew(event: LogHTLCNew): void {
    log.info("HTLCNew - contractId: {}", [event.params.hashlock.toHexString()])
    const contractId = event.params.hashlock.toHexString()

    let pair = AstraPair.load(event.params.pairId.toHexString())
    if (!pair) {
        log.error("HTLCNew - Pair not found for contractId: {}", [contractId])
        return
    }

    let htlc = new AstraHTLC(contractId)
    htlc.sender = event.params.sender
    htlc.receiver = event.params.receiver
    htlc.pair = pair.id
    htlc.amount = event.params.amount
    htlc.hashlock = event.params.hashlock
    htlc.timelock = event.params.timelock
    htlc.withdrawn = false
    htlc.refunded = false
    htlc.createdAt = event.block.timestamp
    htlc.nodePubkey = event.params.nodePubkey
    htlc.save()
    
    log.info("HTLC New - contractId: {}, sender: {}, receiver: {}, amount: {}", [
      contractId,
      event.params.sender.toHexString(),
      event.params.receiver.toHexString(),
      event.params.amount.toString()
    ])

}

export function handleHTLCWithdraw(event: LogHTLCWithdraw): void {
  const contractId = event.params.contractId.toHexString()
  
  // load htlc
  let timeLock = AstraHTLC.load(contractId)
  if (timeLock) {
    // load contract
    let contract = HashedTimeLock.bind(event.address)
    // log.info("contract {} ", ["success"])
    let contractInfo = contract.getContractByKey(event.params.contractId)

    timeLock.withdrawn = true
    timeLock.preimage = contractInfo.preimage
    timeLock.watcher = contractInfo.watcher
    timeLock.closedAt = event.block.timestamp
    timeLock.save()
    
    log.info("HTLC Withdraw - contractId: {}", [contractId])
  } else {
    log.error("HTLC Withdraw - TimeLock not found for contractId: {}", [contractId])
  }
}

export function handleHTLCRefund(event: LogHTLCRefund): void {
  const contractId = event.params.contractId.toHexString()
  
  // 更新 TimeLock 实体
  let timeLock = AstraHTLC.load(contractId)
  if (timeLock) {
    // load contract
    let contract = HashedTimeLock.bind(event.address)
    // log.info("contract {} ", ["success"])
    let contractInfo = contract.getContractByKey(event.params.contractId)

    timeLock.refunded = true
    timeLock.closedAt = event.block.timestamp
    timeLock.watcher = contractInfo.watcher
    timeLock.save()
    
    log.info("HTLC Refund - contractId: {}", [contractId])
  } else {
    log.error("HTLC Refund - TimeLock not found for contractId: {}", [contractId])
  }
} 