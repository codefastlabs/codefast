/**
 * A `scoped` instance lives as long as the child container that cached it, and is deactivated with it: the owning
 * container's hooks, the binding's own hook and `@preDestroy()` all run when that child is disposed or the binding unbound.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#container/container";
import { binding } from "#core/binding-declaration";
import { Module } from "#core/module";
import { token } from "#core/token";
import { injectable } from "#decorators/injectable";
import { preDestroy } from "#decorators/lifecycle";

class Transaction {
  readonly id: number;
  static #nextId = 1;

  constructor() {
    this.id = Transaction.#nextId;
    Transaction.#nextId += 1;
  }
}

const TransactionToken = token<Transaction>("test:Transaction");

describe("disposing a child container", () => {
  it("runs @preDestroy() on every scoped instance it cached", async () => {
    const ended: Array<string> = [];

    @injectable()
    class RequestContext {
      @preDestroy()
      end(): void {
        ended.push("request ended");
      }
    }

    const root = Container.create();
    root.bind(RequestContext).toSelf().scoped();
    const request = root.createChild();
    request.resolve(RequestContext);

    await request.dispose();

    expect(ended).toEqual(["request ended"]);
  });

  it("awaits the binding's own async onDeactivation with the cached instance", async () => {
    const closed: Array<number> = [];
    const root = Container.create();
    root
      .bind(TransactionToken)
      .to(Transaction)
      .scoped()
      .onDeactivation(async (transaction) => {
        await Promise.resolve();
        closed.push(transaction.id);
      });
    const request = root.createChild();
    const transaction = request.resolve(TransactionToken);

    await request.dispose();

    expect(closed).toEqual([transaction.id]);
  });

  it("deactivates only its own instances, one per child", async () => {
    const closed: Array<number> = [];
    const root = Container.create();
    root
      .bind(TransactionToken)
      .to(Transaction)
      .scoped()
      .onDeactivation((transaction) => {
        closed.push(transaction.id);
      });
    const first = root.createChild();
    const second = root.createChild();
    const firstTransaction = first.resolve(TransactionToken);
    const secondTransaction = second.resolve(TransactionToken);

    await first.dispose();
    expect(closed).toEqual([firstTransaction.id]);

    await second.dispose();
    expect(closed).toEqual([firstTransaction.id, secondTransaction.id]);
  });

  it("tears scoped instances down latest first, before the child's own singletons", async () => {
    const order: Array<string> = [];
    const Session = token<string>("test:Session");
    const Audit = token<string>("test:Audit");
    const Pool = token<string>("test:Pool");
    const root = Container.create();
    root
      .bind(Session)
      .toDynamic(() => "session")
      .scoped()
      .onDeactivation((value) => {
        order.push(value);
      });
    root
      .bind(Audit)
      .toDynamic(() => "audit")
      .scoped()
      .onDeactivation((value) => {
        order.push(value);
      });
    const request = root.createChild();
    request
      .bind(Pool)
      .toDynamic(() => "pool")
      .singleton()
      .onDeactivation((value) => {
        order.push(value);
      });
    request.resolve(Pool);
    request.resolve(Session);
    request.resolve(Audit);

    await request.dispose();

    expect(order).toEqual(["audit", "session", "pool"]);
  });

  it("runs the owning container's hooks for a binding it owns, not the child's", async () => {
    const heard: Array<string> = [];
    const root = Container.create();
    root.bind(TransactionToken).to(Transaction).scoped();
    root.onDeactivation(TransactionToken, () => {
      heard.push("root");
    });
    const request = root.createChild();
    request.onDeactivation(TransactionToken, () => {
      heard.push("child");
    });
    request.resolve(TransactionToken);

    await request.dispose();

    expect(heard).toEqual(["root"]);
  });

  it("runs the remaining deactivations after one throws, and reports the failure", async () => {
    const ran: Array<string> = [];
    const Failing = token<string>("test:Failing");
    const root = Container.create();
    root
      .bind(Failing)
      .toDynamic(() => "failing")
      .scoped()
      .onDeactivation(() => {
        throw new Error("boom in scoped");
      });
    root
      .bind(TransactionToken)
      .to(Transaction)
      .scoped()
      .onDeactivation(() => {
        ran.push("survivor");
      });
    const request = root.createChild();
    request.resolve(TransactionToken);
    request.resolve(Failing);

    await expect(request.dispose()).rejects.toThrow("boom in scoped");
    expect(ran).toEqual(["survivor"]);
  });
});

describe("unbinding a scoped binding", () => {
  it("deactivates the instance the registering child cached", () => {
    const closed: Array<number> = [];
    const request = Container.create().createChild();
    request
      .bind(TransactionToken)
      .to(Transaction)
      .scoped()
      .onDeactivation((transaction) => {
        closed.push(transaction.id);
      });
    const transaction = request.resolve(TransactionToken);

    request.unbind(TransactionToken);

    expect(closed).toEqual([transaction.id]);
  });
});

describe("a scoped declaration's onDeactivation", () => {
  it("is taken by Module.fromBindings and run when the child is disposed", async () => {
    const closed: Array<number> = [];
    const Declared = Module.fromBindings("test:Declared", [
      binding(TransactionToken, {
        to: Transaction,
        scope: "scoped",
        onDeactivation: (transaction) => {
          closed.push(transaction.id);
        },
      }),
    ]);
    const request = Container.fromModules(Declared).createChild();
    const transaction = request.resolve(TransactionToken);

    await request.dispose();

    expect(closed).toEqual([transaction.id]);
  });
});
