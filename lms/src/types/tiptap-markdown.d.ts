declare module '@tiptap/core' {
  interface Editor {
    markdown: {
      get(options?: Record<string, unknown>): string;
      set(content: string, emitUpdate?: boolean): void;
    };
  }
}

export {};