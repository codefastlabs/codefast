import { Container, resolveAsync, token } from "@codefast/di";

const Greeting = token<string>("bundle:Greeting");

const container = Container.create();
container.bind(Greeting).toDynamicAsync(async () => "hello");

console.log(await resolveAsync(container, Greeting));
