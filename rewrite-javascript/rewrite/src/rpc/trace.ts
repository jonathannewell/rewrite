/*
 * Copyright 2025 the original author or authors.
 * <p>
 * Licensed under the Moderne Source Available License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * <p>
 * https://docs.moderne.io/licensing/moderne-source-available-license
 * <p>
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {readFileSync} from "fs";
import {AsyncLocalStorage} from "node:async_hooks";

const stackStorage = new AsyncLocalStorage<string>();

export function saveTrace<T>(condition: any | undefined, action: () => Promise<T>): Promise<T> {
    if (condition) {
        const entryStack = new Error().stack ?? '';
        return stackStorage.run(entryStack, action);
    }
    return action();
}

/**
 * Inspect the call stack to find the nearest Receiver/Sender subclass
 * and log the source line that invoked receive.
 */
export function trace(type: "Receiver" | "Sender"): string | undefined {
    const stack = stackStorage.getStore()?.split("\n") ?? [];
    for (const frame of stack.slice(1)) {
        const match = frame.match(/at\s+(.*?)\s+\((.*):(\d+):(\d+)\)/);
        if (match) {
            const [, fn, file, line] = match;
            const className = fn.includes('.') ? fn.split('.')[0] : fn;
            if (className.endsWith(type)) {
                try {
                    const codeLine = readFileSync(file, 'utf-8')
                        .split('\n')[parseInt(line, 10) - 1]
                        .trim();
                    return `${className}:${line} => ${codeLine}`;
                } catch {
                    // ignore if reading the source file fails
                }
                break;
            }
        }
    }
    return undefined;
}
