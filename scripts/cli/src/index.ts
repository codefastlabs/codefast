#!/usr/bin/env node

import { Command } from "commander";

import { createUpdateExportsCommand } from "@/commands/update-exports";

function main(): void {
  const program = new Command();

  program.name("codefast").description("CodeFast CLI - Bộ công cụ phát triển cho CodeFast").version("0.0.0");

  createUpdateExportsCommand(program);

  program.action(() => {
    console.log("Sử dụng 'codefast update-exports' để cập nhật exports.");
    console.log("Chạy 'codefast --help' để xem tất cả các lệnh có sẵn.");
    program.help();
  });

  program.parse(process.argv);
}

main();
