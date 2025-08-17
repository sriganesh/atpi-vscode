import * as vscode from 'vscode';

export function formatJsonForHover(data: any, _url: string): string {
    // Get max length from configuration
    const config = vscode.workspace.getConfiguration('atpi');
    const maxLength = config.get<number>('hoverMaxLength', 20000);
    
    let jsonString = JSON.stringify(data, null, 2);
    
    // If maxLength is 0, don't truncate
    if (maxLength > 0 && jsonString.length > maxLength) {
        // Truncate and add ellipsis
        jsonString = jsonString.substring(0, maxLength) + '\n...';
        
        // Try to close any open brackets
        const openBrackets = (jsonString.match(/[{[]/g) || []).length;
        const closeBrackets = (jsonString.match(/[}\]]/g) || []).length;
        
        if (openBrackets > closeBrackets) {
            jsonString += '\n' + '}]'.repeat(openBrackets - closeBrackets);
        }
    }
    
    return jsonString;
}

export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleString();
}

export function summarizeData(data: any): { summary: string; details: Record<string, any> } {
    const details: Record<string, any> = {};
    
    if (typeof data !== 'object' || data === null) {
        return {
            summary: String(data),
            details: { value: data }
        };
    }
    
    // Extract key information based on common AT Protocol patterns
    if (data.$type) {
        details['type'] = data.$type;
    }
    
    if (data.uri) {
        details['uri'] = data.uri;
    }
    
    if (data.cid) {
        details['cid'] = data.cid;
    }
    
    if (data.text) {
        details['text'] = data.text.length > 100 
            ? data.text.substring(0, 100) + '...' 
            : data.text;
    }
    
    if (data.createdAt) {
        details['created'] = new Date(data.createdAt).toLocaleString();
    }
    
    if (data.displayName) {
        details['displayName'] = data.displayName;
    }
    
    if (data.handle) {
        details['handle'] = data.handle;
    }
    
    if (data.did) {
        details['did'] = data.did;
    }
    
    // Count arrays and objects
    let arrayCount = 0;
    let objectCount = 0;
    
    for (const key in data) {
        if (Array.isArray(data[key])) {
            arrayCount++;
            details[`${key}_count`] = data[key].length;
        } else if (typeof data[key] === 'object' && data[key] !== null) {
            objectCount++;
        }
    }
    
    const totalKeys = Object.keys(data).length;
    const summary = `Object with ${totalKeys} keys, ${arrayCount} arrays, ${objectCount} nested objects`;
    
    return { summary, details };
}