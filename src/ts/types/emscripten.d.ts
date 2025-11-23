/**
 * Emscripten Module Type Definitions
 * Basic type definitions for Emscripten-generated modules
 */

export interface EmscriptenModule {
  // Memory and file system
  FS?: any;
  HEAP8?: Int8Array;
  HEAP16?: Int16Array;
  HEAP32?: Int32Array;
  HEAPU8?: Uint8Array;
  HEAPU16?: Uint16Array;
  HEAPU32?: Uint32Array;
  HEAPF32?: Float32Array;
  HEAPF64?: Float64Array;

  // Runtime methods
  ccall?: (
    ident: string,
    returnType: string | null,
    argTypes: string[],
    args: any[]
  ) => any;
  cwrap?: (
    ident: string,
    returnType: string | null,
    argTypes: string[]
  ) => (...args: any[]) => any;

  // Lifecycle hooks
  onRuntimeInitialized?: () => void;
  preRun?: Array<() => void>;
  postRun?: Array<() => void>;

  // Other common properties
  print?: (text: string) => void;
  printErr?: (text: string) => void;
  setStatus?: (text: string) => void;
  totalDependencies?: number;
  monitorRunDependencies?: (left: number) => void;
}
