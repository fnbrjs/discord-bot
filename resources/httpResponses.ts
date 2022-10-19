export interface CustomDocPage {
  name: string;
  fileName: string;
  type: string;
  content: string;
  path: string;
}

export interface CustomDocPages {
  [key: string]: CustomDocPage;
}

export interface CustomDocCategory {
  name: string;
  files: CustomDocPages;
}

export interface DocsDataMeta {
  generator: string;
  format: number;
  date: number;
}

export interface Custom {
  [key: string]: CustomDocCategory;
}

export interface PropMeta {
  line: number;
  file: string;
  path: string;
}

export interface ParamElement {
  name: string;
  description?: string;
  type: Array<Array<string[]>>;
  nullable?: boolean;
  meta?: PropMeta;
}

export interface Construct {
  name: string;
  params?: ParamElement[];
}

export interface Event {
  name: string;
  description: string;
  params?: ParamElement[];
  meta: PropMeta;
}

export interface ReturnsClass {
  types: Array<Array<string[]>>;
  description: string;
}

export type ReturnsUnion = Array<Array<string[]>> | ReturnsClass;

export interface Param {
  name: string;
  description?: string;
  type: Array<Array<string[]>>;
  default?: string;
  optional?: boolean;
  nullable?: boolean;
}

export interface ClassPropOrMethod {
  name: string;
  description?: string;
  returns?: ReturnsUnion;
  params?: Param[];
  throws?: Array<Array<string[]>>;
  scope?: string;
  access?: string;
  nullable?: boolean;
  meta: PropMeta;
  type: Array<Array<string[]>>;
  readonly?: boolean;
}

export interface ClassLike {
  name: string;
  description: string;
  access?: string;
  construct?: Construct;
  props?: ClassPropOrMethod[];
  methods?: ClassPropOrMethod[];
  meta: PropMeta;
  extends?: Array<Array<string[]>>;
  abstract?: boolean;
  events?: Event[];
}

export interface DocsData {
  meta: DocsDataMeta;
  custom: Custom;
  classes: ClassLike[];
  interfaces: ClassLike[];
  typedefs: ClassLike[];
}

export interface CachedDocsData extends DocsData {
  cachedAt: Date;
}
