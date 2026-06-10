export interface Project {
  id: string;
  name: string;
  html: string;
  css: string;
  js: string;
  createdAt: string;
  updatedAt: string;
}

export type LayoutMode = 'grid' | 'tabs-horizontal' | 'tabs-vertical' | 'split-vertical';

export type ActiveTab = 'html' | 'css' | 'js';

export interface ConsoleLog {
  type: 'log' | 'error' | 'warn' | 'info';
  message: string;
  timestamp: string;
}

export interface Templates {
  [key: string]: {
    name: string;
    description: string;
    html: string;
    css: string;
    js: string;
  };
}
