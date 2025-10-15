import { useState, useRef, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
    Play,
    RotateCcw,
    Copy,
    Download,
    Lightbulb,
    CheckCircle,
    XCircle,
    Loader2,
    AlertTriangle,
    Info
} from 'lucide-react'
import { configureMonacoLanguages, validateCode, getLanguageCompletionItems } from '@/lib/monaco-config'

interface CodeEditorProps {
    defaultLanguage?: string
    defaultValue?: string
    height?: string
    theme?: 'light' | 'dark'
    readOnly?: boolean
    onCodeChange?: (code: string) => void
    onRunCode?: (code: string, language: string) => Promise<ExecutionResult>
    showExecutionPanel?: boolean
    className?: string
}

interface ExecutionResult {
    success: boolean
    output?: string
    error?: string
    aiEvaluation?: {
        score: number
        feedback: string
        suggestions: string[]
        codeQuality: {
            readability: number
            efficiency: number
            correctness: number
        }
    }
}

const LANGUAGE_OPTIONS = [
    { value: 'javascript', label: 'JavaScript', extension: '.js' },
    { value: 'typescript', label: 'TypeScript', extension: '.ts' },
    { value: 'jsx', label: 'React (JSX)', extension: '.jsx' },
    { value: 'tsx', label: 'React (TSX)', extension: '.tsx' },
    { value: 'vue', label: 'Vue.js', extension: '.vue' },
    { value: 'svelte', label: 'Svelte', extension: '.svelte' },
    { value: 'angular', label: 'Angular (TypeScript)', extension: '.ts' },
    { value: 'html', label: 'HTML', extension: '.html' },
    { value: 'css', label: 'CSS', extension: '.css' },
    { value: 'scss', label: 'SCSS', extension: '.scss' },
    { value: 'python', label: 'Python', extension: '.py' },
    { value: 'java', label: 'Java', extension: '.java' },
    { value: 'cpp', label: 'C++', extension: '.cpp' },
    { value: 'sql', label: 'SQL', extension: '.sql' }
]

const DEFAULT_CODE_TEMPLATES = {
    javascript: `// JavaScript Solution
function solution() {
    // Write your code here
    console.log("Hello, World!");
}

solution();`,
    typescript: `// TypeScript Solution
function solution(): void {
    // Write your code here
    console.log("Hello, World!");
}

solution();`,
    jsx: `// React JSX Component
import React, { useState } from 'react';

function MyComponent() {
    const [count, setCount] = useState(0);

    return (
        <div>
            <h1>Hello, React!</h1>
            <p>Count: {count}</p>
            <button onClick={() => setCount(count + 1)}>
                Increment
            </button>
        </div>
    );
}

export default MyComponent;`,
    tsx: `// React TypeScript Component
import React, { useState } from 'react';

interface Props {
    title?: string;
}

const MyComponent: React.FC<Props> = ({ title = "Hello, React!" }) => {
    const [count, setCount] = useState<number>(0);

    const handleIncrement = (): void => {
        setCount(prev => prev + 1);
    };

    return (
        <div>
            <h1>{title}</h1>
            <p>Count: {count}</p>
            <button onClick={handleIncrement}>
                Increment
            </button>
        </div>
    );
};

export default MyComponent;`,
    vue: `<!-- Vue.js Single File Component -->
<template>
  <div class="my-component">
    <h1>{{ title }}</h1>
    <p>Count: {{ count }}</p>
    <button @click="increment">Increment</button>
    <input v-model="message" placeholder="Type a message" />
    <p>{{ message }}</p>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'

export default {
  name: 'MyComponent',
  props: {
    title: {
      type: String,
      default: 'Hello, Vue!'
    }
  },
  setup(props) {
    const count = ref(0)
    const message = ref('')
    
    const increment = () => {
      count.value++
    }
    
    return {
      count,
      message,
      increment
    }
  }
}
</script>

<style scoped>
.my-component {
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
}

button {
  background: #42b883;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #369870;
}
</style>`,
    svelte: `<!-- Svelte Component -->
<script>
  import { onMount } from 'svelte';
  
  export let title = 'Hello, Svelte!';
  
  let count = 0;
  let message = '';
  let mounted = false;
  
  function increment() {
    count += 1;
  }
  
  onMount(() => {
    mounted = true;
  });
  
  $: doubled = count * 2;
</script>

<div class="my-component">
  <h1>{title}</h1>
  
  {#if mounted}
    <p>Component is mounted!</p>
  {/if}
  
  <p>Count: {count}</p>
  <p>Doubled: {doubled}</p>
  
  <button on:click={increment}>
    Increment
  </button>
  
  <input bind:value={message} placeholder="Type a message" />
  
  {#if message}
    <p>You typed: {message}</p>
  {/if}
</div>

<style>
  .my-component {
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 8px;
    font-family: Arial, sans-serif;
  }
  
  button {
    background: #ff3e00;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    margin: 5px 0;
  }
  
  button:hover {
    background: #cc3200;
  }
  
  input {
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    margin: 5px 0;
  }
</style>`,
    angular: `// Angular Component (TypeScript)
import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-my-component',
  template: \`
    <div class="my-component">
      <h1>{{ title }}</h1>
      <p>Count: {{ count }}</p>
      <button (click)="increment()">Increment</button>
      <input 
        [(ngModel)]="message" 
        placeholder="Type a message"
      />
      <p *ngIf="message">You typed: {{ message }}</p>
      
      <ul>
        <li *ngFor="let item of items; let i = index">
          {{ i + 1 }}. {{ item }}
        </li>
      </ul>
    </div>
  \`,
  styles: [\`
    .my-component {
      padding: 20px;
      border: 1px solid #ccc;
      border-radius: 8px;
    }
    
    button {
      background: #dd0031;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      margin: 5px 0;
    }
    
    button:hover {
      background: #b8002a;
    }
    
    input {
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      margin: 5px 0;
      width: 200px;
    }
  \`]
})
export class MyComponent implements OnInit {
  @Input() title: string = 'Hello, Angular!';
  
  count: number = 0;
  message: string = '';
  items: string[] = ['Angular', 'TypeScript', 'RxJS'];
  
  constructor() { }
  
  ngOnInit(): void {
    console.log('Component initialized');
  }
  
  increment(): void {
    this.count++;
  }
  
  addItem(): void {
    if (this.message.trim()) {
      this.items.push(this.message);
      this.message = '';
    }
  }
}`,
    python: `# Python Solution
def solution():
    # Write your code here
    print("Hello, World!")

solution()`,
    java: `// Java Solution
public class Solution {
    public static void main(String[] args) {
        // Write your code here
        System.out.println("Hello, World!");
    }
}`,
    cpp: `// C++ Solution
#include <iostream>
using namespace std;

int main() {
    // Write your code here
    cout << "Hello, World!" << endl;
    return 0;
}`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Frontend Framework Demo</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            margin: 0;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .framework-card {
            border: 1px solid #ddd;
            padding: 20px;
            margin: 15px 0;
            border-radius: 8px;
            transition: transform 0.2s;
        }
        .framework-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .react { border-left: 4px solid #61dafb; }
        .vue { border-left: 4px solid #4fc08d; }
        .angular { border-left: 4px solid #dd0031; }
        .svelte { border-left: 4px solid #ff3e00; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Frontend Frameworks Showcase</h1>
        
        <div class="framework-card react">
            <h2>⚛️ React</h2>
            <p>A JavaScript library for building user interfaces with component-based architecture.</p>
            <button onclick="showReactDemo()">Try React Demo</button>
        </div>
        
        <div class="framework-card vue">
            <h2>💚 Vue.js</h2>
            <p>The Progressive JavaScript Framework with an approachable learning curve.</p>
            <button onclick="showVueDemo()">Try Vue Demo</button>
        </div>
        
        <div class="framework-card angular">
            <h2>🅰️ Angular</h2>
            <p>Platform for building mobile and desktop web applications with TypeScript.</p>
            <button onclick="showAngularDemo()">Try Angular Demo</button>
        </div>
        
        <div class="framework-card svelte">
            <h2>🔥 Svelte</h2>
            <p>Cybernetically enhanced web apps with compile-time optimizations.</p>
            <button onclick="showSvelteDemo()">Try Svelte Demo</button>
        </div>
        
        <div id="demo-area" style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; display: none;">
            <h3>Framework Demo:</h3>
            <div id="demo-content"></div>
        </div>
    </div>

    <script>
        function showReactDemo() {
            const demoArea = document.getElementById('demo-area');
            const demoContent = document.getElementById('demo-content');
            
            demoContent.innerHTML = \`
                <h4>React Component Structure:</h4>
                <pre><code>function MyComponent() {
    const [count, setCount] = useState(0);
    return (
        &lt;div&gt;
            &lt;h1&gt;Count: {count}&lt;/h1&gt;
            &lt;button onClick={() =&gt; setCount(count + 1)}&gt;
                Increment
            &lt;/button&gt;
        &lt;/div&gt;
    );
}</code></pre>
            \`;
            demoArea.style.display = 'block';
        }
        
        function showVueDemo() {
            const demoArea = document.getElementById('demo-area');
            const demoContent = document.getElementById('demo-content');
            
            demoContent.innerHTML = \`
                <h4>Vue Component Structure:</h4>
                <pre><code>&lt;template&gt;
    &lt;div&gt;
        &lt;h1&gt;Count: {{ count }}&lt;/h1&gt;
        &lt;button @click="increment"&gt;Increment&lt;/button&gt;
    &lt;/div&gt;
&lt;/template&gt;

&lt;script&gt;
export default {
    data() {
        return { count: 0 }
    },
    methods: {
        increment() { this.count++ }
    }
}
&lt;/script&gt;</code></pre>
            \`;
            demoArea.style.display = 'block';
        }
        
        function showAngularDemo() {
            const demoArea = document.getElementById('demo-area');
            const demoContent = document.getElementById('demo-content');
            
            demoContent.innerHTML = \`
                <h4>Angular Component Structure:</h4>
                <pre><code>@Component({
    selector: 'app-counter',
    template: \\\`
        &lt;div&gt;
            &lt;h1&gt;Count: {{ count }}&lt;/h1&gt;
            &lt;button (click)="increment()"&gt;Increment&lt;/button&gt;
        &lt;/div&gt;
    \\\`
})
export class CounterComponent {
    count = 0;
    
    increment() {
        this.count++;
    }
}</code></pre>
            \`;
            demoArea.style.display = 'block';
        }
        
        function showSvelteDemo() {
            const demoArea = document.getElementById('demo-area');
            const demoContent = document.getElementById('demo-content');
            
            demoContent.innerHTML = \`
                <h4>Svelte Component Structure:</h4>
                <pre><code>&lt;script&gt;
    let count = 0;
    
    function increment() {
        count += 1;
    }
&lt;/script&gt;

&lt;div&gt;
    &lt;h1&gt;Count: {count}&lt;/h1&gt;
    &lt;button on:click={increment}&gt;Increment&lt;/button&gt;
&lt;/div&gt;</code></pre>
            \`;
            demoArea.style.display = 'block';
        }
    </script>
</body>
</html>`,
    css: `/* Modern CSS with Frontend Framework Styling */
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --react-color: #61dafb;
    --vue-color: #4fc08d;
    --angular-color: #dd0031;
    --svelte-color: #ff3e00;
    --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    --border-radius: 8px;
    --transition: all 0.3s ease;
}

/* Framework-inspired Button Styles */
.btn {
    padding: 12px 24px;
    border: none;
    border-radius: var(--border-radius);
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.btn-react {
    background: var(--react-color);
    color: #000;
}

.btn-react:hover {
    background: #21d4fd;
    transform: translateY(-2px);
    box-shadow: var(--shadow);
}

.btn-vue {
    background: var(--vue-color);
    color: white;
}

.btn-vue:hover {
    background: #41b883;
    transform: translateY(-2px);
}

.btn-angular {
    background: var(--angular-color);
    color: white;
}

.btn-angular:hover {
    background: #b8002a;
    transform: translateY(-2px);
}

.btn-svelte {
    background: var(--svelte-color);
    color: white;
}

.btn-svelte:hover {
    background: #cc3200;
    transform: translateY(-2px);
}

/* Framework Cards */
.framework-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin: 30px 0;
}

.framework-card {
    background: white;
    padding: 25px;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow);
    transition: var(--transition);
    position: relative;
    overflow: hidden;
}

.framework-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: var(--primary-color);
}

.framework-card.react::before { background: var(--react-color); }
.framework-card.vue::before { background: var(--vue-color); }
.framework-card.angular::before { background: var(--angular-color); }
.framework-card.svelte::before { background: var(--svelte-color); }

.framework-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* Component Structure Examples */
.code-example {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: var(--border-radius);
    padding: 20px;
    margin: 15px 0;
    font-family: 'Courier New', monospace;
    overflow-x: auto;
}

.syntax-highlight {
    color: #d63384;
}

.keyword {
    color: #0d6efd;
    font-weight: bold;
}

.string {
    color: #198754;
}

/* Responsive Design */
@media (max-width: 768px) {
    .framework-grid {
        grid-template-columns: 1fr;
        gap: 15px;
    }
    
    .btn {
        width: 100%;
        margin: 5px 0;
    }
    
    .framework-card {
        padding: 20px;
    }
}

/* Animation Keyframes */
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-fade-in {
    animation: fadeInUp 0.6s ease-out;
}

/* Framework-specific utility classes */
.react-gradient {
    background: linear-gradient(135deg, #61dafb, #21d4fd);
}

.vue-gradient {
    background: linear-gradient(135deg, #4fc08d, #41b883);
}

.angular-gradient {
    background: linear-gradient(135deg, #dd0031, #b8002a);
}

.svelte-gradient {
    background: linear-gradient(135deg, #ff3e00, #cc3200);
}`,
    scss: `// SCSS with Frontend Framework Variables and Mixins
// Framework Color Palette
$frameworks: (
  react: (
    primary: #61dafb,
    secondary: #21d4fd,
    dark: #20232a
  ),
  vue: (
    primary: #4fc08d,
    secondary: #41b883,
    dark: #2c3e50
  ),
  angular: (
    primary: #dd0031,
    secondary: #b8002a,
    dark: #1976d2
  ),
  svelte: (
    primary: #ff3e00,
    secondary: #cc3200,
    dark: #f96743
  )
);

// Mixins for Framework Styling
@mixin framework-button($framework) {
  $colors: map-get($frameworks, $framework);
  background: map-get($colors, primary);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  &:hover {
    background: map-get($colors, secondary);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(map-get($colors, primary), 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
}

@mixin framework-card($framework) {
  $colors: map-get($frameworks, $framework);
  background: white;
  border-left: 4px solid map-get($colors, primary);
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    border-left-color: map-get($colors, secondary);
  }
}

@mixin gradient-background($framework) {
  $colors: map-get($frameworks, $framework);
  background: linear-gradient(135deg, 
    map-get($colors, primary), 
    map-get($colors, secondary)
  );
}

// Component Classes
.framework-showcase {
  padding: 40px 20px;
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .header {
    text-align: center;
    margin-bottom: 50px;
    
    h1 {
      font-size: 3rem;
      font-weight: bold;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 20px;
    }
    
    p {
      font-size: 1.2rem;
      color: #666;
      max-width: 600px;
      margin: 0 auto;
    }
  }
  
  .framework-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 30px;
    margin: 40px 0;
  }
  
  // Framework-specific button styles
  .btn-react { @include framework-button(react); }
  .btn-vue { @include framework-button(vue); }
  .btn-angular { @include framework-button(angular); }
  .btn-svelte { @include framework-button(svelte); }
  
  // Framework-specific card styles
  .card-react { @include framework-card(react); }
  .card-vue { @include framework-card(vue); }
  .card-angular { @include framework-card(angular); }
  .card-svelte { @include framework-card(svelte); }
  
  // Code examples
  .code-example {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
    font-family: 'Fira Code', 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.6;
    overflow-x: auto;
    
    .keyword { color: #d73a49; font-weight: bold; }
    .string { color: #032f62; }
    .comment { color: #6a737d; font-style: italic; }
    .function { color: #6f42c1; }
    .variable { color: #e36209; }
  }
  
  // Feature comparison table
  .comparison-table {
    margin: 50px 0;
    overflow-x: auto;
    
    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      
      th, td {
        padding: 15px;
        text-align: left;
        border-bottom: 1px solid #e9ecef;
      }
      
      th {
        background: #f8f9fa;
        font-weight: 600;
        color: #495057;
      }
      
      tr:hover {
        background: #f8f9fa;
      }
    }
  }
  
  // Responsive design
  @media (max-width: 768px) {
    padding: 20px 10px;
    
    .header h1 {
      font-size: 2rem;
    }
    
    .framework-grid {
      grid-template-columns: 1fr;
      gap: 20px;
    }
    
    .code-example {
      padding: 15px;
      font-size: 12px;
    }
  }
}

// Utility classes for framework theming
@each $framework, $colors in $frameworks {
  .bg-#{$framework} {
    @include gradient-background($framework);
  }
  
  .text-#{$framework} {
    color: map-get($colors, primary);
  }
  
  .border-#{$framework} {
    border-color: map-get($colors, primary);
  }
}

// Animation utilities
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slideInUp 0.6s ease-out;
}

.animate-delay-1 { animation-delay: 0.1s; }
.animate-delay-2 { animation-delay: 0.2s; }
.animate-delay-3 { animation-delay: 0.3s; }
.animate-delay-4 { animation-delay: 0.4s; }`,
    sql: `-- SQL Solution for Frontend Framework Analytics
SELECT 'Hello, World!' as message;`
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
    defaultLanguage = 'javascript',
    defaultValue,
    height = '400px',
    theme = 'dark',
    readOnly = false,
    onCodeChange,
    onRunCode,
    showExecutionPanel = true,
    className = ''
}) => {
    const [language, setLanguage] = useState(defaultLanguage)
    const [code, setCode] = useState(defaultValue || DEFAULT_CODE_TEMPLATES[defaultLanguage as keyof typeof DEFAULT_CODE_TEMPLATES] || '')
    const [isRunning, setIsRunning] = useState(false)
    const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null)
    const [editorTheme, setEditorTheme] = useState(theme === 'dark' ? 'vs-dark' : 'light')
    const [validationResult, setValidationResult] = useState<{ errors: string[], warnings: string[] }>({ errors: [], warnings: [] })
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

    useEffect(() => {
        setEditorTheme(theme === 'dark' ? 'vs-dark' : 'light')
    }, [theme])

    useEffect(() => {
        // Configure Monaco languages when component mounts
        configureMonacoLanguages()
    }, [])

    useEffect(() => {
        // Validate code when it changes
        const validation = validateCode(code, language)
        setValidationResult(validation)
    }, [code, language])

    const handleEditorChange = (value: string | undefined) => {
        const newCode = value || ''
        setCode(newCode)
        onCodeChange?.(newCode)
    }

    const handleRunCode = async () => {
        if (!onRunCode || !code.trim()) return

        setIsRunning(true)
        setExecutionResult(null)

        try {
            const result = await onRunCode(code, language)
            setExecutionResult(result)
        } catch (error) {
            setExecutionResult({
                success: false,
                error: error instanceof Error ? error.message : 'An unknown error occurred'
            })
        } finally {
            setIsRunning(false)
        }
    }

    const handleResetCode = () => {
        const template = DEFAULT_CODE_TEMPLATES[language as keyof typeof DEFAULT_CODE_TEMPLATES] || ''
        setCode(template)
        editorRef.current?.setValue(template)
        setExecutionResult(null)
    }

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(code)
            // You could add a toast notification here
        } catch (error) {
            console.error('Failed to copy code:', error)
        }
    }

    const handleDownloadCode = () => {
        const languageConfig = LANGUAGE_OPTIONS.find(lang => lang.value === language)
        const extension = languageConfig?.extension || '.txt'
        const blob = new Blob([code], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `solution${extension}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const handleLanguageChange = (newLanguage: string) => {
        setLanguage(newLanguage)
        const template = DEFAULT_CODE_TEMPLATES[newLanguage as keyof typeof DEFAULT_CODE_TEMPLATES] || ''
        setCode(template)
        editorRef.current?.setValue(template)
        setExecutionResult(null)
    }

    // Map custom framework languages to Monaco Editor languages
    const getMonacoLanguage = (language: string) => {
        const languageMap: { [key: string]: string } = {
            'jsx': 'javascript',
            'tsx': 'typescript',
            'vue': 'html', // Vue SFC uses HTML-like syntax
            'svelte': 'html', // Svelte uses HTML-like syntax
            'angular': 'typescript', // Angular uses TypeScript
            'scss': 'scss'
        }
        return languageMap[language] || language
    }

    const onMount = (editorInstance: editor.IStandaloneCodeEditor, monacoInstance: typeof import('monaco-editor')) => {
        editorRef.current = editorInstance
        editorInstance.focus()

        // Register completion item providers for enhanced IntelliSense
        const completionItems = getLanguageCompletionItems(language)
        if (completionItems.length > 0) {
            monacoInstance.languages.registerCompletionItemProvider(getMonacoLanguage(language), {
                provideCompletionItems: (model, position) => {
                    const word = model.getWordUntilPosition(position)
                    const range = {
                        startLineNumber: position.lineNumber,
                        endLineNumber: position.lineNumber,
                        startColumn: word.startColumn,
                        endColumn: word.endColumn
                    }
                    return {
                        suggestions: completionItems.map(item => ({
                            ...item,
                            range
                        }))
                    }
                }
            })
        }

        // Add custom actions
        editorInstance.addAction({
            id: 'validate-code',
            label: 'Validate Code',
            keybindings: [monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyQ],
            run: () => {
                const validation = validateCode(editorInstance.getValue(), language)
                setValidationResult(validation)

                if (validation.errors.length > 0 || validation.warnings.length > 0) {
                    // Show validation results in editor
                    const markers = [
                        ...validation.errors.map(error => ({
                            severity: monacoInstance.MarkerSeverity.Error,
                            message: error,
                            startLineNumber: 1,
                            startColumn: 1,
                            endLineNumber: 1,
                            endColumn: 1
                        })),
                        ...validation.warnings.map(warning => ({
                            severity: monacoInstance.MarkerSeverity.Warning,
                            message: warning,
                            startLineNumber: 1,
                            startColumn: 1,
                            endLineNumber: 1,
                            endColumn: 1
                        }))
                    ]
                    const model = editorInstance.getModel()
                    if (model) {
                        monacoInstance.editor.setModelMarkers(model, 'validation', markers)
                    }
                }
            }
        })

        // Auto-format on paste for better code quality
        editorInstance.onDidPaste(() => {
            editorInstance.getAction('editor.action.formatDocument')?.run()
        })
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Editor Header */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-t-lg border border-b-0">
                <div className="flex items-center gap-3">
                    <select
                        value={language}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        className="px-3 py-1 text-sm border border-border rounded-md bg-background"
                        disabled={readOnly}
                    >
                        {LANGUAGE_OPTIONS.map(lang => (
                            <option key={lang.value} value={lang.value}>
                                {lang.label}
                            </option>
                        ))}
                    </select>
                    <div className="text-sm text-muted-foreground">
                        {code.split('\n').length} lines
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyCode}
                        disabled={!code.trim()}
                    >
                        <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDownloadCode}
                        disabled={!code.trim()}
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResetCode}
                        disabled={readOnly}
                    >
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                    {onRunCode && (
                        <Button
                            onClick={handleRunCode}
                            disabled={isRunning || !code.trim() || readOnly}
                            size="sm"
                            className="ml-2"
                        >
                            {isRunning ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Play className="h-4 w-4 mr-2" />
                            )}
                            Run Code
                        </Button>
                    )}
                </div>
            </div>

            {/* Monaco Editor */}
            <div className="border border-border rounded-b-lg overflow-hidden">
                <Editor
                    height={height}
                    language={getMonacoLanguage(language)}
                    value={code}
                    theme={editorTheme}
                    onChange={handleEditorChange}
                    onMount={onMount}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        roundedSelection: false,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        insertSpaces: true,
                        wordWrap: 'on',
                        suggestOnTriggerCharacters: true,
                        acceptSuggestionOnEnter: 'on',
                        readOnly: readOnly,
                        contextmenu: !readOnly,
                        // Enhanced options for framework development
                        bracketPairColorization: { enabled: true },
                        formatOnPaste: true,
                        formatOnType: true,
                        // Enhanced IntelliSense
                        quickSuggestions: {
                            other: true,
                            comments: true,
                            strings: true
                        },
                        parameterHints: { enabled: true },
                        autoIndent: 'full',
                        foldingStrategy: 'indentation'
                    }}
                />
            </div>

            {/* Code Validation Panel */}
            {(validationResult.errors.length > 0 || validationResult.warnings.length > 0) && (
                <Card className="p-4 border-l-4 border-l-orange-500">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                            <span className="font-medium">Code Validation</span>
                        </div>

                        {validationResult.errors.length > 0 && (
                            <div>
                                <h5 className="font-medium text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                                    <XCircle className="h-4 w-4" />
                                    Errors ({validationResult.errors.length})
                                </h5>
                                <ul className="space-y-1">
                                    {validationResult.errors.map((error, index) => (
                                        <li key={index} className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
                                            <span className="text-red-500 mt-1">•</span>
                                            {error}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {validationResult.warnings.length > 0 && (
                            <div>
                                <h5 className="font-medium text-orange-600 dark:text-orange-400 mb-2 flex items-center gap-2">
                                    <Info className="h-4 w-4" />
                                    Warnings ({validationResult.warnings.length})
                                </h5>
                                <ul className="space-y-1">
                                    {validationResult.warnings.map((warning, index) => (
                                        <li key={index} className="text-sm text-orange-600 dark:text-orange-400 flex items-start gap-2">
                                            <span className="text-orange-500 mt-1">•</span>
                                            {warning}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                            Press Ctrl+Q (Cmd+Q on Mac) to validate your code
                        </div>
                    </div>
                </Card>
            )}

            {/* Execution Results Panel */}
            {showExecutionPanel && executionResult && (
                <Card className="p-4">
                    <div className="space-y-4">
                        {/* Execution Status */}
                        <div className="flex items-center gap-2">
                            {executionResult.success ? (
                                <>
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    <span className="font-medium text-green-700 dark:text-green-400">
                                        Execution Successful
                                    </span>
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-5 w-5 text-red-500" />
                                    <span className="font-medium text-red-700 dark:text-red-400">
                                        Execution Failed
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Output */}
                        {executionResult.output && (
                            <div>
                                <h4 className="font-medium mb-2">Output:</h4>
                                <pre className="p-3 bg-muted rounded-md text-sm overflow-auto">
                                    {executionResult.output}
                                </pre>
                            </div>
                        )}

                        {/* Error */}
                        {executionResult.error && (
                            <div>
                                <h4 className="font-medium mb-2 text-red-600 dark:text-red-400">Error:</h4>
                                <pre className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-700 dark:text-red-400 overflow-auto">
                                    {executionResult.error}
                                </pre>
                            </div>
                        )}

                        {/* AI Evaluation */}
                        {executionResult.aiEvaluation && (
                            <div className="border-t pt-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Lightbulb className="h-5 w-5 text-blue-500" />
                                    <h4 className="font-medium">AI Code Evaluation</h4>
                                    <div className="ml-auto">
                                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium">
                                            Score: {executionResult.aiEvaluation.score}/100
                                        </span>
                                    </div>
                                </div>

                                {/* Code Quality Metrics */}
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div className="text-center">
                                        <div className="text-sm text-muted-foreground">Readability</div>
                                        <div className="text-lg font-semibold">
                                            {executionResult.aiEvaluation.codeQuality.readability}/10
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm text-muted-foreground">Efficiency</div>
                                        <div className="text-lg font-semibold">
                                            {executionResult.aiEvaluation.codeQuality.efficiency}/10
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm text-muted-foreground">Correctness</div>
                                        <div className="text-lg font-semibold">
                                            {executionResult.aiEvaluation.codeQuality.correctness}/10
                                        </div>
                                    </div>
                                </div>

                                {/* Feedback */}
                                <div className="space-y-3">
                                    <div>
                                        <h5 className="font-medium mb-1">Feedback:</h5>
                                        <p className="text-sm text-muted-foreground">
                                            {executionResult.aiEvaluation.feedback}
                                        </p>
                                    </div>

                                    {executionResult.aiEvaluation.suggestions.length > 0 && (
                                        <div>
                                            <h5 className="font-medium mb-2">Suggestions for Improvement:</h5>
                                            <ul className="space-y-1">
                                                {executionResult.aiEvaluation.suggestions.map((suggestion, index) => (
                                                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                                        <span className="text-blue-500 mt-1">•</span>
                                                        {suggestion}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    )
}

export default CodeEditor