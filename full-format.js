#!/usr/bin/env node

import {execSync} from 'child_process';

console.log('Running full formatting process...');

try 
{
  // Run ESLint with Allman style formatting
  console.log('Running ESLint with Allman style formatting...');
  const eslintCommand =
    'npx eslint . --ext .js,.vue --fix --rule "brace-style: [error, allman, { allowSingleLine: false }]" --rule "no-unused-vars: off" --rule "no-undef: off" --rule "no-constant-condition: off" --ignore-pattern dist --ignore-pattern node_modules --ignore-pattern public';
  execSync(eslintCommand, {
    stdio: 'inherit',
  });

  console.log('Full formatting process completed successfully!');
}
catch (error) 
{
  console.log(
    'Full formatting process completed with some issues (this is normal for ESLint)',
  );
}
