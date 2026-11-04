/**
 * عمليات Git آمنة داخل الـ Sandbox — قائمة بيضاء فقط
 */

export const GIT_ACTIONS = ["status", "log", "diff", "branches", "remotes"] as const;
export type GitAction = (typeof GIT_ACTIONS)[number];

export function buildGitCommand(action: GitAction): string {
  switch (action) {
    case "status":
      return "git status --short --branch 2>&1 | head -n 200; echo ---; git log --oneline -5 2>&1";
    case "log":
      return "git log --oneline --graph --decorate -30 2>&1";
    case "diff":
      return "git diff --stat HEAD 2>&1 | head -n 100; echo ---UNTRACKED---; git ls-files --others --exclude-standard 2>&1 | head -n 50";
    case "branches":
      return "git branch -a 2>&1; echo ---TAGS---; git tag 2>&1 | head -n 20";
    case "remotes":
      return "git remote -v 2>&1";
  }
}

export function isGitAction(v: string): v is GitAction {
  return (GIT_ACTIONS as readonly string[]).includes(v);
}
