import TasksClient from "./TasksClient";
import { Task } from "@/types";
import { apiUrl } from "@/config";
import PageClient from "./PageClient";

const url = apiUrl + "/tasks"

export default async function Page() {
  // const result = await fetch(url, { method: 'GET', next: { revalidate: 0 } })
  
  //   let tasks: Task[]  = []
  
  //   if(result.ok) {
  //     tasks = await result.json()
  //   }
  return (
    <div>
        {/* <TasksClient /> */}
        <PageClient />
    </div>
  );
}
