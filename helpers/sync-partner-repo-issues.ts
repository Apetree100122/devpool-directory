import { getAllIssues, getIssueByLabel, getRepoCredentials, GitHubIssue, newDirectoryIssue, syncIssueMetaData as syncDirectoryIssue } from "./directory";
import { TwitterMap } from "./initialize-twitter-map";

export async function syncPartnerRepoIssues({
  partnerRepoUrl,
  isFork,
  directoryPreviewIssues,
  twitterMap,
}: {
  partnerRepoUrl: string;
  isFork: boolean;
  directoryPreviewIssues: GitHubIssue[];
  twitterMap: TwitterMap;
}): Promise<GitHubIssue[]> {
  const [ownerName, repoName] = getRepoCredentials(partnerRepoUrl);
  const previewIssuesPerPartnerRepo: GitHubIssue[] = await getAllIssues(ownerName, repoName);
  const buffer: (GitHubIssue | null)[] = [];
  for (const previewIssuePerPartnerRepo of previewIssuesPerPartnerRepo) {
    console.trace({ previewIssuePerPartnerRepo });
    buffer.push(previewIssuePerPartnerRepo);
    await createOrSync(previewIssuePerPartnerRepo);
  }
  return buffer.filter((issue) => issue !== null) as GitHubIssue[];

  async function createOrSync(partnerPreviewIssue: GitHubIssue) {
    const partnerIdMatchIssue: GitHubIssue | null = getIssueByLabel(directoryPreviewIssues, `id: ${partnerPreviewIssue.node_id}`);

    // adding www creates a link to an issue that does not count as a mention
    // helps with preventing a mention in partner's repo especially during testing
    const body = isFork ? partnerPreviewIssue.html_url.replace("https://github.com", "https://www.github.com") : partnerPreviewIssue.html_url;

    if (partnerIdMatchIssue) {
      // if it exists in the devpool, then update it
      await syncDirectoryIssue({
        previewIssues: previewIssuesPerPartnerRepo,
        previewIssue: partnerPreviewIssue,
        url: partnerRepoUrl,
        remoteFullIssue: partnerIdMatchIssue,
        isFork,
      });
      // allFullIssues.push(partnerIdMatchIssue);
    } else {
      // if it doesn't exist in the devpool, then create it
      await newDirectoryIssue(partnerPreviewIssue, partnerRepoUrl, body, twitterMap);
    }

    return partnerIdMatchIssue;
  }
}
