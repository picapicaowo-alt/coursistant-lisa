export interface BaseQuestionNode {
  type: 'single-choice' | 'multiple-choice' | 'blank' | 'essay' | 'upload' | 'code';
  id: string;
  required?: boolean;
  points?: number;
}

export interface SingleChoiceNode extends BaseQuestionNode {
  type: 'single-choice';
  options: Array<{
    text: string;
    correct: boolean;
  }>;
}

export interface BlankNode extends BaseQuestionNode {
  type: 'blank';
  template: string;
  blanks: Array<{
    id: string;
    maxLength?: number;
    placeholder?: string;
  }>;
}

export type QuestionNode = SingleChoiceNode | BlankNode | BaseQuestionNode;
