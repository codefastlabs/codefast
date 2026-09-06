import { Container, inject, injectAll, injectable, optional, postConstruct, preDestroy, token } from "@codefast/di";

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
interface Logger {
  info(message: string): void;
}

const DbToken = token<Database>("Database");
const CacheToken = token<Cache>("Cache");
const PluginToken = token<Plugin>("Plugin");
const LoggerToken = token<Logger>("Logger");

@injectable([DbToken, optional(CacheToken), injectAll(PluginToken), inject(LoggerToken, { name: "audit" })])
class UserRepository {
  constructor(
    private readonly db: Database,
    private readonly cache: Cache | undefined,
    private readonly plugins: Array<Plugin>,
    private readonly audit: Logger,
  ) {}

  @postConstruct()
  async init(): Promise<void> {
    await this.db.warmCache();
  }

  @preDestroy()
  async shutdown(): Promise<void> {
    await this.db.flush();
  }

  find(id: string): string {
    this.audit.info(`find ${id} across ${this.plugins.length} plugins`);

    return this.cache?.get(id) ?? id;
  }
}

Container.create().bind(UserRepository).toSelf().singleton();
