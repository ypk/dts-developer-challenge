import fs from 'fs';
import path from 'path';
import logSymbols from 'log-symbols';
import { fileURLToPath } from 'url';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const sourceEnvPath = path.join(rootDir, '.env.development');
const targetEnvPath = path.join(rootDir, '.env');

if (fs.existsSync(targetEnvPath)) {
    console.log(
        logSymbols.info,
        ` .env file already exists. Not overwriting existing configuration.`
    );
} else {
    if (fs.existsSync(sourceEnvPath)) {
        try {
            fs.copyFileSync(sourceEnvPath, targetEnvPath);
            console.log(
                logSymbols.success,
                ` Created .env file from .env.development template`,
            );
        } catch (error) {
            console.error(
                logSymbols.error,
                ` Error creating .env file: `, error.message
            );
            process.exit(1);
        }
    } else {
        console.error(
            logSymbols.error,
            ` Error: .env.development file not found`
        );
        process.exit(1);
    }
}
