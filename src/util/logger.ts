import chalk from "chalk";

export const logger = {
  logging: false,
  log(message: unknown) {
    console.log(chalk.white(message));
  },
  info(message: unknown) {
    if (this.logging) console.log(chalk.white("INFO:") + ` ${message}`);
  },
  warning(message: unknown) {
    if (this.logging) console.error(chalk.yellow("WARN:") + ` ${message}`);
  },
  error(message: unknown) {
    if (this.logging) console.error(chalk.red("ERROR:") + ` ${message}`);
  },
  debug(message: unknown) {
    if (this.logging) console.error(chalk.green("DEBUG:") + ` ${message}`);
  },
};
