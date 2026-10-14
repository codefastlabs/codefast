import { Container, token } from "@codefast/di";

const Greeting = token<string>("bundle:Greeting");

const container = Container.create();
container.bind(Greeting).toConstantValue("hello");

console.log(container.resolve(Greeting));
