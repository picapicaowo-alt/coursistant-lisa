export interface LoadableStore<TData> {
  loadRoot: (data: TData) => void;
}