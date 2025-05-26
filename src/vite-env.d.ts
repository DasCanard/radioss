/// <reference types="vite/client" />

declare module '../../package.json' {
  const value: {
    name: string;
    version: string;
    [key: string]: any;
  };
  export default value;
}
