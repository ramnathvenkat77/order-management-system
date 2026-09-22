type FileStructure = {
  fileKey: string;
  allowedSize: number;
  allowedExtensions: string[];
  colName: string;
  require: string;
};

export class MetaModel {
  modelName: string;
  fileFieldName: string;
  files: FileStructure[];

  constructor(
    name: string,
    fieldName: string,
    files: FileStructure[]
  ) {
    this.modelName = name;
    this.fileFieldName = fieldName;
    this.files = files;
  }
}