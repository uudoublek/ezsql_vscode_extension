import * as vscode from 'vscode';

// 关键字列表
const keywords = [
    'case', 'when', 'else', 'end', 
    'true', 'false', 'null',
    'select', 'from', 'where', 'between', 'join',
    'like', 'regexp', 'create',
    'persistence', 'import'
];

interface ImportStatement {
    original: string;    // 完整的 import 语句
    path: string;       // a.b.c 路径部分
    alias?: string;     // 别名（如果有）
    lineNumber: number; // 所在行号
}

/**
 * 解析 HTML 文件中<head>标签内的所有 import 语句
 * @param document 要解析的文档
 * @returns 包含所有 import 语句信息的数组
 */
function parseHeadImports(document: vscode.TextDocument): ImportStatement[] {
    const results: ImportStatement[] = [];
    let inHeadSection = false;
    
    // 匹配 import 语句的正则表达式
    const importRegex = /import\s+([a-zA-Z0-9_.]+)(?:\s+as\s+([a-zA-Z0-9_]+))?/;
    
    for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i).text.trim();
        
        // 检测 <head> 标签开始
        if (line.match(/<head(\s|>)/i)) {
            inHeadSection = true;
            continue;
        }
        
        // 检测 </head> 标签结束
        if (line.match(/<\/head>/i)) {
            inHeadSection = false;
            break;
        }
        
        // 只在 head 区域内查找 import 语句
        if (inHeadSection) {
            const match = line.match(importRegex);
            if (match) {
                results.push({
                    original: line,
                    path: match[1],    // a.b.c 路径
                    alias: match[2],   // 别名（可能为 undefined）
                    lineNumber: i
                });
            }
        }
    }
    
    return results;
}

/**
 * 自动提示关键字，提示引用补全
 * @param {*} document 
 * @param {*} position 
 * @param {*} token 
 * @param {*} context 
 */
function provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
    // 初始化completions清单
    const completions: vscode.CompletionItem[] = [];
    // 1、简单关键字补全
    const keywordCompletions = keywords.map(keyword => {
        const item = new vscode.CompletionItem(keyword, vscode.CompletionItemKind.Keyword);
        item.documentation = `ezsql keyword: ${keyword}`;
        return item;
    });
    completions.push(...keywordCompletions);
    // 2、引用文件文件补全
    const linePrefix = document.lineAt(position).text.substring(0, position.character);
    // TODO 识别到@前缀，将本文件中import的内容加入候选
    if (linePrefix.endsWith('@')) {
        // 获取所有 import 语句
        const imports = parseHeadImports(document);
        for (let item of imports) {
                completions.push({
                    label: '{'+item.path,
                    kind: vscode.CompletionItemKind.Module,
                    documentation: 'Module: '+item.path,
                });
                if (item.alias) {
                    completions.push({
                        label: '{'+item.alias,
                        kind: vscode.CompletionItemKind.Module,
                        documentation: 'Module: '+item.alias,
                    });
                }
        }
    }

    return completions;
}

/**
 * 光标选中当前自动补全item时触发动作，一般情况下无需处理
 * @param {*} item 
 * @param {*} token 
 */
function resolveCompletionItem(
    item: vscode.CompletionItem,
    token: vscode.CancellationToken
) {
    return null;
}

export function completionProvider(context:vscode.ExtensionContext) {
    // 注册代码建议提示，默认是字母数字会触发，使当按下“@”时也会触发
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            'ezsql',
            {
                provideCompletionItems,
                resolveCompletionItem
            },
            '@'
        )
    );
};

