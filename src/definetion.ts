import * as vscode from 'vscode';
import path from 'path';
import fs from 'fs';
// import * from './';


/**
 * 引用跳转实现
 * 识别文件中import dim.abc as alias文本，option+点击dim.abc，跳转至src/dim/abc.ezsql
 * @param {*} document 
 * @param {*} position 
 * @param {*} token 
 */
function provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
): vscode.ProviderResult<vscode.Definition | vscode.DefinitionLink[]> {
    // console.log('====== 进入 provideDefinition 方法 ======');
    // Get the line text
    const line  = document.lineAt(position.line).text;
    // Match import patterns like "import a.b.c (?: as alias)"
    const importRegex = /import\s+([a-zA-Z0-9_.]+)(?:\s+as\s+([a-zA-Z0-9_]+))?/;
    const match = line.match(importRegex);
    if (!match) {
        return undefined;
    }
    
    const importPath = match[1]; // e.g. "a.b.c"
    const filePath = importPath.replace(/\./g, '/') + '.ezsql'; // Convert to "a/b/c.ezsql"

    // Find the src directory by searching upward from the current file's directory
    let currentDir = path.dirname(document.uri.fsPath);
    let srcDir: string | undefined;
    
    while (currentDir !== path.parse(currentDir).root) {
        const potentialSrcDir = path.join(currentDir, 'src');
        if (fs.existsSync(potentialSrcDir) && fs.statSync(potentialSrcDir).isDirectory()) {
            srcDir = potentialSrcDir;
            break;
        }
        currentDir = path.dirname(currentDir);
    }

    if (!srcDir) {
        return undefined;
    }

    // Construct the full path to the target file
    const targetFile = path.join(srcDir, filePath);
    
    if (!fs.existsSync(targetFile)) {
        return undefined;
    }

    
    // Return the location of the target file
    return [
        {
            originSelectionRange: new vscode.Range(
                position.line,
                line.indexOf(importPath),
                position.line,
                line.indexOf(importPath) + importPath.length
            ),
            targetUri: vscode.Uri.file(targetFile),
            targetRange: new vscode.Range(0, 0, 0, 0) // Whole file
        }
    ];
}

export function definitionProvider(context:vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.languages.registerDefinitionProvider(
            'ezsql',
            {
                provideDefinition
            }
        )
    );
};
