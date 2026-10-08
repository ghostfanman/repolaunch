import { describe, expect, it } from "vitest";
import { parseRepoInput, suggestRepoInput } from "@/core/repo-input";

describe("URL-Validierung", () => {
  it.each([
    ["owner/repo", "owner", "repo"],
    ["https://github.com/owner/repo", "owner", "repo"],
    ["https://github.com/owner/repo/", "owner", "repo"],
    ["  https://GitHub.com/Some-Owner/my.repo_name  ", "Some-Owner", "my.repo_name"],
    ["a/b", "a", "b"],
  ])("akzeptiert %s", (input, owner, repo) => {
    const r = parseRepoInput(input);
    expect(r).toEqual({ ok: true, owner, repo, canonicalUrl: `https://github.com/${owner}/${repo}` });
  });

  it.each([
    ["", "empty"],
    [42, "empty"],
    ["x".repeat(201), "too_long"],
    ["http://github.com/owner/repo", "wrong_scheme"],
    ["github.com/owner/repo", "wrong_scheme"],
    ["ftp://github.com/owner/repo", "wrong_scheme"],
    ["https://gitlab.com/owner/repo", "wrong_host"],
    ["https://www.github.com/owner/repo", "wrong_host"],
    ["https://github.com.evil.com/owner/repo", "wrong_host"],
    ["https://api.github.com/repos/owner/repo", "wrong_host"],
    ["https://user:pass@github.com/owner/repo", "credentials"],
    ["https://github.com@evil.com/owner/repo", "credentials"],
    ["https://github.com:443/owner/repo", "port"],
    ["https://github.com/owner/repo?tab=readme", "query_or_fragment"],
    ["https://github.com/owner/repo#readme", "query_or_fragment"],
    ["https://github.com/owner/repo/tree/main", "extra_path"],
    ["owner/repo/issues", "extra_path"],
    ["https://github.com/owner/repo.git", "git_suffix"],
    ["-owner/repo", "invalid_owner"],
    ["own--er/repo", "invalid_owner"],
    ["o".repeat(40) + "/repo", "invalid_owner"],
    ["owner/..", "invalid_repo"],
    ["owner/", "invalid_repo"],
    ["owner/re po", "non_ascii"],
    ["оwner/repo", "non_ascii"],
    ["owner/repo‮", "non_ascii"],
    ["https://github.com/owner", "invalid_repo"],
    ["javascript:alert(1)", "wrong_scheme"],
    ["file:///etc/passwd", "wrong_scheme"],
    ["http://169.254.169.254/latest", "wrong_scheme"],
  ])("lehnt %s ab (%s)", (input, error) => {
    expect(parseRepoInput(input)).toEqual({ ok: false, error });
  });
});

describe("Hilfe bei kopierten Adressen (suggestRepoInput)", () => {
  it.each([
    ["github.com/octocat/hello-world", "octocat/hello-world"],
    ["http://github.com/octocat/hello-world", "octocat/hello-world"],
    ["https://www.github.com/octocat/hello-world/", "octocat/hello-world"],
    ["https://github.com/octocat/hello-world/tree/main/src", "octocat/hello-world"],
    ["https://github.com/octocat/hello-world.git", "octocat/hello-world"],
    ["https://github.com/octocat/hello-world?tab=readme-ov-file#install", "octocat/hello-world"],
    ["git@github.com:octocat/hello-world.git", "octocat/hello-world"],
    ["<https://github.com/octocat/hello-world>", "octocat/hello-world"],
  ])("%s -> %s", (raw, expected) => {
    expect(suggestRepoInput(raw)).toBe(expected);
    expect(parseRepoInput(expected).ok).toBe(true);
  });

  it.each(["https://gitlab.com/a/b", "https://github.com.evil.com/a/b", "https://evil.com/github.com/a/b", "github.com/onlyowner", "https://github.com/a/b c", "", "javascript:alert(1)", "https://user:pw@github.com/a/b"])(
    "kein Vorschlag für %s",
    (raw) => {
      expect(suggestRepoInput(raw)).toBeNull();
    },
  );
});
