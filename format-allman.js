#!/usr/bin/env node

import {execSync} from 'child_process';

// Function to format files with Allman style
function formatWithAllmanStyle(filePattern)
{
  try
  {
    // Use ESLint to fix Allman style issues with specific rules
    const command = `npx eslint ${filePattern} --fix --rule "brace-style: [error, allman, { allowSingleLine: false }]" --rule "no-unused-vars: off" --rule "no-undef: off" --rule "no-constant-condition: off"`;
    execSync(command, {
      stdio: 'inherit',
    });
    console.log(`Formatted ${filePattern} with Allman style using ESLint`);
  }
  catch (error)
  {
    // ESLint returns non-zero exit code when there are linting errors, but we still want to continue
    console.log(
      `Attempted to format ${filePattern} with Allman style using ESLint`,
    );
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length === 0)
{
  // Format all JavaScript and Vue files in the project, excluding dist, node_modules, and public directories
  console.log('Formatting all JavaScript and Vue files with Allman style...');
  formatWithAllmanStyle(
    '"." --ext .js,.vue --ignore-pattern dist --ignore-pattern node_modules --ignore-pattern public',
  );
}
else
{
  // Format specific files or patterns
  args.forEach((pattern) =>
  {
    console.log(`Formatting ${pattern} with Allman style...`);
    formatWithAllmanStyle(`"${pattern}"`);
  });
}
