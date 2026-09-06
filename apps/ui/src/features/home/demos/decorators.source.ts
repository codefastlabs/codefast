import { inject, injectAll, injectable, optional, postConstruct, preDestroy, token } from "@codefast/di";

interface Database {
  warmCache(): Promise<void>;
  flush(): Promise<void>;
}
interface Cache {
  get(key: string): string | undefined;
}
interface Plugin {
  readonly name: string;
}

const DbToken = token<Database>("Database");
const CacheToken = token<Cache>("Cache");
const PluginToken = token<Plugin>("Plugin");

@injectable([DbToken, optional(CacheToken), injectAll(PluginToken), inject(DbToken, { name: "replica" })])
export class UserRepository {
  constructor(
    readonly db: Database,
    readonly cache: Cache | undefined,
    readonly plugins: Array<Plugin>,
    readonly replica: Database,
  ) {}

  @postConstruct()
  async init(): Promise<void> {
    await this.db.warmCache();
  }

  @preDestroy()
  async shutdown(): Promise<void> {
    await this.db.flush();
  }
}
