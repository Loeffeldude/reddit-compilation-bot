import chalk from "chalk";

export const logger = {
  logging: true,
  debugLogging: false,
  log(message: unknown) {
    console.log(chalk.white(message));
  },
  info(message: unknown) {
    if (this.logging) logMessage(message, chalk.blue("INFO:"));
  },
  warning(message: unknown) {
    if (this.logging) logMessage(message, chalk.green("WARN:"));
  },
  error(message: unknown) {
    if (this.logging) logMessage(message, chalk.red("ERROR:"));
  },
  debug(message: unknown) {
    if (this.logging && this.debugLogging)
      logMessage(message, chalk.green("DEBUG:"));
  },
};
function logMessage(message: unknown, prefix: string) {
  console.log(
    `${prefix}\t ${String(message).split("\n").join(`\n${prefix}\t `)}`
  );
}
