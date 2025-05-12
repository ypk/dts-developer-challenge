/**
 * Environment Setup Script
 * Sets up the appropriate .env file based on current execution context
 */
import fs from 'fs';
import path from 'path';
import logSymbols from 'log-symbols';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const targetEnvPath = path.join(rootDir, '.env');

/**
 * Determines if code is running in Docker environment
 * @returns {boolean} True if running in Docker, false otherwise
 */
function isRunningInDocker() {
    try {
        return fs.existsSync('/.dockerenv') ||
            fs.readFileSync('/proc/1/cgroup', 'utf8').includes('docker');
    } catch (e) {
        return false;
    }
}

/**
 * Creates a .env file from the specified source with optional content transformations
 * @param {string} sourceName - Name of the source env file (without .env. prefix)
 * @param {Function} [transformFn] - Optional function to transform file content 
 */
function setupEnvFromSource(sourceName, transformFn = null) {
    const sourceEnvPath = path.join(rootDir, `.env.${sourceName}`);
    
    // Check if source exists
    if (!fs.existsSync(sourceEnvPath)) {
        console.error(
            logSymbols.error,
            ` Error: .env.${sourceName} file not found`
        );
        process.exit(1);
    }
    
    try {
        // Copy file
        fs.copyFileSync(sourceEnvPath, targetEnvPath);
        console.log(
            logSymbols.success,
            ` Created .env file from .env.${sourceName} template`
        );
        
        // Apply transformation if provided
        if (transformFn) {
            let content = fs.readFileSync(targetEnvPath, 'utf8');
            const updatedContent = transformFn(content);
            fs.writeFileSync(targetEnvPath, updatedContent);
            console.log(
                logSymbols.success,
                ` Applied content transformations to .env file`
            );
        }
    } catch (error) {
        console.error(
            logSymbols.error,
            ` Error creating/updating .env file: `, error.message
        );
        process.exit(1);
    }
}

// Main execution logic
if (fs.existsSync(targetEnvPath)) {
    console.log(
        logSymbols.info,
        ` .env file already exists. Overwriting with environment-specific template.`
    );
}

if (isRunningInDocker()) {
    console.log(logSymbols.info, ' Running in Docker, setting up production environment...');
    setupEnvFromSource('production');
} else {
    console.log(logSymbols.info, ' Not running in Docker, setting up development environment...');
    setupEnvFromSource('development', content => content.replace(/@db:/g, '@localhost:'));
}
