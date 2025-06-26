import React, { useContext, useEffect, useRef, useState } from 'react'
import { ProposalType } from '../Voting';
import { useAccount, useConfig, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { ProposalEventType } from './ProposalRegistration';
import { publicClient } from '@/utils/client';
import { contractAbi, contractAddress, fromBlock } from '@/constants';
import { Abi, Account, isAddressEqual, parseAbiItem } from 'viem';

import { VoterContext } from '../Voting';
import DisplayProposals from '../Display_Lists/DisplayProposals';
import { Button } from '@/components/ui/button';
import CurrentTransaction from '../Display_Lists/CurrentTransaction';
import { toast } from 'sonner';

import { WorkflowStatus } from '../Voting';

const VotingElem = ({state} : {state : WorkflowStatus}) => {

  const isVoter = useContext(VoterContext)
  
  const {address} = useAccount()

  //For getting the selected proposal ID
  const [selectedProposalId, setSelectedProposalId] = useState<number | null>(null)


  const { data: hash, error, isPending: setIsPending, writeContract } = useWriteContract({
      mutation: {
        //Check si les transaction reussissent/echouent a se lancer
        // onSuccess: () => {
  
        // },
        // onError: (error) => {
  
        // }
      }
  })

  //Used to check the current transaction state
  const { isLoading: isConfirming, isSuccess, error: errorConfirmation } = useWaitForTransactionReceipt({
      hash
  }) 

  const vote = () => {
    if(selectedProposalId == null){
      console.log("Cannot vote for nothing");
      return;
    }

    writeContract({
      address: contractAddress,
      abi: contractAbi as Abi,
      functionName: 'setVote',
      args: [BigInt(selectedProposalId)],
      account: address as `0x${string}`,
    });
  }




  //Events
  const [proposalEvents, setProposalEvents] = useState<ProposalEventType[]>([]);
    
  const getProposalEvents = async() => {

    if(!isVoter){
      console.log("You are not a voter, you cannot register proposals")
      return
    }

    const Logs = await publicClient.getLogs({
      address: contractAddress,
      event: parseAbiItem("event ProposalRegistered(uint proposalId)"),
      // du premier bloc
      fromBlock: BigInt(fromBlock),
      // jusqu'au dernier
      toBlock: 'latest' // Pas besoin valeur par défaut
    })
    
    
    //Get all ids and blockNumbers
    const proposalIds = Logs.map(log => ({
        blockNumber: Number(log.blockNumber),
        proposalId: Number(log.args.proposalId)
    }));
  
    //Get full proposals from reading the contract

    let Proposals;
    try {
      Proposals = await Promise.all(
        proposalIds.map(async (prop) => {
          const proposal = await publicClient.readContract({
            address: contractAddress,
            abi: contractAbi,
            functionName: "getOneProposal",
            args: [BigInt(prop.proposalId)],
            account: address,
          });
          return {
            prop,
            ...proposal as ProposalType,
          };
        })
      );
    } catch (error) {
      console.log("Error while fetching Proposals:", error);
      return
    }
    

    setProposalEvents(Proposals.map(
        proposal => ({
            blockNumber: proposal.prop.blockNumber,
            proposalId: proposal.prop.proposalId,
            description: proposal.description,
            voteCount: proposal.voteCount
        })
    ))
  }


  const [hasVoted, setHasVoted] = useState<boolean>(false);

  // Get voting events to check if the user has already voted
  const getVotingEvents = async () => {
    if(!isVoter){
      console.log("You are not a voter, you cannot vote")
      return
    }

    if(address == undefined){
      console.log("ERROR : User Undefined")
      toast.error("ERROR : User Undefined", {
          duration: 3000,
      });
      return;
    }

    const Logs = await publicClient.getLogs({
        address: contractAddress,
        event: parseAbiItem("event Voted(address voter, uint proposalId)"),
        // du premier bloc
        fromBlock: BigInt(fromBlock),
        // jusqu'au dernier
        toBlock: 'latest' // Pas besoin valeur par défaut
    })
    const hasUserVoted = Logs.some(log => {      
      const voter = (log.args as any).voter;
      return isAddressEqual(voter, address);
    });
    console.log(hasUserVoted)
    setHasVoted(hasUserVoted);
  }


  // inside your component
  const expectedAddressRef = useRef<string | null>(null);

  // When address changes, mark that we’re waiting for isVoter to settle
  useEffect(() => {
    if (address) {
      expectedAddressRef.current = address;
    }
    getVotingEvents();
  }, [address]);

  // When isVoter updates, check if it matches the address we’re expecting,
  //    then fetch your events once and clear the expectation
  useEffect(() => {
    // only run if we have an expected address and it matches the current one
    if (!expectedAddressRef.current || expectedAddressRef.current !== address) {
      return;
    }

    const load = async () => {
      await getProposalEvents();
      await getVotingEvents();
    };

    load()
      .catch(console.error)
      .finally(() => {
        // clear so we don’t refetch on every future isVoter change
        expectedAddressRef.current = null;
      });
  }, [isVoter]);

//When the state changes, refetch proposal Events
   useEffect(() => {
    getProposalEvents();
  }, [state]);


  useEffect(() => {
    if(isSuccess) {
      getVotingEvents();
      toast.success("Success", {
        description: "Vote registered successfully",
      })
      setSelectedProposalId(null); // clear input
    }
    if(errorConfirmation) {
        toast.error(errorConfirmation.message, {
            duration: 3000,
            // isClosable: true,
        });
    }
  }, [isSuccess, errorConfirmation])


  return (
    <div>
      {state == WorkflowStatus.VotingSessionStarted &&
      <div>
        <div className='text-xl mb-10'>Vote for proposal</div>
        <CurrentTransaction hash={hash} isConfirming={isConfirming} isSuccess={isSuccess} errorConfirmation={errorConfirmation} error={error}/>
        <div className='flex justify-between mx-4'>
          <h1 className='mb-3 font-bold'>Registered Proposals : </h1>
          {isVoter && 
            <Button disabled={!selectedProposalId || hasVoted} onClick={vote}>{hasVoted ? <div>You have already voted</div> : <div>Vote</div>}</Button>
          }
        </div>
      </div>}
      {state == WorkflowStatus.VotingSessionEnded &&
       <div className='p-10 font-bold'>
        Waiting for the votes to be Tallied...
      </div>}
      
      <DisplayProposals events={proposalEvents} voting={state == WorkflowStatus.VotingSessionStarted ? true : false} showVotes={state == WorkflowStatus.VotingSessionEnded ? true : false} selectedProposalId={selectedProposalId} setSelectedProposalId={setSelectedProposalId}></DisplayProposals>
    </div>
  )
}

export default VotingElem