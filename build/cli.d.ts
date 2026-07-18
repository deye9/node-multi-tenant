import { TenancyConfig } from "./types";
export declare class TenancyCli {
    private readonly config;
    private readonly cwd;
    constructor(config: TenancyConfig, cwd?: string);
    executeCommand(command: string): Promise<boolean>;
    initConfig(): Promise<void>;
    install(): Promise<void>;
    startInteractive(): void;
    processInput(input: string): Promise<void>;
    logger(message: string, color?: string): void;
    private help;
}
