import * as monaco from 'monaco-editor'

// Monaco Editor Workers Configuration
self.MonacoEnvironment = {
    getWorkerUrl: function (_moduleId: string, label: string) {
        if (label === 'json') {
            return './json.worker.bundle.js'
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
            return './css.worker.bundle.js'
        }
        if (label === 'html' || label === 'handlebars' || label === 'razor') {
            return './html.worker.bundle.js'
        }
        if (label === 'typescript' || label === 'javascript') {
            return './ts.worker.bundle.js'
        }
        return './editor.worker.bundle.js'
    }
}

// Enhanced language configurations
export const configureMonacoLanguages = () => {
    // TypeScript/JavaScript configuration
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.CommonJS,
        noEmit: true,
        esModuleInterop: true,
        jsx: monaco.languages.typescript.JsxEmit.React,
        reactNamespace: 'React',
        allowJs: true,
        typeRoots: ['node_modules/@types']
    })

    // Add React types
    monaco.languages.typescript.typescriptDefaults.addExtraLib(`
    declare namespace React {
      interface Component<P = {}, S = {}> {}
      interface FunctionComponent<P = {}> {
        (props: P): JSX.Element | null;
      }
      function useState<T>(initialState: T): [T, (value: T) => void];
      function useEffect(effect: () => void, deps?: any[]): void;
      function createContext<T>(defaultValue: T): React.Context<T>;
    }
    declare namespace JSX {
      interface Element {}
      interface IntrinsicElements {
        [elemName: string]: any;
      }
    }
  `, 'file:///node_modules/@types/react/index.d.ts')

    // Add Node.js types for backend development
    monaco.languages.typescript.typescriptDefaults.addExtraLib(`
    declare namespace NodeJS {
      interface ProcessEnv {
        [key: string]: string | undefined;
      }
      interface Process {
        env: ProcessEnv;
      }
    }
    declare var process: NodeJS.Process;
    declare var console: Console;
    declare var require: any;
    declare var module: any;
    declare var exports: any;
  `, 'file:///node_modules/@types/node/index.d.ts')

    // Java language support
    monaco.languages.register({ id: 'java' })
    monaco.languages.setMonarchTokensProvider('java', {
        // Define symbols used in the tokenizer
        symbols: /[=><!~?:&|+\-*/^%]+/,

        tokenizer: {
            root: [
                [/\b(public|private|protected|static|final|abstract|synchronized|native|transient|volatile)\b/, 'keyword'],
                [/\b(class|interface|enum|extends|implements|package|import)\b/, 'keyword'],
                [/\b(if|else|while|for|do|switch|case|default|break|continue|return|try|catch|finally|throw|throws)\b/, 'keyword'],
                [/\b(int|long|short|byte|float|double|char|boolean|void|String)\b/, 'type'],
                [/\b(true|false|null)\b/, 'keyword'],
                [/\/\/.*$/, 'comment'],
                [/\/\*[\s\S]*?\*\//, 'comment'],
                [/"([^"\\]|\\.)*$/, 'string.invalid'],
                [/"/, 'string', '@string'],
                [/\d+/, 'number'],
                [/[{}()[\]]/, '@brackets'],
                [/[<>](?!@symbols)/, '@brackets'],
                [/@symbols/, 'operator'],
                [/[a-zA-Z_$][\w$]*/, 'identifier']
            ],
            string: [
                [/[^\\"]+/, 'string'],
                [/"/, 'string', '@pop']
            ]
        }
    })

    // Python language support enhancement
    monaco.languages.setMonarchTokensProvider('python', {
        keywords: [
            'def', 'class', 'import', 'from', 'as', 'if', 'elif', 'else', 'while', 'for', 'in',
            'try', 'except', 'finally', 'with', 'lambda', 'return', 'yield', 'pass', 'break',
            'continue', 'global', 'nonlocal', 'assert', 'del', 'raise'
        ],

        typeKeywords: [
            'int', 'float', 'str', 'bool', 'list', 'dict', 'tuple', 'set', 'None', 'True', 'False'
        ],

        operators: [
            '=', '>', '<', '!', '~', '?', ':', '&', '|', '+', '-', '*', '/', '^', '%', '<<',
            '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=', '%=', '<<=', '>>=', '>>>='
        ],

        symbols: /[=><!~?:&|+\-*/^%]+/,

        tokenizer: {
            root: [
                [/[a-zA-Z_]\w*/, { cases: { '@keywords': 'keyword', '@typeKeywords': 'type', '@default': 'identifier' } }],
                [/#.*$/, 'comment'],
                [/"""[\s\S]*?"""/, 'string'],
                [/'''[\s\S]*?'''/, 'string'],
                [/"([^"\\]|\\.)*"/, 'string'],
                [/'([^'\\]|\\.)*'/, 'string'],
                [/\d*\.\d+([eE][-+]?\d+)?/, 'number.float'],
                [/0[xX][0-9a-fA-F]+/, 'number.hex'],
                [/\d+/, 'number'],
                [/[{}()[\]]/, '@brackets'],
                [/@symbols/, { cases: { '@operators': 'operator', '@default': '' } }]
            ]
        }
    })

    // C++ language support enhancement
    monaco.languages.setMonarchTokensProvider('cpp', {
        keywords: [
            'auto', 'bool', 'break', 'case', 'catch', 'char', 'class', 'const', 'continue', 'default', 'delete',
            'do', 'double', 'else', 'enum', 'explicit', 'extern', 'false', 'float', 'for', 'friend', 'goto',
            'if', 'inline', 'int', 'long', 'namespace', 'new', 'operator', 'private', 'protected', 'public',
            'return', 'short', 'signed', 'sizeof', 'static', 'struct', 'switch', 'template', 'this', 'throw',
            'true', 'try', 'typedef', 'typename', 'union', 'unsigned', 'using', 'virtual', 'void', 'volatile', 'while'
        ],

        typeKeywords: [
            'std', 'cout', 'cin', 'endl', 'string', 'vector', 'map', 'set', 'pair', 'queue', 'stack', 'priority_queue'
        ],

        operators: [
            '=', '>', '<', '!', '~', '?', ':', '&', '|', '+', '-', '*', '/', '^', '%', '<<',
            '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=', '%=', '<<=', '>>=', '>>>='
        ],

        symbols: /[=><!~?:&|+\-*/^%]+/,

        tokenizer: {
            root: [
                [/[a-zA-Z_]\w*/, { cases: { '@keywords': 'keyword', '@typeKeywords': 'type', '@default': 'identifier' } }],
                [/\/\/.*$/, 'comment'],
                [/\/\*[\s\S]*?\*\//, 'comment'],
                [/#include.*$/, 'keyword'],
                [/#define.*$/, 'keyword'],
                [/"([^"\\]|\\.)*"/, 'string'],
                [/\d*\.\d+([eE][-+]?\d+)?/, 'number.float'],
                [/0[xX][0-9a-fA-F]+/, 'number.hex'],
                [/\d+/, 'number'],
                [/[{}()[\]]/, '@brackets'],
                [/@symbols/, { cases: { '@operators': 'operator', '@default': '' } }]
            ]
        }
    })
}

// Language-specific validation
export const validateCode = (code: string, language: string): { errors: string[], warnings: string[] } => {
    const errors: string[] = []
    const warnings: string[] = []

    switch (language.toLowerCase()) {
        case 'java': {
            if (!code.includes('public class')) {
                errors.push('Java code must contain a public class declaration')
            }
            if (code.includes('public class') && !code.includes('public static void main')) {
                warnings.push('Consider adding a main method for executable Java code')
            }
            break
        }

        case 'python': {
            // Check for common Python syntax issues
            const lines = code.split('\n')
            lines.forEach((line, index) => {
                if (line.trim().endsWith(':') && lines[index + 1] && !lines[index + 1].startsWith('    ') && lines[index + 1].trim() !== '') {
                    errors.push(`Line ${index + 2}: Expected indentation after colon on line ${index + 1}`)
                }
            })
            break
        }

        case 'javascript':
        case 'typescript': {
            // Basic syntax checks
            const openBraces = (code.match(/{/g) || []).length
            const closeBraces = (code.match(/}/g) || []).length
            if (openBraces !== closeBraces) {
                errors.push('Mismatched braces: ensure all opening braces have closing braces')
            }

            const openParens = (code.match(/\(/g) || []).length
            const closeParens = (code.match(/\)/g) || []).length
            if (openParens !== closeParens) {
                errors.push('Mismatched parentheses: ensure all opening parentheses have closing parentheses')
            }
            break
        }

        case 'cpp':
        case 'c++': {
            if (!code.includes('#include')) {
                warnings.push('C++ code typically includes header files with #include directives')
            }
            if (!code.includes('int main')) {
                warnings.push('C++ executable code requires a main function')
            }
            break
        }
    }

    return { errors, warnings }
}

// Enhanced code completion for different languages
export const getLanguageCompletionItems = (language: string) => {
    switch (language.toLowerCase()) {
        case 'java': {
            const javaSnippets = [
                {
                    label: 'sysout',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: 'System.out.println(${1:message});',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'System.out.println() statement'
                },
                {
                    label: 'main',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: 'public static void main(String[] args) {\n\t${1:// Your code here}\n}',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Main method'
                }
            ]
            return javaSnippets
        }

        case 'python': {
            const pythonSnippets = [
                {
                    label: 'def',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: 'def ${1:function_name}(${2:parameters}):\n\t${3:pass}',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Function definition'
                },
                {
                    label: 'class',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: 'class ${1:ClassName}:\n\tdef __init__(self${2:, parameters}):\n\t\t${3:pass}',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Class definition'
                }
            ]
            return pythonSnippets
        }

        case 'javascript':
        case 'typescript': {
            const jsSnippets = [
                {
                    label: 'function',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: 'function ${1:functionName}(${2:parameters}) {\n\t${3:// Your code here}\n}',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Function declaration'
                },
                {
                    label: 'arrow',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: 'const ${1:functionName} = (${2:parameters}) => {\n\t${3:// Your code here}\n}',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Arrow function'
                }
            ]
            return jsSnippets
        }

        default:
            return []
    }
}