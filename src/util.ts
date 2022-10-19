import builtInTypes from '../resources/builtInTypes';
import { DocsData } from '../resources/httpResponses';

export const parseErrorStack = (stack: string) => stack
  .replaceAll('/root/FNBRJSBOT/dist', '<PROJECTDIR>')
  .replaceAll('/root', '<HOMEDIR>');

export const findClassLike = (docsData: DocsData, name: string) => {
  for (const docClassLike of docsData.classes) {
    if (docClassLike.name.toLowerCase() === name.toLowerCase()) {
      return {
        matchType: 'class',
        classLike: docClassLike,
      };
    }
  }

  for (const docClassLike of docsData.interfaces) {
    if (docClassLike.name.toLowerCase() === name.toLowerCase()) {
      return {
        matchType: 'interface',
        classLike: docClassLike,
      };
    }
  }

  for (const docClassLike of docsData.typedefs) {
    if (docClassLike.name.toLowerCase() === name.toLowerCase()) {
      return {
        matchType: 'typedef',
        classLike: docClassLike,
      };
    }
  }

  return undefined;
};

export const searchClassLike = (docsData: DocsData, name: string) => {
  const results = [];

  for (const docClassLike of docsData.classes) {
    if (docClassLike.name.toLowerCase().startsWith(name.toLowerCase())) {
      results.push({
        matchType: 'class',
        classLike: docClassLike,
      });
    }
  }

  for (const docClassLike of docsData.interfaces) {
    if (docClassLike.name.toLowerCase().startsWith(name.toLowerCase())) {
      results.push({
        matchType: 'interface',
        classLike: docClassLike,
      });
    }
  }

  for (const docClassLike of docsData.typedefs) {
    if (docClassLike.name.toLowerCase().startsWith(name.toLowerCase())) {
      results.push({
        matchType: 'typedef',
        classLike: docClassLike,
      });
    }
  }

  return results;
};

export const getDocsLink = (version: string, linkableType: string, linkableName: string,
  propName?: string) => `https://fnbr.js.org/#/docs/main/${version}/${linkableType}/${linkableName}${propName ? `?scrollTo=${propName}` : ''}`;

export const parseType = (type: Array<Array<string[]>>, docsData: DocsData, version: string) => type.map((subType) => {
  let str = '';
  for (const subSubType of subType) {
    for (const subSubSubType of subSubType) {
      let finalType = subSubSubType;

      if (!/(or|<|>|,)/g.test(finalType)) {
        const linkable = findClassLike(docsData, finalType);
        if (linkable) {
          finalType = `[${finalType}](${getDocsLink(version, linkable.matchType, linkable.classLike.name)})`;
        } else if ((builtInTypes as any)[finalType]) {
          finalType = `[${finalType}](${(builtInTypes as any)[finalType]})`;
        }
      }

      str += finalType;
    }
  }

  return str;
}).join(' or ');
