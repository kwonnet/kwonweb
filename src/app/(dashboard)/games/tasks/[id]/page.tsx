import {pageMetadata} from '@/lib/seo';
import { redirect } from "next/navigation";
import { Container, Paper, Typography } from "@mui/material";
import Link from "next/link";
import TaskClient from "./TaskClient";
import { Task } from "@/types";
import { apiUrl } from "@/config";

const url = apiUrl + "/tasks/";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id) return redirect("/tasks");

  const result = await fetch(url + id, {
    method: "GET",
    next: { revalidate: 0 },
  });

  const task: Task | null = result.ok ? await result.json() : null;

  if (!task) {
    return (
      <Container maxWidth="xl">
        <Paper sx={{ p: 3 }}>
          <Typography>Task not found</Typography>
          <Link href={"/tasks"}>Explore other tasks</Link>
        </Paper>
      </Container>
    );
  }

  return (
    <div>
      <TaskClient task={task} />
    </div>
  );
}

export async function generateMetadata({params}: {params: Promise<{id: string}>}) {
  const p = await params;
  return pageMetadata('Game tasks', 'View game tasks on Kwonnet.', "/" + 'games' + "/" + 'tasks' + "/" + encodeURIComponent(p.id), false);
}
