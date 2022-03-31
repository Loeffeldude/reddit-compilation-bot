export type UndefinedFields<T> = {
  [P in keyof T]?: T[P];
};
export type NonUndefined<T> = { [P in keyof T]-?: T[P] };
