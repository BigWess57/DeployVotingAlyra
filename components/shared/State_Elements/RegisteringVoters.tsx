'use client'
import React, { useContext, useEffect, useState } from 'react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from "sonner"

import DisplayVoters from '../Display_Lists/DisplayVoters'

import { contractAbi, contractAddress } from '@/constants'
import { Abi, Address, isAddress, parseAbiItem } from 'viem'
import { publicClient } from '@/utils/client'
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import CurrentTransaction from '../Display_Lists/CurrentTransaction'

import { RegisteringEventType } from '../Voting'

import { AdminContext } from '../Voting'

const RegisteringVoters = ({events, getEvents} : {events : RegisteringEventType[], getEvents : () => void}) => {
  const isAdmin = useContext(AdminContext)

  const { address } = useAccount()

  const [toRegister, setToRegister] = useState<string>('');
  

  //Used to interact with the contract
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


  const registerVoter = () => {
    if (!isAddress(toRegister)) {
      toast.error("Invalid Ethereum Address", {
          duration: 3000,
          // isClosable: true,
      });
      return;
    }
    
    try {
      writeContract({
        address: contractAddress,
        abi: contractAbi as Abi,
        functionName: 'addVoter',
        args: [toRegister],
        account: address as `0x${string}`,
      });
    } 
    catch (error) {
      console.error('Error registering voter:', error);
      toast.error("Error : " + error, {
          duration: 3000,
          // isClosable: true,
      });
    }
  }


   useEffect(() => {
        if(isSuccess) {
          getEvents();
          toast.success("Success", {
            description: "Voter " + toRegister + " registered successfully",
          })
          setToRegister(''); // clear input
        }
        if(errorConfirmation) {
            toast.error(errorConfirmation.message, {
                duration: 3000,
                // isClosable: true,
            });
        }
    }, [isSuccess, errorConfirmation])


  return (
    <div className='p-4'>
        {isAdmin &&
          <div className='flex mb-8'>
            <Input placeholder='Address to register' value={toRegister} onChange={(e) => {
              setToRegister(e.target.value);
            }}/>
            <Button onClick={registerVoter}>Register Voter</Button>
          </div>
        }
        <CurrentTransaction hash={hash} isConfirming={isConfirming} isSuccess={isSuccess} errorConfirmation={errorConfirmation} error={error}/>
        <div>
          <h1 className='mb-3 font-bold'>Registered Voters : </h1>
            <DisplayVoters events={events}></DisplayVoters>
        </div>   
    </div>
  )
}

export default RegisteringVoters