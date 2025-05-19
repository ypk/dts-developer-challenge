/**
 * Environment Setup Script
 * Sets up the appropriate .env file based on current execution context
 * and copies required assets from node_modules
 */
import fs from 'fs';
import path from 'path';
import logSymbols from 'log-symbols';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

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

/**
 * Recursively copies files from source to target directory
 * @param {string} source - Source directory
 * @param {string} target - Target directory
 */
function copyRecursive(source, target) {
    // Create target directory if it doesn't exist
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
    }
    
    // Get all files and directories in source
    const entries = fs.readdirSync(source, { withFileTypes: true });
    
    for (const entry of entries) {
        const sourcePath = path.join(source, entry.name);
        const targetPath = path.join(target, entry.name);
        
        if (entry.isDirectory()) {
            // Recursively copy directory
            copyRecursive(sourcePath, targetPath);
        } else {
            // Copy file
            fs.copyFileSync(sourcePath, targetPath);
        }
    }
}

/**
 * Copies GOV.UK Frontend assets to the public directory
 */
function copyGovUkAssets() {
    // Updated path to use the correct directory structure
    const sourceDir = path.join(rootDir, 'node_modules/govuk-frontend/dist/govuk/assets');
    const targetDir = path.join(rootDir, 'public/assets');
    
    // Create target directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }
    
    try {
        // Use recursive copy
        copyRecursive(sourceDir, targetDir);
        console.log(
            logSymbols.success,
            ` Copied GOV.UK Frontend assets to public/assets`
        );
    } catch (error) {
        console.error(
            logSymbols.error,
            ` Error copying GOV.UK Frontend assets: `, error.message
        );
    }
}

/**
 * Copies GOV.UK Frontend JavaScript to the public directory
 */
function copyGovUkJavaScript() {
    // Updated path to use the correct file
    const sourceFile = path.join(rootDir, 'node_modules/govuk-frontend/dist/govuk/all.mjs');
    const targetDir = path.join(rootDir, 'public/assets/javascripts');
    const targetFile = path.join(targetDir, 'govuk-frontend.min.js');
    
    // Create target directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }
    
    try {
        // Copy file
        fs.copyFileSync(sourceFile, targetFile);
        console.log(
            logSymbols.success,
            ` Copied GOV.UK Frontend JavaScript to public/assets/javascripts`
        );
    } catch (error) {
        console.error(
            logSymbols.error,
            ` Error copying GOV.UK Frontend JavaScript: `, error.message
        );
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

// Copy GOV.UK Frontend assets
console.log(logSymbols.info, ' Copying GOV.UK Frontend assets...');
copyGovUkAssets();
copyGovUkJavaScript();
