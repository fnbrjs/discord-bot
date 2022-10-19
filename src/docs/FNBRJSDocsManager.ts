import { Collection } from 'discord.js';
import axios from 'axios';
import { CachedDocsData, DocsData } from '../../resources/httpResponses';
import Client from '../Client';

class FNBRJSDocsManager {
  private client: Client;
  public cachedDocsVersions: Collection<string, CachedDocsData>;
  constructor(client: Client) {
    this.client = client;

    this.cachedDocsVersions = new Collection();
  }

  public async fetch(version: string): Promise<DocsData | undefined> {
    const cachedDocsVersion = this.cachedDocsVersions.get(version);
    if (cachedDocsVersion && Date.now() - cachedDocsVersion.cachedAt.getTime() < 60000) {
      return cachedDocsVersion;
    }

    try {
      const docsData = await axios({
        method: 'GET',
        url: `https://raw.githubusercontent.com/fnbrjs/fnbr.js/docs/${version}.json`,
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_ACCESS_TOKEN!}`,
        },
      });

      this.cachedDocsVersions.set(version, {
        ...docsData.data as any,
        cachedAt: new Date(),
      });
      return docsData.data;
    } catch (err) {
      return undefined;
    }
  }
}

export default FNBRJSDocsManager;
