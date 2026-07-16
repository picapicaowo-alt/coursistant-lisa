declare module '@tiptap/core' {
  interface Editor {
    markdown: {
      get(options?: any): string;
      set(content: string, emitUpdate?: boolean): void;
    };
  }
}

export {};