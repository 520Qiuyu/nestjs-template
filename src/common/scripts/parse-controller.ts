export interface ParsedRoute {
  name: string;
  code: string;
  remark: string;
  url: string;
  method: string;
}

const HTTP_METHODS = ['Get', 'Post', 'Put', 'Delete', 'Patch'] as const;

function toSnakeCase(value: string): string {
  return value
    .replace(/-/g, '_')
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
    .replace(/_+/g, '_');
}

/**
 * 根据 Controller 前缀与方法名生成权限 code
 * @example
 * ```ts
 * buildRouteCode('qishui/logs', 'getById') // 'qishui_logs_get_by_id'
 * ```
 */
function buildRouteCode(controllerPrefix: string, methodName: string): string {
  const prefixCode = toSnakeCase(controllerPrefix.replace(/\//g, '_'));
  const methodCode = toSnakeCase(methodName);
  return prefixCode ? `${prefixCode}_${methodCode}` : methodCode;
}

function joinRoute(prefix: string, routePath: string): string {
  const cleanPrefix = prefix.replace(/^\/|\/$/g, '');
  const cleanPath = routePath.replace(/^\/|\/$/g, '');

  if (!cleanPrefix) {
    return cleanPath ? `/${cleanPath}` : '/';
  }

  if (!cleanPath) {
    return `/${cleanPrefix}`;
  }

  return `/${cleanPrefix}/${cleanPath}`.replace(/\/+/g, '/');
}

/** 从 NestJS Controller 源码中解析路由信息 */
export function parseControllerRoutes(source: string): ParsedRoute[] {
  const controllerMatch = source.match(/@Controller\(['"]([^'"]+)['"]\)/);
  const controllerPrefix = controllerMatch?.[1] ?? '';
  const lines = source.split('\n');
  const routes: ParsedRoute[] = [];

  for (let i = 0; i < lines.length; i++) {
    const httpMatch = lines[i].match(
      /^\s*@(Get|Post|Put|Delete|Patch)\((?:'([^']*)')?\)/,
    );
    if (!httpMatch) {
      continue;
    }

    const httpMethod = httpMatch[1].toUpperCase();
    const routePath = httpMatch[2] ?? '';

    let comment = '';
    let isPublic = false;

    for (let j = i - 1; j >= 0; j--) {
      const line = lines[j].trim();
      if (!line) {
        continue;
      }

      const commentMatch = line.match(/^\/\/\s*(.+)$/);
      if (commentMatch) {
        comment = commentMatch[1].trim();
        continue;
      }

      if (line.startsWith('@Public')) {
        isPublic = true;
        continue;
      }

      if (line.startsWith('@')) {
        continue;
      }

      break;
    }

    if (isPublic) {
      continue;
    }

    let methodName = '';
    for (let j = i + 1; j < lines.length; j++) {
      const line = lines[j].trim();
      if (!line || line.startsWith('@')) {
        continue;
      }

      const methodMatch = line.match(/^(\w+)\s*\(/);
      if (methodMatch) {
        methodName = methodMatch[1];
        break;
      }
    }

    if (!methodName) {
      continue;
    }

    const label = comment || methodName;
    routes.push({
      name: label,
      code: buildRouteCode(controllerPrefix, methodName),
      remark: label,
      url: joinRoute(controllerPrefix, routePath),
      method: httpMethod,
    });  }

  return routes.filter((route) =>
    HTTP_METHODS.some((method) => route.method === method.toUpperCase()),
  );
}
