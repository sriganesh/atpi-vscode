# ATPI VS Code Extension

## Development Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Compile the extension**
   ```bash
   npm run compile
   ```

3. **Run the extension**
   - Press `F5` to open a new VS Code window with the extension loaded
   - Or use the "Run Extension" launch configuration

## Testing

1. **Run tests**
   ```bash
   npm test
   ```

2. **Debug tests**
   - Use the "Extension Tests" launch configuration
   - Set breakpoints in test files

## Making Changes

1. Make your changes in the `src/` directory
2. Run `npm run compile` or use the watch task
3. Reload the VS Code window (`Ctrl+R` or `Cmd+R`) to see changes

## Packaging

1. Install vsce if not already installed:
   ```bash
   npm install -g vsce
   ```

2. Package the extension:
   ```bash
   vsce package
   ```

3. This creates a `.vsix` file that can be installed or published

## Publishing

1. Create a Personal Access Token on Azure DevOps
2. Login to vsce:
   ```bash
   vsce login <publisher-name>
   ```

3. Publish:
   ```bash
   vsce publish
   ```

## Debugging Tips

- Use `console.log()` statements - they appear in the "Debug Console"
- Set breakpoints in TypeScript files
- Use the VS Code Extension Host output channel for errors

## Project Structure

- `src/extension.ts` - Main extension entry point
- `src/commands/` - Command implementations
- `src/providers/` - Language feature providers
- `src/services/` - Core business logic
- `src/views/` - UI components (webview, tree view)
- `src/utils/` - Helper utilities
- `src/test/` - Test files