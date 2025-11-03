export const enum EnvironmentMode {
  WEB = 'web',
  EXTENSION = 'extension'
}

export interface Environment {
  mode: EnvironmentMode;
}
