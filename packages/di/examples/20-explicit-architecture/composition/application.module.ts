/** The application module — binds each inbound port to its use-case implementation. */

import { Module } from "@codefast/di";

import {
  DepositMoneyUseCaseToken,
  OpenAccountUseCaseToken,
  TransferMoneyUseCaseToken,
  WithdrawMoneyUseCaseToken,
} from "#/examples/20-explicit-architecture/application/ports/use-cases.port";
import { DepositMoney } from "#/examples/20-explicit-architecture/application/use-cases/deposit-money";
import { OpenAccount } from "#/examples/20-explicit-architecture/application/use-cases/open-account";
import { TransferMoney } from "#/examples/20-explicit-architecture/application/use-cases/transfer-money";
import { WithdrawMoney } from "#/examples/20-explicit-architecture/application/use-cases/withdraw-money";
import { BankingControllerToken } from "#/examples/20-explicit-architecture/composition/tokens";
import { BankingController } from "#/examples/20-explicit-architecture/primary/banking-controller";

/** Binds the inbound ports to their decorated use-case classes; the container reads each class's deps. */
export const applicationModule = Module.create("Application", (builder) => {
  builder.bind(OpenAccountUseCaseToken).to(OpenAccount).singleton();
  builder.bind(DepositMoneyUseCaseToken).to(DepositMoney).singleton();
  builder.bind(WithdrawMoneyUseCaseToken).to(WithdrawMoney).singleton();
  builder.bind(TransferMoneyUseCaseToken).to(TransferMoney).singleton();
  builder.bind(BankingControllerToken).to(BankingController).singleton();
});
