import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  // Habilita authClient.admin.* (listUsers, createUser, setRole, removeUser...)
  plugins: [adminClient()],
});