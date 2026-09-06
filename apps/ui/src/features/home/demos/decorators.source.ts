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
    readonly db: Database,
    readonly cache: Cache | undefined,
    readonly plugins: Array<Plugin>,
    readonly audit: Logger,
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

Container.create().bind(UserRepository).toSelf().singleton();
