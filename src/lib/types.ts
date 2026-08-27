export type FieldSnapshot = {
  index: number;
  label: string;
  value: string;
  controlType: string;
  required: boolean;
  valid: boolean;
  validationMessage: string;
};

export type FindingKind = 'repeat' | 'transposition' | 'mismatch' | 'validation';

export type Finding = {
  id: string;
  kind: FindingKind;
  fieldIndexes: number[];
  title: string;
  detail: string;
};

export type ScanResult = {
  fields: FieldSnapshot[];
  findings: Finding[];
  pageTitle: string;
};

export type ProbeResult = {
  hasEditableFields: boolean;
  hasPasswordField: boolean;
};
