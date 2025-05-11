import fs from 'fs';
import path from 'path';
import logSymbols from 'log-symbols';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const sourceEnvPath = path.join(rootDir, '.env.development');
const targetEnvPath = path.join(rootDir, '.env');

if (fs.existsSync(targetEnvPath)) {
    console.log(
        logSymbols.info,
        ` .env file already exists. Overwriting with .env.development and updating database host.`
    );
}

if (fs.existsSync(sourceEnvPath)) {
    try {

        fs.copyFileSync(sourceEnvPath, targetEnvPath);

        console.log(
            logSymbols.success,
            ` Created .env file from .env.development template`
        );

        let content = fs.readFileSync(targetEnvPath, 'utf8');
        const updatedContent = content.replace(/@db:/g, '@localhost:');

        fs.writeFileSync(targetEnvPath, updatedContent);

        console.log(
            logSymbols.success,
            ` Updated database host from 'db' to 'localhost' in .env file`
        );

    } catch (error) {
        console.error(
            logSymbols.error,
            ` Error creating/updating .env file: `, error.message
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