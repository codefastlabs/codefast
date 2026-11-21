import type { Audit } from "#audit/domain/types";
import { runPropsAudit } from "#audit/props/run";

/**
 * The `audit:props` audit: props types joined with `&` that an interface could express, judged by the type server.
 *
 * @since 0.16.0
 */
export const propsAudit: Audit = {
  name: "props",
  configKey: "props",
  description:
    "Report component props aliases joined with & that an interface could express, judged by the type checker",
  scan: (context) => runPropsAudit(context),
};
