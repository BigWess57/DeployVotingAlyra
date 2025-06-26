import { useContext, useEffect, useRef } from "react"

import { Button } from "@/components/ui/button"
import { toast } from "sonner"


import { contractAbi, contractAddress } from "@/constants"
import CurrentTransaction from "../Display_Lists/CurrentTransaction"

import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi"
import { Abi, Account } from "viem"

import { AdminContext, StateContext } from "../Voting"


//State Enum
enum WorkflowStatus {
    RegisteringVoters,            // Phase for registering voters
    ProposalsRegistrationStarted, // Phase where proposals can be submitted
    ProposalsRegistrationEnded,   // Phase indicating proposal submission ended
    VotingSessionStarted,         // Phase where voting is open
    VotingSessionEnded,           // Phase indicating voting has ended
    VotesTallied             // Phase where votes have been counted
}

const DisplayState = () => {
    //get the state context
    const state = useContext(StateContext)
    const isAdmin = useContext(AdminContext)

    //For tracking Mount
    // const hasMounted = useRef(false);
    
    //Interaction with smart contract
    const { address } = useAccount()

    //Used to read the contract current state
    const { data: stateInContract, error: getError, isPending: getIsPending, refetch } = useReadContract({
        address: contractAddress,
        abi: contractAbi as Abi,
        functionName: 'workflowStatus',
        account: address as `0x${string}` | Account | undefined
    })

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

    const refetchEverything = async() => {
        await refetch();
        // await getEvents();
    }

    
    //Function used for changing state
    const changeState = async () => {
        console.log(stateInContract)
        console.log(state)
        try {
            switch (state?.currentState) {
            case WorkflowStatus.RegisteringVoters:
                writeContract({
                    address: contractAddress,
                    abi: contractAbi,
                    functionName: 'startProposalsRegistering',
                })
                break;
            case WorkflowStatus.ProposalsRegistrationStarted:
                console.log(state)
                writeContract({
                    address: contractAddress,
                    abi: contractAbi,
                    functionName: 'endProposalsRegistering',
                })
                break;
            case WorkflowStatus.ProposalsRegistrationEnded:
                writeContract({
                    address: contractAddress,
                    abi: contractAbi,
                    functionName: 'startVotingSession',
                })
                break;
            case WorkflowStatus.VotingSessionStarted:
                writeContract({
                    address: contractAddress,
                    abi: contractAbi,
                    functionName: 'endVotingSession',
                })
                break;
            case WorkflowStatus.VotingSessionEnded:
                writeContract({
                    address: contractAddress,
                    abi: contractAbi,
                    functionName: 'tallyVotes',
                })
                break;
            default:
                toast.warning("Warning", {
                    description: "No further state transitions available.",
                });
                console.log("No further state transitions available.");
            }
        } catch (error) {
            console.error("Error changing state:", error);
        }
    }

    //To display state names
    const stateLabels = {
        [WorkflowStatus.RegisteringVoters]: "Registering Voters",
        [WorkflowStatus.ProposalsRegistrationStarted]: "Proposal Registration Started",
        [WorkflowStatus.ProposalsRegistrationEnded]: "Proposal Registration Ended",
        [WorkflowStatus.VotingSessionStarted]: "Voting Started",
        [WorkflowStatus.VotingSessionEnded]: "Voting Ended",
        [WorkflowStatus.VotesTallied]: "Votes Tallied"
    };


    //Lorsqu'une transaction est effectuée, informer l'utilisateur de l'outcome
    useEffect(() => {
        if(isSuccess) {
            refetchEverything().then(() => {
                let stateValue = (stateInContract as WorkflowStatus | undefined);
                if (stateValue) {
                    stateValue++;
                    toast.success("State change", {
                        description: "Current state has been changed to '" + stateLabels[stateValue] + "'",
                    }) 
                }
            });
            
        }
        if(errorConfirmation) {
            toast.error(errorConfirmation.message, {
                duration: 3000,    
                // isClosable: true,
            });
        }
    }, [isSuccess, errorConfirmation])


    useEffect(() => {
        // console.log(state)
        //Convert the state value in Number
        const stateValue = (stateInContract as WorkflowStatus | undefined);
        
        if (stateValue) {
            //Set the state of our app
            state?.setCurrentState(stateValue);

            // if (!hasMounted.current) {
            //     // Skip on initial mount
            //     hasMounted.current = true;
            //     return;
            // }
            // toast pour prevenir l'utilisateur
            // toast.success("State change", {
            //     description: "Current state has been changed to '" + stateLabels[stateValue] + "'",
            // })
        }
    }, [stateInContract])


    return (
        <>
            <div className="flex items-center p-4 mb-5">
                <div className="ml-10 grow">Current State : <span className="font-bold text-blue-600">{state ? stateLabels[state.currentState] : "Unknown state"}</span></div>
            
                <Button className="bg-orange-600" onClick={changeState} disabled={!isAdmin || state?.currentState == WorkflowStatus.VotesTallied}>Go to next State</Button>
            </div>

            <CurrentTransaction hash={hash} isConfirming={isConfirming} isSuccess={isSuccess} errorConfirmation={errorConfirmation} error={error ?? null} />
        </>
    )
}

export default DisplayState