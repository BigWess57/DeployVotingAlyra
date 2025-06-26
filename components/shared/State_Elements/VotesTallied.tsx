import React, { useState } from 'react'
import { ProposalEventType } from './ProposalRegistration';
import { contractAbi, contractAddress } from '@/constants';
import { Abi, Account, parseAbiItem } from 'viem';
import { useAccount, useReadContract } from 'wagmi';

const VotesTallied = () => {

  const {address} = useAccount()

  // //Used to read the contract current state
  const { data: winningProposalID, error: getError, isPending: getIsPending, refetch: refetch } = useReadContract({
    address: contractAddress,
    abi: contractAbi as Abi,
    functionName: 'winningProposalID',
    account: address as `0x${string}` | Account | undefined
  })
  

  return (
    <div className='text-2xl text-center text-green-600 font-bold'>VotesTallied ! Winning proposal : {Number(winningProposalID)}</div>

  )
}

export default VotesTallied