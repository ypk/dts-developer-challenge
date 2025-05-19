declare module 'express-dart-sass' {
  import { RequestHandler } from 'express';

  interface DartSassOptions {
    src: string;
    dest: string;
    debug?: boolean;
    outputStyle?: 'compressed' | 'expanded';
    prefix?: string;
    sourceMap?: boolean;
    force?: boolean;
    response?: boolean;
    root?: string;
    indentType?: 'space' | 'tab';
    indentWidth?: number;
    linefeed?: 'cr' | 'crlf' | 'lf' | 'lfcr';
  }

  function dartSass(options: DartSassOptions): RequestHandler;

  export = dartSass;
}
