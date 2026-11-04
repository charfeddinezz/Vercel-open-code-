/**
 * GitHub — استنساخ، دفع، إدارة المشاريع
 */
import { Octokit } from "@octokit/rest";

export function octokitFor(token: string) {
  return new Octokit({ auth: token });
}

export async function listRepos(token: string, opts?: { perPage?: number; sort?: string }) {
  const octokit = octokitFor(token);
  const { data } = await octokit.repos.listForAuthenticatedUser({
    per_page: opts?.perPage ?? 50,
    sort: (opts?.sort as never) ?? "updated",
  });
  return data.map((r) => ({
    id: r.id,
    fullName: r.full_name,
    name: r.name,
    private: r.private,
    url: r.html_url,
    cloneUrl: r.clone_url,
    updatedAt: r.updated_at,
    defaultBranch: r.default_branch,
  }));
}

export async function ensureRepo(token: string, name: string, isPrivate = true) {
  const octokit = octokitFor(token);
  try {
    const { data } = await octokit.repos.get({ owner: (await octokit.users.getAuthenticated()).data.login, repo: name });
    return data;
  } catch {}
  const { data } = await octokit.repos.createForAuthenticatedUser({
    name,
    private: isPrivate,
  });
  return data;
}

// توليد رابط استنساخ مع التوكن (يُستخدم داخل Sandbox فقط، لا يُكشف للواجهة)
export function authedCloneUrl(cloneUrl: string, token: string): string {
  // https://github.com/user/repo.git -> https://<token>@github.com/user/repo.git
  return cloneUrl.replace("https://", `https://${token}@`);
}
