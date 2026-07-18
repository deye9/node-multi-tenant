"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenancyCli = void 0;
const child_process_1 = require("child_process");
const path = require("path");
const readline = require("readline");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
function quoteShellArg(value) {
    return `'${value.replace(/'/g, "'\\''")}'`;
}
class TenancyCli {
    constructor(config, cwd = process.cwd()) {
        this.config = config;
        this.cwd = cwd;
    }
    async executeCommand(command) {
        try {
            const { stdout, stderr } = await execAsync(command, { cwd: this.cwd });
            if (stderr &&
                !stderr
                    .toLowerCase()
                    .includes("sequelize deprecated string based operators are now deprecated")) {
                console.log("\x1b[31m%s\x1b[0m", `stderr: ${stderr}`);
                return false;
            }
            console.log("\x1b[36m%s\x1b[0m", `stdout: ${stdout}`);
            return true;
        }
        catch (error) {
            console.log("Error is ", error);
            return false;
        }
    }
    async initConfig() {
        console.log("Attempting to copy over the tenants config folder to root.");
        await this.executeCommand(`cp -r node_modules/node-multi-tenant/tenants ${quoteShellArg(`${this.cwd}/`)}`);
        console.log("Tenancy config folder copied successfully");
    }
    async install() {
        const modelsPath = path.resolve(this.cwd, this.config.datastore.modelsfolder);
        const migrationPath = path.resolve(this.cwd, this.config.datastore.migrationsfolder);
        const tenantMigrationPath = path.join(migrationPath, "tenants");
        console.log("Starting Tenancy Installation");
        await this.executeCommand(`mkdir -p ${quoteShellArg(tenantMigrationPath)}`);
        await this.executeCommand(`mv ${quoteShellArg(migrationPath)}/*.js ${quoteShellArg(tenantMigrationPath)}`);
        await this.executeCommand(`cp node_modules/node-multi-tenant/dist/migrations/*.js ${quoteShellArg(`${migrationPath}/`)}`);
        await this.executeCommand(`cp node_modules/node-multi-tenant/dist/models/*.js ${quoteShellArg(`${modelsPath}/`)}`);
        await this.executeCommand("node_modules/.bin/sequelize db:drop");
        await this.executeCommand("node_modules/.bin/sequelize db:create");
        await this.executeCommand("node_modules/.bin/sequelize db:migrate");
        await this.executeCommand(`node_modules/.bin/sequelize db:migrate --migrations-path=${quoteShellArg(tenantMigrationPath)}`);
        await this.executeCommand("node_modules/.bin/sequelize db:seed:all");
        console.log("Tenancy Installation Completed Successfully");
    }
    startInteractive() {
        console.log("\x1b[34m%s\x1b[0m", "The CLI is running");
        const cliInterface = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: ">",
        });
        cliInterface.prompt();
        cliInterface.on("line", async (input) => {
            await this.processInput(input);
            cliInterface.prompt();
        });
    }
    async processInput(input) {
        const command = input.trim().toLowerCase();
        if (!command) {
            return;
        }
        if (command === "man" || command === "help") {
            this.help();
            return;
        }
        if (command === "exit") {
            process.exit(0);
        }
        if (command === "tenancy:init") {
            await this.initConfig();
            return;
        }
        if (command === "tenancy:install") {
            await this.install();
            return;
        }
        if (command === "tenancy:db:seed") {
            await this.executeCommand("node_modules/.bin/sequelize db:seed:all");
            return;
        }
        if (command.startsWith("tenancy:db:unseed")) {
            await this.executeCommand(command.includes("--recent")
                ? "node_modules/.bin/sequelize db:seed:undo"
                : "node_modules/.bin/sequelize db:seed:undo:all");
            return;
        }
        if (command === "tenancy:migrate" ||
            command.startsWith("tenancy:migrate ")) {
            await this.executeCommand("node_modules/.bin/sequelize db:migrate");
            return;
        }
        if (command === "tenancy:migrate:rollback") {
            await this.executeCommand("node_modules/.bin/sequelize db:migrate:undo");
            return;
        }
        if (command === "tenancy:migrate:refresh") {
            await this.executeCommand("node_modules/.bin/sequelize db:seed:undo:all");
            await this.executeCommand("node_modules/.bin/sequelize db:migrate:undo");
            await this.executeCommand("node_modules/.bin/sequelize db:migrate");
            return;
        }
        console.log("Sorry, try again");
    }
    logger(message, color = "\x1b[37m%s\x1b[0m") {
        var _a;
        if (((_a = process.env.CONSOLE_LOGGER) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "true") {
            console.log(color, message);
        }
    }
    help() {
        const commands = [
            ["exit", "Kill the CLI (and the rest of the application)"],
            ["man", "Show this help page"],
            ["help", 'Alias of the "man" command'],
            ["tenancy:init", "Installs the tenancy configurations file."],
            [
                "tenancy:install",
                "Install the tenancy files based on the tenants/tenancy.ts configuration file",
            ],
            ["tenancy:db:seed", "Seed the database with records"],
            ["tenancy:db:unseed --{Action}", "Undo all seeds [Action = recent, all]"],
            ["tenancy:migrate:refresh", "Reset and re-run all migrations"],
            ["tenancy:migrate:rollback", "Rollback the last database migration"],
            [
                "tenancy:migrate --{tenantID}",
                "Run the database migrations on all or specific tenants",
            ],
        ];
        commands.forEach(([command, description]) => console.log(`${command.padEnd(40)} ${description}`));
    }
}
exports.TenancyCli = TenancyCli;
