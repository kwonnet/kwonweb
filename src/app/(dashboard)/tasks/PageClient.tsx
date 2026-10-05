'use client';
import {useEffect,useState} from 'react';
import {Alert,Box,Button,Chip,Container,LinearProgress,Paper,Stack,Switch,TextField,Typography} from '@mui/material';
import useSWR,{useSWRConfig} from 'swr';
import {useAuthSession} from '@/hooks';
import {getEngagementTasks,checkEngagementTask,configureEngagementTask,type EngagementTask} from '@/lib/tasks';
import {useNotifications} from '@/providers/NotificationsProvider';
export default function PageClient() {
 const {token,user}=useAuthSession(); const notices=useNotifications(); const {mutate:mutateCache}=useSWRConfig();
 const {data,error,isLoading,mutate}=useSWR(token&&user?['engagement-tasks',user.id,token]:null,([,,accessToken])=>getEngagementTasks(accessToken),{refreshInterval:60000,revalidateOnFocus:true,dedupingInterval:10000});
 const [pending,setPending]=useState<string|null>(null); const [now,setNow]=useState(()=>Date.now());
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
 async function claim(task:EngagementTask) {
  if(!token||!user||pending) return;setPending(task.id);
  try {const result=await checkEngagementTask(task.id,user.id,token);notices.show(result.message,{severity:'success'});
   await mutateCache(key=>Array.isArray(key)&&key[0]==='/v1/wallets'&&key[1]===token,undefined,{revalidate:true});
  } catch(error) {notices.show(error instanceof Error?error.message:'Unable to check this task.',{severity:'info'});}
  finally {await mutate();setPending(null);}
 }
 async function change(task:EngagementTask,input:{enabled?:boolean;target?:number}) {
  if(!token)return;setPending(task.id);
  try{await configureEngagementTask(task.id,input,token);await mutate();}catch{notices.show('Unable to update task.',{severity:'error'});}finally{setPending(null);}
 }
 return <Container maxWidth="md" sx={{py:3}}>
  <Typography variant="h5">Engagement tasks</Typography>
  <Typography color="text.secondary" sx={{mt:1,mb:3}}>Create, connect and contribute. Qualifying actions from the last 24 hours earn bonus coins. Each task becomes available again 24 hours after you claim it.</Typography>
  <Alert severity="info" sx={{mb:2}}>Rewards change daily at midnight UTC. Post tasks require public, visible content. Self-engagement, reused rewarded targets, and deleted or hidden content do not count.</Alert>
  {isLoading&&<LinearProgress/>}{error&&<Alert severity="error" action={<Button onClick={()=>void mutate()}>Retry</Button>}>Unable to load task progress.</Alert>}
  <Stack spacing={2}>{data?.map(task=>{
   const remaining=task.nextClaimAt?Math.max(0,new Date(task.nextClaimAt).getTime()-now):0;
   return <Paper key={task.id} variant="outlined" sx={{p:{xs:2,sm:3}}}>
    <Stack direction="row" spacing={1} sx={{justifyContent:'space-between',alignItems:'center'}}><Typography variant="h6">{task.title}</Typography><Chip label={`${task.reward} bonus coins`} color="primary" variant="outlined"/></Stack>
    <Typography variant="body2" color="text.secondary" sx={{my:1}}>Goal: {task.target} qualifying {task.action.includes('RECEIVED')||task.action==='FOLLOWERS'?'people':'targets'}. Progress: {task.progress} / {task.target}</Typography>
    <LinearProgress variant="determinate" value={Math.min(100,100*task.progress/task.target)} sx={{mb:2,borderRadius:1}}/>
    {!task.enabled&&<Alert severity="info" sx={{mb:1}}>This task is currently disabled.</Alert>}
    {remaining>0&&<Typography variant="body2" color="text.secondary" sx={{mb:1}}>Available in {Math.floor(remaining/3600000)}h {Math.floor(remaining/60000)%60}m</Typography>}
    <Button variant="contained" disabled={!!pending||!task.enabled||remaining>0} onClick={()=>void claim(task)}>{pending===task.id?'Checking…':'Check eligibility & claim'}</Button>
    {user&&['ADMIN','SUPER'].includes(user.role)&&<Box sx={{mt:2,pt:2,borderTop:1,borderColor:'divider'}}><Stack direction="row" spacing={2} sx={{alignItems:'center'}}><Typography variant="body2">Enabled</Typography><Switch checked={task.enabled} disabled={!!pending} onChange={(_,enabled)=>void change(task,{enabled})}/><TextField size="small" label="Required count" type="number" defaultValue={task.target} key={task.target} slotProps={{htmlInput:{min:1,max:1000}}} onBlur={event=>{const target=Number(event.target.value);if(Number.isInteger(target)&&target>0&&target<=1000&&target!==task.target)void change(task,{target});}}/></Stack></Box>}
   </Paper>;
  })}</Stack>
 </Container>;
}
