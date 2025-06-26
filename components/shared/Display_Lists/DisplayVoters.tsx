import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import { RegisteringEventType } from "../Voting";

const DisplayVoters = ({ events }: { events:RegisteringEventType[], }) => {
  return (
    <div className='p-4 flex flex-col w-full'>
      {events?.length > 0 && [...events].reverse().map((event) => {
        return (
          <Card className="p-4 mb-2 bg-[#ffec99]" key={crypto.randomUUID()} >
              <div className="flex items-center">
                  {/* <Badge className="bg-lime-500">NumberChanged</Badge> */}<p>Voter Address : <span className="font-bold">{event.address}</span></p>
                  
                  <p className='ml-2 mr-2'>|</p> 
                  <p className="ml-2">Block Number : <span className="font-bold">{event.blockNumber}</span></p>
              </div>
          </Card>
        )
      })}
    </div>
  )
}

export default DisplayVoters