
import { Card } from "@/components/ui/card"
import { ProposalEventType } from "../State_Elements/ProposalRegistration"
import { Badge } from "@/components/ui/badge"
import { useContext, useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"

import { VoterContext } from "../Voting"


const DisplayProposals = ({
  events, voting, showVotes = false, selectedProposalId = null, setSelectedProposalId = () => {}
} : {
  events : ProposalEventType[], 
  voting: boolean, 
  showVotes: boolean,
  selectedProposalId: number | null, 
  setSelectedProposalId: (id: number | null) => void
}) => {

  const isVoter = useContext(VoterContext)

  return (
    <> 
      {/* {voting ?  */}
        <div className='p-4 flex flex-col w-full'>
          {events?.length > 0 && events.map((event) => {
            return (
              <Card className="p-4 mb-2 bg-[#fff3bf]" key={event.proposalId}>
                <div className="flex">
                  {voting && isVoter && 
                    <div className="mr-4">
                      <Checkbox
                        id={`select-${event.proposalId}`}
                        checked={selectedProposalId == event.proposalId}
                        onCheckedChange={(checked) => {
                          setSelectedProposalId(checked ? event.proposalId : null)
                        }}
                      />
                    </div>
                  }
                  
                  <div className="flex flex-col gap-1 w-full">
                    <div className="flex items-center">
                      <div>
                        <span className="font-semibold text-gray-700">Proposal ID: </span>{" "}
                        <span className="font-bold text-blue-700 ml-2">{event.proposalId}</span>
                      </div>
                      <p className='ml-2 mr-2'>|</p>
                      <div>
                        <span className="font-semibold text-gray-700">Block Number: </span>{" "}
                        <span className="font-bold text-green-700 ml-2">{event.blockNumber}</span>
                      </div>
                      {showVotes && 
                        <div className="flex gap-2 ml-auto">
                          <span className="text-gray-700">Votes :</span>
                          <span className="font-bold text-orange-600">{event.voteCount}</span>
                        </div>
                      }
                    </div>

                    <div className="w-full">
                      <span className="font-semibold text-gray-700">Description:</span>{" "}
                      <span className="text-black block whitespace-normal break-words break-all">{event.description}</span>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
        {/* //  :
        // <div className='p-4 flex flex-col w-full'>
        //   {events?.length > 0 && events.map((event) => {
        //     return (
        //       <Card className="p-4 mb-2 bg-[#fff3bf]" key={event.proposalId}>
        //         <div className="flex flex-col gap-1">
        //           <div className="flex justify-between w-full">
        //             <div className="flex gap-2">
        //               <span className="font-semibold text-gray-700">Proposal ID:</span>
        //               <span className="font-bold text-blue-700">{event.proposalId}</span>
        //               <span className="text-gray-400">|</span>
        //               <span className="font-semibold text-gray-700">Block Number:</span>
        //               <span className="font-bold text-green-700">{event.blockNumber}</span>
        //             </div>
        //             <div className="flex gap-2 items-center ">
        //               <span className="text-gray-700">Votes :</span>
        //               <span className="font-bold text-black">{event.voteCount}</span>
        //             </div>
        //           </div>
        //           <div>
        //             <span className="font-semibold text-gray-700">Description:</span>{" "}
        //             <span className="text-black">{event.description}</span>
        //           </div>
        //         </div>
        //       </Card>
        //     )
        //   })}
        // </div>} */}
    </>
    
  )
}

export default DisplayProposals