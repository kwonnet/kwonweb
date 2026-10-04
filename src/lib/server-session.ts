import "server-only";
import { cache } from "react";
import { auth } from "@/auth";

// Request-scoped only: never share one user's session with another request.
export const getServerSession = cache(() => auth());
