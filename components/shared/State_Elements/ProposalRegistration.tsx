import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import React, { useContext, useEffect, useRef, useState } from 'react'
import DisplayProposals from '../Display_Lists/DisplayProposals';
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { Abi, parseAbiItem } from 'viem';
import { contractAbi, contractAddress, fromBlock } from '@/constants';
import { publicClient } from '@/utils/client';
import { getBlockNumber } from 'viem/actions';
import { toast } from 'sonner';
import CurrentTransaction from '../Display_Lists/CurrentTransaction';

import { ProposalType, WorkflowStatus } from '../Voting';

import { VoterContext } from '../Voting';


export type ProposalEventType = {
  proposalId : Number,
  blockNumber : Number,
  description : string,
  voteCount : Number
}


const ProposalRegistrationStarted = ({state} : {state: WorkflowStatus}) => {

  const isVoter = useContext(VoterContext)
  
  const [description, setDescription] = useState<string>("");

  //Interact with the smart contract
  const {address} = useAccount()

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



  const saveProposal = () => {
    if (!description) {
      toast.error("Cannot submit an empty proposal", {
          duration: 3000,
          // isClosable: true,
      });
      return;
    }
    writeContract({
      address: contractAddress,
      abi: contractAbi as Abi,
      functionName: 'addProposal',
      args: [description],
      account: address as `0x${string}`,
    });
  }


  //Events
  const [events, setEvents] = useState<ProposalEventType[]>([]);
  
  const getEvents = async() => {

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
    console.log(Logs)
    
    //Get all ids and blockNumbers
    const proposalIds = Logs.map(log => ({
        blockNumber: Number(log.blockNumber),
        proposalId: Number(log.args.proposalId)
    }));

    //Get full proposals from reading the contract
    const Proposals = await Promise.all(
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

    setEvents(Proposals.map(
      proposal => ({
          blockNumber: proposal.prop.blockNumber,
          proposalId: proposal.prop.proposalId,
          description: proposal.description,
          voteCount: proposal.voteCount
      })
    ))
  }
  
  // Lorsque l'on a qqn qui est connecté, on fetch les events
  // useEffect(() => {
  //     const getAllEvents = async() => {
  //         if(address !== undefined) {
  //           await getEvents();
  //         }
  //     }
  //     getAllEvents()
  // }, [address])

  // inside your component
  const expectedAddressRef = useRef<string | null>(null);

  // When address changes, mark that we’re waiting for isVoter to settle
  useEffect(() => {
    if (address) {
      expectedAddressRef.current = address;
    }
  }, [address]);

  // When isVoter updates, check if it matches the address we’re expecting,
  //    then fetch your events once and clear the expectation
  useEffect(() => {
    // only run if we have an expected address and it matches the current one
    if (!expectedAddressRef.current || expectedAddressRef.current !== address) {
      return;
    }

    const load = async () => {
      await getEvents()
    };

    load()
      .catch(console.error)
      .finally(() => {
        // clear so we don’t refetch on every future isVoter change
        expectedAddressRef.current = null;
      });
  }, [isVoter]);



  useEffect(() => {
    if(isSuccess) {
      getEvents();
      toast.success("Success", {
        description: "Proposal registered successfully",
      })
      setDescription(''); // clear input
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
      {state === WorkflowStatus.ProposalsRegistrationStarted ? 
      <>
        <div className='text-xl mb-2'>Proposal</div>
        <div className="w-full">
          <Textarea  
            disabled={!isVoter}
            placeholder={isVoter ? "Type your description here." : "You are not allowed"}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className='flex justify-end mt-1'>
            <Button onClick={saveProposal} disabled={!isVoter} >Save proposal</Button>
          </div>

          <CurrentTransaction hash={hash} isConfirming={isConfirming} isSuccess={isSuccess} errorConfirmation={errorConfirmation} error={error}/>
        </div>
      </> : state === WorkflowStatus.ProposalsRegistrationEnded && 
        <div className='p-10 font-bold'>
          Waiting for the start of the Vote...
        </div>
      }
      
      <div>
        <h1 className='mb-3 font-bold'>Registered Proposals : </h1>
          <DisplayProposals events={events} voting={false}></DisplayProposals>
      </div>
      
    </div>
    
  )
}

export default ProposalRegistrationStarted