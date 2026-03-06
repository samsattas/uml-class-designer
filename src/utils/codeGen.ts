import { ClassData, Connection } from '../types';

export function generateCode(classes: ClassData[], connections: Connection[], lang: string): string {
  let fullCode = '';
  classes.forEach(cls => {
    const rels = connections.filter(c => c.from === cls.id);
    fullCode += getCodeForClass(cls, rels, classes, lang) + '\n\n';
  });
  return fullCode.trim();
}

function getCodeForClass(cls: ClassData, rels: Connection[], allClasses: ClassData[], lang: string): string {
  switch (lang) {
    case 'java': return generateJava(cls, rels, allClasses);
    case 'python': return generatePython(cls, rels, allClasses);
    case 'typescript': return generateTypeScript(cls, rels, allClasses);
    case 'csharp': return generateCSharp(cls, rels, allClasses);
    case 'cpp': return generateCpp(cls, rels, allClasses);
    default: return '';
  }
}

function generateJava(cls: ClassData, rels: Connection[], allClasses: ClassData[]): string {
  let s = `public class ${cls.name} {\n`;
  cls.attributes.forEach(a => {
    const type = a.isList ? `List<${a.type}>` : a.type;
    s += `    private ${type} ${a.name};\n`;
  });
  rels.forEach(r => {
    const target = allClasses.find(c => c.id === r.to);
    if (target && r.attributeName) {
      const type = r.isList ? `List<${target.name}>` : target.name;
      s += `    private ${type} ${r.attributeName};\n`;
    }
  });
  s += `\n    public ${cls.name}() {\n    }\n\n`;
  cls.methods.forEach(m => {
    s += `    public ${m.returnType} ${m.name}() {\n        // TODO\n    }\n\n`;
  });
  return s + `}`;
}

function generatePython(cls: ClassData, rels: Connection[], allClasses: ClassData[]): string {
  let s = `class ${cls.name}:\n`;
  s += `    def __init__(self):\n`;
  if (cls.attributes.length === 0 && rels.length === 0) s += `        pass\n`;
  cls.attributes.forEach(a => {
    const val = a.isList ? '[]' : 'None';
    s += `        self.${a.name}: ${a.isList ? 'List[' + a.type + ']' : a.type} = ${val}\n`;
  });
  rels.forEach(r => {
    const target = allClasses.find(c => c.id === r.to);
    if (target && r.attributeName) {
      const val = r.isList ? '[]' : 'None';
      s += `        self.${r.attributeName}: ${r.isList ? 'List[' + target.name + ']' : target.name} = ${val}\n`;
    }
  });
  s += `\n`;
  cls.methods.forEach(m => {
    s += `    def ${m.name}(self) -> ${m.returnType}:\n        pass\n\n`;
  });
  if (cls.methods.length === 0 && cls.attributes.length === 0 && rels.length === 0) s += `    pass\n`;
  return s.trim();
}

function generateTypeScript(cls: ClassData, rels: Connection[], allClasses: ClassData[]): string {
  let s = `class ${cls.name} {\n`;
  cls.attributes.forEach(a => {
    const type = a.isList ? `${a.type}[]` : a.type;
    s += `    ${a.name}: ${type};\n`;
  });
  rels.forEach(r => {
    const target = allClasses.find(c => c.id === r.to);
    if (target && r.attributeName) {
      const type = r.isList ? `${target.name}[]` : target.name;
      s += `    ${r.attributeName}: ${type};\n`;
    }
  });
  s += `\n    constructor() {\n    }\n\n`;
  cls.methods.forEach(m => {
    s += `    ${m.name}(): ${m.returnType} {\n        // TODO\n    }\n\n`;
  });
  return s + `}`;
}

function generateCSharp(cls: ClassData, rels: Connection[], allClasses: ClassData[]): string {
  let s = `public class ${cls.name} {\n`;
  cls.attributes.forEach(a => {
    const type = a.isList ? `List<${a.type}>` : a.type;
    s += `    private ${type} ${a.name};\n`;
  });
  rels.forEach(r => {
    const target = allClasses.find(c => c.id === r.to);
    if (target && r.attributeName) {
      const type = r.isList ? `List<${target.name}>` : target.name;
      s += `    private ${type} ${r.attributeName};\n`;
    }
  });
  s += `\n    public ${cls.name}() {\n    }\n\n`;
  cls.attributes.forEach(a => {
    const type = a.isList ? `List<${a.type}>` : a.type;
    const prop = a.name.charAt(0).toUpperCase() + a.name.slice(1);
    s += `    public ${type} ${prop} { get; set; }\n`;
  });
  cls.methods.forEach(m => {
    s += `    public ${m.returnType} ${m.name}() {\n        // TODO\n    }\n\n`;
  });
  return s + `}`;
}

function generateCpp(cls: ClassData, rels: Connection[], allClasses: ClassData[]): string {
  let s = `class ${cls.name} {\nprivate:\n`;
  cls.attributes.forEach(a => {
    const type = a.isList ? `std::vector<${a.type}>` : a.type;
    s += `    ${type} ${a.name};\n`;
  });
  rels.forEach(r => {
    const target = allClasses.find(c => c.id === r.to);
    if (target && r.attributeName) {
      const type = r.isList ? `std::vector<${target.name}*>` : `${target.name}*`;
      s += `    ${type} ${r.attributeName};\n`;
    }
  });
  s += `\npublic:\n    ${cls.name}() {}\n`;
  cls.methods.forEach(m => {
    s += `    ${m.returnType} ${m.name}() {\n        // TODO\n    }\n\n`;
  });
  return s + `};`;
}
