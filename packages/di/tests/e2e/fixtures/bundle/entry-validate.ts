import { Container, token, validate } from "@codefast/di";

const Greeting = token<string>("bundle:Greeting");

const container = Container.create();
container.bind(Greeting).toConstantValue("hello");
validate(container);

console.log(container.resolve(Greeting));
