/**
 * @description
 * HTTP code snippet generator for Clojure using clj-http.
 *
 * @author
 * @tggreene
 *
 * for any questions or issues regarding the generated code snippet, please open an issue mentioning the author.
 */

import { CodeBuilder } from '../../../helpers/code-builder.js';
import { getHeader, getHeaderName } from '../../../helpers/headers.js';
import type { Client } from '../../targets.js';

class Keyword {
  name = '';
  constructor(name: string) {
    this.name = name;
  }

  toString = () => `:${this.name}`;
}

class File {
  path = '';
  constructor(path: string) {
    this.path = path;
  }

  toString = () => `(clojure.java.io/file "${this.path}")`;
}

const jsType = (input?: any) => {
  if (input === undefined) {
    return null;
  }

  if (input === null) {
    return 'null';
  }

  return input.constructor.name.toLowerCase();
};

const objEmpty = (input?: any) => {
  if (jsType(input) === 'object') {
    return Object.keys(input).length === 0;
  }
  return false;
};

const filterEmpty = (input: Record<string, any>) => {
  Object.keys(input)
    .filter(x => objEmpty(input[x]))
    .forEach(x => {
      delete input[x];
    });
  return input;
};

const padBlock = (padSize: number, input: string) => {
  const padding = ' '.repeat(padSize);
  return input.replace(/\n/g, `\n${padding}`);
};

const jsToEdn = (js: any) => {
  switch (jsType(js)) {
    case 'string':
      return `"${js.replace(/"/g, '\\"')}"`;

    case 'file':
      return js.toString();

    case 'keyword':
      return js.toString();

    case 'null':
      return 'nil';

    case 'regexp':
      return `#"${js.source}"`;

    case 'object': {
      // simple vertical format
      const obj = Object.keys(js)
        .reduce((accumulator, key) => {
          const val = padBlock(key.length + 2, jsToEdn(js[key]));
          return `${accumulator}:${key} ${val}\n `;
        }, '')
        .trim();
      return `{${padBlock(1, obj)}}`;
    }

    case 'array': {
      // simple horizontal format
      const arr = js
        .reduce((accumulator: string, value: string) => `${accumulator} ${jsToEdn(value)}`, '')
        .trim();
      return `[${padBlock(1, arr)}]`;
    }

    default: // 'number' 'boolean'
      return js.toString();
  }
};

export const clj_http: Client = {
  info: {
    key: 'clj_http',
    title: 'clj-http',
    link: 'https://github.com/dakrone/clj-http',
    description: 'An idiomatic clojure http client wrapping the apache client.',
  },
  convert: ({ queryObj, method, postData, url, allHeaders }, options) => {
    const { push, join } = new CodeBuilder({ indent: options?.indent });
    const methods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'];
    method = method.toLowerCase();

    if (!methods.includes(method)) {
      push('Method not supported');
      return join();
    }

    const params: Record<string, any> = {
      headers: allHeaders,
      'query-params': queryObj,
    };

    switch (postData?.mimeType) {
      case 'application/json':
        {
          params['content-type'] = new Keyword('json');
          params['form-params'] = postData.jsonObj;
          const header = getHeaderName(params.headers, 'content-type');
          if (header) {
            delete params.headers[header];
          }
        }
        break;

      case 'application/x-www-form-urlencoded':
        {
          params['form-params'] = postData.paramsObj;
          const header = getHeaderName(params.headers, 'content-type');
          if (header) {
            delete params.headers[header];
          }
        }
        break;

      case 'text/plain':
        {
          params.body = postData.text;
          const header = getHeaderName(params.headers, 'content-type');
          if (header) {
            delete params.headers[header];
          }
        }
        break;

      case 'multipart/form-data': {
        if (postData.params) {
          params.multipart = postData.params.map(param => {
            if (param.fileName && !param.value) {
              return {
                name: param.name,
                content: new File(param.fileName),
              };
            }
            return {
              name: param.name,
              content: param.value,
            };
          });

          const header = getHeaderName(params.headers, 'content-type');
          if (header) {
            delete params.headers[header];
          }
        }
        break;
      }
    }

    switch (getHeader(params.headers, 'accept')) {
      case 'application/json':
        {
          params.accept = new Keyword('json');

          const header = getHeaderName(params.headers, 'accept');
          if (header) {
            delete params.headers[header];
          }
        }
        break;
    }

    push("(require '[clj-http.client :as client])\n");

    if (objEmpty(filterEmpty(params))) {
      push(`(client/${method} "${url}")`);
    } else {
      const padding = 11 + method.length + url.length;
      const formattedParams = padBlock(padding, jsToEdn(filterEmpty(params)));
      push(`(client/${method} "${url}" ${formattedParams})`);
    }

    return join();
  },
};
