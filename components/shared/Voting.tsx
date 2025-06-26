'use client'

import { useEffect, useState, createContext } from "react"
import { Button } from "../ui/button";
import { toast } from "sonner"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

import { AlertCircleIcon, CheckCircle2Icon, PopcornIcon, CircleChevronRight, ClockFading } from "lucide-react"


//Custom State elements
import RegisteringVoters from "./State_Elements/RegisteringVoters";
import ProposalRegistration from "./State_Elements/ProposalRegistration";
import VotingElem from "./State_Elements/VotingElem";
import VotingEnded from "./State_Elements/VotingEnded";
import VotesTallied from "./State_Elements/VotesTallied";

import { contractAddress, contractAbi, fromBlock } from "@/constants"
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { Abi, Account, isAddressEqual, parseAbiItem } from "viem";

import { publicClient } from "@/utils/client";
import CurrentTransaction from "./Display_Lists/CurrentTransaction";
import DisplayState from "./State_Elements/DisplayState";


//State Enum
export enum WorkflowStatus {
    RegisteringVoters,            // Phase for registering voters
    ProposalsRegistrationStarted, // Phase where proposals can be submitted
    ProposalsRegistrationEnded,   // Phase indicating proposal submission ended
    VotingSessionStarted,         // Phase where voting is open
    VotingSessionEnded,           // Phase indicating voting has ended
    VotesTallied             // Phase where votes have been counted
}

export type ProposalType = {
  description : string,
  voteCount : Number
}

//Type for events
export type RegisteringEventType = {
  blockNumber: number,
  address: string,
}

//Create context for global variables
type StateContextType = {
  currentState: WorkflowStatus;
  setCurrentState: React.Dispatch<React.SetStateAction<WorkflowStatus>>;
};

export const StateContext = createContext<StateContextType | undefined>(undefined);


export const AdminContext = createContext<boolean>(false);
export const VoterContext = createContext<boolean>(false);


export const Voting = () => {


  //Interaction with smart contract
  const { address } = useAccount()

  // //Used to read the contract current state
  const { data: owner, error: getErrorOwner, isPending: getOwnerIsPending, refetch: refetchOwner } = useReadContract({
    address: contractAddress,
    abi: contractAbi as Abi,
    functionName: 'owner',
    account: address as `0x${string}` | Account | undefined
  })

  

  const refetchEverything = async() => {
    await refetchOwner();
    // await refetchVoter();
    // await getEvents();
  }



  /******** Variables *********/

  const [currentState, setCurrentState] = useState<WorkflowStatus>(WorkflowStatus.RegisteringVoters);
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [isVoter, setIsVoter] = useState<boolean>(false)


  //Events
  const [registeringEvents, setRegisteringEvents] = useState<RegisteringEventType[]>([]);

  const getEvents = async() => {
    const Logs = await publicClient.getLogs({
        address: contractAddress,
        event: parseAbiItem("event VoterRegistered(address voterAddress)"),
        // du premier bloc
        fromBlock: BigInt(fromBlock),
        // jusqu'au dernier
        toBlock: 'latest' // Pas besoin valeur par défaut
    })
    console.log(Logs)
    // Et on met ces events dans le state "depositEvents" en formant un objet cohérent pour chaque event
    setRegisteringEvents(Logs.map(
        log => ({
            blockNumber: Number(log.blockNumber),
            address: log.args.voterAddress ?? "Invalid"
        })
    ))
  }

  //function for checking role
  const checkRole = () => {
      console.log(owner)
      //Check si admin
      if(address == owner){
        setIsAdmin(true)
      }else{
        setIsAdmin(false)
      }

      
      // Check si l'adresse est enregistrée comme voter via les events
      const isAddressVoter = registeringEvents.some(
        (event) => isAddressEqual(event.address as `0x${string}`, address ? address : `0x${""}`)
      );
      setIsVoter(isAddressVoter);
  }

  // Lorsque l'on a qqn qui est connecté, on fetch les events
  useEffect(() => {
      const getAllEvents = async() => {
          if(address !== undefined) {
            await getEvents();
          }
      }
      getAllEvents()
  }, [address])


  // Lorsque la list des events change, on update son role
  useEffect(() => {
    checkRole()
  }, [registeringEvents])


  //Object map to display components depending on currentState
  const stateComponents = {
      [WorkflowStatus.RegisteringVoters]: <RegisteringVoters events={registeringEvents} getEvents={getEvents}/>,

      [WorkflowStatus.ProposalsRegistrationStarted]: <ProposalRegistration state={WorkflowStatus.ProposalsRegistrationStarted}/>,

      [WorkflowStatus.ProposalsRegistrationEnded]: <ProposalRegistration state={WorkflowStatus.ProposalsRegistrationEnded} />,

      [WorkflowStatus.VotingSessionStarted]: <VotingElem state={WorkflowStatus.VotingSessionStarted}/>,

      [WorkflowStatus.VotingSessionEnded]: <VotingElem state={WorkflowStatus.VotingSessionEnded}/>,

      [WorkflowStatus.VotesTallied]: <VotesTallied />,
  };
  

  return (
    <div>
      <div className="relative flex justify-center items-center px-4 mb-10">
        <div className="text-5xl" >Voting App</div>
        <div className="absolute right-4 flex flex-col items-end" >
          <div>Your Role : </div>
          <div className="font-bold text-blue-600">
            {!!isAdmin || !!isVoter ? (
              <>
                {isAdmin && "ADMIN"}
                {isAdmin && isVoter && ", "}
                {isVoter && "VOTER"}
              </>
            ) : (
              "None"
            )}
          </div>
        </div>
      </div>


      <AdminContext value={isAdmin}>
        <VoterContext value={isVoter}>
          <StateContext value={{currentState: currentState, setCurrentState: setCurrentState}}>

            <DisplayState/>

          </StateContext>
          <div className="p-6 border-t">
            {stateComponents[currentState] || <div>Unknown State</div>}
          </div>

        </VoterContext>        
      </AdminContext>
      
    </div>
  )
}
