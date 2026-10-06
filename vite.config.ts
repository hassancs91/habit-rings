import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5190,
    strictPort: true,
    // Claude Code worktrees (claude -w) live in .claude/worktrees/ inside the project: don't reload for them.
    watch: { ignored: ['**/.claude/**'] },
  },
})
